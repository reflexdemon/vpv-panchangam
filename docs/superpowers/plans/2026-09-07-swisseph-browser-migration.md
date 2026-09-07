# Plan: Migrate ephemeris engine from swisseph (native addon) to @swisseph/browser (WebAssembly)

## Goal

Replace the native `swisseph` C++ addon with `@swisseph/browser` (WASM) so the
package works in browsers while keeping Node/CJS consumers working. All research
below has been **verified live** against both engines at JD 2458271.5 / Lahiri.
This plan executes the approved design in `docs/superpowers/specs/2026-09-07-swisseph-browser-migration-design.md`.

Phase 1: add a facade with two adapters (`NativeEphemeris`, `BrowserEphemeris`)
behind `EphemerisService`, A/B-verified for parity. Phase 2: default to the
browser engine, delete the native adapter + `swisseph` dependency.

## Verified facts (do not re-research)

- `@swisseph/browser@1.3.1` is **ESM-only**. `tsc --module commonjs` rewrites
  `import()` into `require()` (`__importStar`), which **fails** for an ESM-only sidecar.
  All access must use the eval-trick: `new Function("s", "return import(s)")`.
  Verified end-to-end through compiled CJS output.
- In Node the wasm is loaded from `import.meta.url` (a `file:` URL) → `fetch(file:)`
  throws. Node ≥ 20 has `fetch`/`Response` globals but no `file:` transport, so a
  one-time **fetch shim** is needed: wrap `globalThis.fetch`; on `file:` input, read
  bytes and return `new Response(new Uint8Array(bytes), {headers: {"Content-Type": "application/wasm"}})`.
  Then `await swe.init()` (no arg) works.
- **`setSiderealMode` is mandatory.** Default ayanamsa is Fagan/Bradley (~0.88° off).
  `bsw.setSiderealMode(SiderealMode.Lahiri, 0, 0)` yields the exact native result.
- Locked method mappings (browser): `calcUt(jd,planet,flags)` → `calculatePosition(jd,planet,flags)`
  returning `{lon:longitude, lat:latitude, dist:distance, speed:longitudeSpeed}`;
  `getAyanamsaUt(jd)` → `getAyanamsa(jd)`; `julday(y,m,d,h)` → `julianDay(y,m,d,h)`;
  `revjul(jd)` → `julianDayToDate(jd, CalendarType.Gregorian=1)`.
- **housesEx (sidereal)** → `calculateHouses(jd,lat,lon,hsys)` (always tropical) then
  subtract `getAyanamsaExUt(jd, FLG_SWIEPH|FLG_SIDEREAL)` (24.11040576) from every
  cusp + `ascendant` + `mc`. Ascendant parity is EXACT (43.63172177 both). NOTE:
  browser whole-sign ('W') cusps are sign boundaries (60,90,120…); the native binding
  returns nonstandard 'W' cusps. **Only `.ascendant` is consumed** in src
  (`calculate.ts:127`, `sunrise.ts:140`) — A/B parses assert ascendant only.
- **isoWeekday** → closed form `(Math.floor(jd + 0.5) % 7) + 1` (1=Mon..7=Sun),
  verified equal to native `swe_day_of_week + 1` on 4 JDs. (The design spec's
  `floor(jd+1.5)` variant is wrong — use `+0.5`.)
- **CRITICAL:** the current native adapter's `riseTrans` is **broken** — it passes
  the `geopos` array as ONE argument (8 args) to a binding that requires 10
  `(jd, body, "", FLG_SWIEPH, which, lon, lat, height, 1013.25, 15)`. The 8-array call
  returns a WRONG non-null value (2458270.5833 ≈ 02:00 UT) instead of the true Ujjain
  sunrise 2458270.5075 (~00:18 UT). Tests pass only via null-coalescing fallbacks.
  In Phase 1 keep `NativeEphemeris.riseTrans` **verbatim** (behavior unchanged);
  the A/B test compares browser rise/set against a **direct corrected 10-flat swisseph
  call** as the oracle. Browser = correct by construction; native becomes correct too
  only after Phase 2 removes it.
- Browser rise/set self-implementation validated ≤ 0.1 min vs corrected native for
  all 5 events (sunrise/sunset/nextSunrise/moonrise/moonset). Algorithm below.
- Eclipses: `findNextSolarEclipse(jd, flags, type?, backward?)` / `findNextLunarEclipse(...)`
  return `{start, peak, end, ret}`. Unused in prod — thin wrappers, interface returns `unknown`.
- Enum/constant parity: `Planet` SUN=0..MEAN_NODE=10; `CalculationFlag.SwissEphemeris=2,
  Speed=256, Sidereal=65536, Equatorial=2048`; `SiderealMode` Lahiri=1/Raman=3/Krishnamurti=5/
  TrueCitra=27/TrueRevati=28 — matches existing `AYANAMSA_MAP`; `CalendarType` Julian=0/Gregorian=1;
  `HouseSystem` is a **string** enum ("W", "P", "K", …) — native used `hsys.charCodeAt(0)`.
- sync→async: `computeChart`, `computeDetailedPanchang`, `test/setup.ts`,
  `panchang.test.ts` (beforeAll 21-23), `muhurta-gowri-hora.test.ts` (beforeAll 24-33)
  must become async. Nested beforeAlls at muhurta 194/288/357 need no init.
- Every numeric SE constant in the current facade is a literal number in the native
  package; keep `SE` as literals so Phase 2 can drop the `swisseph` import cleanly.
- Package: no bundler, `files: ["dist/"]`, `main: dist/index.js`, build = `tsc`.
  `@swisseph/browser` ships `dist/swisseph.wasm` resolvable from its own package —
  no wasm needs copying into `dist/`.

## Design

New files:
- `src/ephemeris/types.ts` — `EngineId`, `CalcResult`, `HousesResult`, `EphemerisInitOptions`,
  `IEphemeris` interface, `SE` numeric constants, `AYANAMSA_MODE_TO_BROWSER` mapping helper.
- `src/ephemeris/native.ts` — `NativeEphemeris implements IEphemeris`
  (verbatim move of current behavior; sync `init`).
- `src/ephemeris/browser.ts` — `BrowserEphemeris implements IEphemeris`
  (async `init`, eval-import, fetch shim, mappings above).
- `src/ephemeris/index.ts` → facade `EphemerisService` (unchanged public API, now async
  `init`, engine selection default `"native"`), `SE` re-export.

Interface (`IEphemeris`): `initialized`, `init(options)`, `setAyanamsa(id)`,
`getSiderealFlag(id)`, `julday`, `revjul`, `calcUt`, `housesEx`, `riseTrans`,
`getAyanamsaUt`, `isoWeekday`, `solEclipseWhenGlob`, `lunEclipseWhen`.
`init` returns `void | Promise<void>`; facade awaits.

`EphemerisInitOptions = { engine?: "native" | "browser"; ephePath?: string; ayanamsa?: AyanamsaId }`.
`init()` no-arg keeps today's defaults (native, lahiri).

## Tasks

### 1. Add dependency

- [x] `npm install @swisseph/browser@^1.3.1` (adds to `dependencies`; native `swisseph` stays through Phase 1).
- [x] Verify resolution: `node -e "console.log(require.resolve('@swisseph/browser'))"` shows `dist/swisseph-browser.js` (ESM, no require). Commit: `chore: add @swisseph/browser dependency`.

### 2. Extract `types.ts`

- [x] Create `src/ephemeris/types.ts` with `EngineId`, `CalcResult`, `HousesResult`,
  `EphemerisInitOptions`, `IEphemeris`, and `SE` constants as literals:
  `SUN=0,MOON=1,MERCURY=2,VENUS=3,MARS=4,JUPITER=5,SATURN=6,URANUS=7,NEPTUNE=8,PLUTO=9,MEAN_NODE=10,
  FLG_SWIEPH=2,FLG_SPEED=256,FLG_SIDEREAL=65536,CALC_RISE=1,CALC_SET=2,GREG_CAL=1`.
- [x] Verify: `npx tsc --noEmit`. Commit: `refactor: extract ephemeris types and SE constants`.

### 3. Move current behavior to `NativeEphemeris` (behavior-identical)

- [x] Create `src/ephemeris/native.ts` exporting `NativeEphemeris implements IEphemeris`.
  Move the body of `EphemerisService` verbatim (sync `init`, `swe_set_ephe_path`,
  `setAyanamsa` via `swe_set_sid_mode`, `housesEx` with `hsys.charCodeAt(0)`,
  **broken** `riseTrans` unchanged, eclipse wrappers, isoWeekday via `swe_day_of_week`).
  Keep `import * as swe from "swisseph"`.
- [x] Rewrite `src/ephemeris/index.ts` as facade: keep `getInstance`, `destroy`,
  `initialized`, `init(options)` (async), `setAyanamsa`, `getSiderealFlag`, and
  delegate all methods to an internal `IEphemeris` (default `new NativeEphemeris()`).
  Re-export `SE` (from types) using `export { SE }`.
- [x] Update `test/setup.ts`: `beforeAll(async () => { await ephe.init(); })`.
- [x] Verify behavior-identical refactor: `npm test` green (native default), `npm run lint`, `npm run format:check`, `npm run build`.
  Commit: `refactor: isolate native ephemeris adapter behind facade`.

### 4. `BrowserEphemeris`

- [x] Create `src/ephemeris/browser.ts`:
  - module-scope `const dynamicImport = new Function("s", "return import(s)") as (s: string) => Promise<any>;`
  - Node detection (`typeof process !== "undefined" && process.versions?.node`); if Node,
    install one-time fetch shim (`file:` → Response with wasm content-type).
  - `load()`: `const mod = await dynamicImport("@swisseph/browser"); this._swe = new mod.SwissEphemeris(); await this._swe.init();`
  - `init(options)`: set ayanamsa mode (for `sayan` skip `setSiderealMode`).
  - `setAyanamsa`: `this._swe.setSiderealMode(mode, 0, 0)` — MUST be set before any
    sidereal calc, using `AYANAMSA_MAP[id].mode` (Lahiri=1, …); throw on unknown.
  - `calcUt`: `calculatePosition(jd, planet, flags)` → map `longitude/latitude/distance/longitudeSpeed`.
  - `housesEx(jd,lat,lon,hsys,flags)`: `calculateHouses(jd,lat,lon,hsys)`;
    if `flags & SE.FLG_SIDEREAL` subtract `swe.getAyanamsaExUt(jd, FLG_SWIEPH|FLG_SIDEREAL)`
    from cusps, ascendant, mc (no wrap). Normalize `cusps` to length 13 (pad 0).
  - `getAyanamsaUt(jd)`: `this._swe.getAyanamsa(jd)`.
  - `revjul(jd)`: `julianDayToDate(jd, 1)` → `[d.year, d.month, d.day, d.hour]`.
  - `isoWeekday(jd)`: `(Math.floor(jd + 0.5) % 7) + 1`.
  - `riseTrans(jd, body, geopos, which)`: self-implementation (algorithm below).
  - `solEclipseWhenGlob` / `lunEclipseWhen`: call `findNext{solar,lunar}Eclipse(jd, flags)`, return as `unknown`.
- [x] Verify: temporary script `browser.ts` smoke → sidereal Sun lon 47.31911701 at
  JD 2458271.5, ascendant 43.63172 (Ujjain), weekday parity. Commit: `feat: add browser (WASM) ephemeris adapter`.

Transit algorithm (validated ≤0.1 min): alt0 Sun −0.8333°, Moon −0.5667−0.2583;
coarse scan step 0.02 d over 1.6-d window from `jd − 0.2`; `pos = calculatePosition(t, body, Equatorial|Speed)`
→ RA=longitude, Dec=latitude, dist=distance (AU); GMST(deg)=280.46061837+360.98564736629*(t−2451545.0) mod 360;
`sinAlt = sinφ·sinδ + cosφ·cosδ·cos(GMST+lon−RA)`; Moon parallax `p = asin(6378.137/(dist·149597870.7))`,
alt = `asin(sinAlt) − p·cos(alt)`. Locate sign change with correct slope (rise: crossing up, set: down;
`f(t)` crossing alt0), bisect ×60, return mid-JD or `null` if no crossing.

### 5. A/B parity test

- [x] New `test/ephemeris-parity.test.ts` (after `types.ts`/`NativeEphemeris` exist).
  Locations/dates from `test/helpers.ts` (UJJAIN, KELOWNA, ALPHARETTA; JD 2458271.5 + one summer/winter date and a 1582 Gregorian date).
  Matrix over planets 0..10 and ayanamsas `["lahiri","sayani","raman","kp_new","kp_khullar","manoj"]`.
  Assert, for native vs browser adapters:
  - `calcUt` lon/lat/dist/speed, tolerance lon 2e-4° (both engines? real tolerance verified native≈browser ≤1e-5 for Lahiri), dist 1e-6 AU, speed 1e-5.
  - `getAyanamsaUt` exact to 1e-8.
  - `julday` / `revjul` round-trip exact.
  - `isoWeekday` equality.
  - `housesEx.ascendant` equality to 1e-4 for 'W', 'P', 'K' hsys (topocatical/whole).
  - `riseTrans` (Sun+Moon, rise+set): **browser vs direct corrected 10-flat swisseph oracle**, tolerance 0.002 JD. Record that the old adapter is buggy; do NOT call adapter's riseTrans.
- [x] `npm test` green. Commit: `test: add native-vs-browser ephemeris parity suite`.

### 6. Async init in public API

- [x] `src/api/get-panchang.ts:122` and `src/api/calculate.ts:96`:
  `if (!ephe.initialized) await ephe.init();` (both callers already `async`).
- [x] `test/panchang.test.ts` beforeAll → `async` + `await ephe.init()`.
- [x] `test/muhurta-gowri-hora.test.ts` beforeAll (24-33) → `async` + `await ephe.init()`.
- [x] Verify `npm test`, `npm run lint`, `npm run build`. Commit: `refactor: make ephemeris init async`.

### 7. Phase 2 — switch to browser, drop native

- [x] Change facade default engine to `"browser"`; keep optional `engine:"native"` behind an env/option flag for debugging **only if `EPHE_ENGINE=native`**.
- [x] Update README + design spec status notes: AGPL-3.0 notice (wasm is AGPL-3.0), browser support, `engines.node>=20` requirement stays.
- [x] Remove `NativeEphemeris` file, `swisseph` from dependencies (`npm uninstall swisseph`).
- [x] Verify: `npm test` (parity suite removes native side; panchang/muhurta suites now exercise browser default), `npm run lint`, `npm run format:check`, `npm run build`, then `npm pack --dry-run` to confirm `dist/` only + no swisseph linkage.
- [x] `npm run test:coverage` sanity. Commit: `feat!: switch ephemeris engine to @swisseph/browser (WASM)`.

## Acceptance

- Full suite green with browser engine default.
- No `require("swisseph")`/`import … from "swisseph"` anywhere outside git history.
- Browser target verified via the parity test's browser adapter (dynamic import path) and a
  smoke that the compiled `dist` CJS build loads the engine through the eval-import + shim.
- Rise/set in panchang output now matches true astronomical values for Ujjain
  (2018-06-01 sunrise ≈ 00:18 UT; previously ≈ 02:00 UT due to adapter bug).