# Migrate ephemeris engine to `@swisseph/browser`

Date: 2026-09-07
Status: Approved design (pending spec review)

## Goal

Replace the native `swisseph` C++ addon with `@swisseph/browser` (WebAssembly) as the
single astronomical engine, so that web-based applications can also use `vedic-panchanga`.
Deliver browser support without breaking the existing Node.js consumer experience.

## Context & constraints

- `vedic-panchanga` is a published Node.js package: ESM-ready but compiled to CommonJS
  (`module: commonjs` in `tsconfig.json`), `engines.node >= 20`.
- The public entry points `computeDetailedPanchang()` and `computeChart()` already return
  Promises and are the only async surface consumers see.
- `EphemerisService` (singleton) is exported publicly from `src/index.ts` and is the single
  seam the calculation layer depends on. The calc modules (`src/calculations/*`, `src/api/*`)
  receive `ephe: EphemerisService` and call synchronous methods (`calcUt`, `housesEx`,
  `julday`, `revjul`, `riseTrans`, `getAyanamsaUt`, `setAyanamsa`, `isoWeekday`).

### Key facts verified against `@swisseph/browser@1.3.1`

- It is ESM-only, WebAssembly-based, AGPL-3.0, depends on `@swisseph/core`.
- Must call `await new SwissEphemeris().init(wasmPath?)` once; **all other calculation
  methods are synchronous** after init.
- Method mapping (sync after init): `julianDay`, `julianDayToDate`, `calculatePosition`,
  `calculateHouses`, `getAyanamsa`/`getAyanamsaExUt`, `setSiderealMode`,
  `findNextSolarEclipse`/`findNextLunarEclipse`, `getCelestialBodyName`, `version`, `close`.
- `CalculationFlag.Sidereal = 65536` (identical to old `SEFLG_SIDEREAL`) must be passed to
  `calculatePosition`/`getAyanamsaExUt` to obtain sidereal values. `setSiderealMode` alone
  does **not** make positions sidereal.
- `calculateHouses(jd, lat, lon, houseSystem)` accepts no flags and returns **tropical**
  cusps; sidereal houses must subtract the ayanamsa manually.
- **Missing features** (must be self-implemented): sunrise/sunset/moonrise/moonset
  (`riseTrans`) and ISO weekday (`isoWeekday`). A `RiseTransitSet` type exists in
  `@swisseph/core` but the browser class exposes no rise/transit or weekday method.
- WASM loading uses `fetch()`. In plain Node this fails unless `globalThis.fetch` is shimmed
  to serve `file://` wasm with `Content-Type: application/wasm` — verified working in Node
  v26. Browsers load the wasm themselves.

## Approach

Two-phase migration, using a parallel adapter + facade **only** to A/B verify parity, then
removing the native engine entirely.

- **Phase 1 — migrate & verify (parallel):** introduce a common `Iephemeris`-style typed
  interface, rename the current adapter to `NativeEphemeris` (unchanged behavior), add
  `BrowserEphemeris` (wraps `@swisseph/browser`), and a `EphemerisService` facade that can
  run either engine (default `native` during migration). Verify full panchang + chart output
  is identical across engines via an A/B test.
- **Phase 2 — final browser-only:** delete `NativeEphemeris` and the engine switch, remove
  the `swisseph` dependency, and let `EphemerisService` be the browser adapter directly.

## Architecture

```
src/ephemeris/
├── index.ts          # EphemerisService facade + public re-exports (SE constants kept)
├── types.ts          # IEephemeris interface + shared result types (CalcResult, HousesResult, ...)
├── native.ts         # Phase 1 only: NativeEphemeris (old swisseph behavior); deleted in Phase 2
└── browser.ts        # BrowserEphemeris (wraps @swisseph/browser) — the final engine
```

- `IEephemeris` exposes the same methods with the same signatures the calc modules already
  use, except `init()` becomes `Promise<void>` (async). All calc-related methods remain
  synchronous, so **`src/calculations/*` and `src/api/*` do not change** except where
  `init()` is awaited.
- `EphemerisService` keeps its singleton pattern and public export. `init()` becomes async:
  it selects the engine, and for browsers performs the dynamic `import()` of the ESM package
  from CJS, resolves the `.wasm` path, installs the Node `fetch` shim, and `await`s
  `swe.init(wasmUrl)`. On subsequent calls it is a no-op when already initialized.

### Method mapping (IEephemeris → @swisseph/browser)

| IEephemeris (current) | BrowserEphemeris implementation |
|---|---|
| `julday(y,m,d,h)` → number | `swe.julianDay(y,m,d,h)` |
| `revjul(jd)` → `[y,m,d,h]` | `swe.julianDayToDate(jd)` → normalize `{year,month,day,hour}` → tuple |
| `calcUt(jd, planet, flags)` | `swe.calculatePosition(jd, planet, flags)` → `{lon,lat,dist,speed}` |
| `housesEx(jd, lat, lon, hsys, flags?)` | tropical: `swe.calculateHouses(jd, lat, lon, hsys)`; if `FLG_SIDEREAL`, subtract ayanamsa from cusps/asc/mc |
| `getAyanamsaUt(jd)` | `swe.getAyanamsaExUt(jd, flags)` (or `getAyanamsa`, choose parity-tested variant) |
| `setAyanamsa(id)` | `swe.setSiderealMode(SiderealMode.<...>)` mapped from `AYANAMSA_MAP` |
| `solEclipseWhenGlob` / `lunEclipseWhen` | `swe.findNextSolarEclipse` / `findNextLunarEclipse` (currently unused in production) |
| `riseTrans(jd, body, geopos, which)` | **self-implemented** altitude bisection over `swe.calculatePosition` (see below) |
| `isoWeekday(jd)` | **self-implemented** closed-form JD → ISO weekday (1=Mon..7=Sun) |

The `SE` constant re-export keeps the same numeric planet/flag values (they match
`@swisseph/core` `Planet`/`CalculationFlag` values), so existing code that references
`SE.SUN`, `SE.FLG_SIDEREAL`, etc. continues to work unchanged.

### Self-implemented rise/set

Reuse the existing `src/calculations/bisection.ts` angular search engine. Compute the
body's ecliptic longitude via `calculatePosition`, derive hour angle, and search for when
the local apparent altitude crosses the horizon (with standard refraction + parallax for the
Moon). Preserve current semantics: return `null` for circumpolar/non-crossing bodies, and
support rise vs set vs transit via the `which` selector. Validated against `NativeEphemeris`
in the Phase 1 A/B test.

### Self-implemented weekday

Closed-form: `ISO weekday = ((floor(jd + 1.5) mod 7) + 1)` adjusted to ISO convention, or an
equivalent deterministic formula. No ephemeris call needed. Unit-tested for known dates.

### WASM / module loading (Node)

- Dynamic `import('@swisseph/browser')` works from the CJS build.
- The `.wasm` file must be resolvable at runtime. Resolve via package export
  `@swisseph/browser/dist/swisseph.wasm` (its `exports` map exposes it) and pass its
  `file://` URL to `init()`.
- Node requires a one-time `globalThis.fetch` shim that serves `file://` wasm bytes with
  `Content-Type: application/wasm`; install it before `init()` and only under Node.
- Browsers need none of this — the package loads its own bundled wasm.

## Data flow

1. Consumer calls `computeDetailedPanchang(...)` / `computeChart(...)` (already async).
2. Orchestration ensures `EphemerisService.getInstance().init()` has completed (auto-init).
3. Calculations run synchronously against `IEephemeris`, exactly as today.
4. Public `EphemerisService.init()` remains async; consumers using the singleton await it
   (already the pattern in `test/setup.ts`).

## Error handling

- Keep `PanchangError` / `ChartError` with existing codes.
- If browser engine `init()` fails (wasm load/import error), throw `EPHEMERIS_ERROR`.
- `riseTrans` still returns `null` on non-crossing; `init()` rethrows clear messages.

## Testing

- Existing `test/*.test.ts` suites are retained and must pass against the browser engine
  (Phase 2) and, during Phase 1, against both engines where practical.
- **New A/B parity test (Phase 1):** run `computeDetailedPanchang` and `computeChart` for
  several reference locations/dates through `native` and `browser`, assert outputs within
  tolerance (positions/houses/tithi/nakshatra/sunrise/moonrise/ayanamsa).
- Update `test/setup.ts` hook to `await` async init (already a `beforeAll`).
- Unit tests for the self-implemented `isoWeekday` (known dates) and `riseTrans`
  (KELOWNA/UJJAIN/ALPHARETTA reference cases).

## Dependencies & packaging

- Phase 1: add `@swisseph/browser` (and transitive `@swisseph/core`) to `dependencies`;
  keep `swisseph` during migration.
- Phase 2: remove `swisseph` from `dependencies`; `dist/` packaging via `files` is unchanged.
- README: document browser support, bundled wasm, removed native C++ build requirement,
  statement on AGPL-3.0 licensing, and updated `EphemerisService` async usage.

## Scope / non-goals

- No changes to the public panchang/chart API signatures.
- No dual CJS+ESM package build (keep CJS; ESM browser lib is dynamic-imported).
- No new features beyond engine migration.
