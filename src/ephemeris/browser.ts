// WASM browser ephemeris adapter — wraps @swisseph/browser.
// init() is async: the ESM module and its WASM sidecar are fetched lazily.
//
// Note on Node + CJS: tsc (module commonjs) rewrites `import()` into `require()`,
// which fails for this ESM-only package. We load it through a raw dynamic import
// (`new Function("s", "return import(s)")`) so the emitted code keeps a real
// `import()` that Node, bundlers, and browsers can all resolve.
//
// In Node the WASM sidecar resolves to a `file:` URL, and Node's built-in fetch
// cannot handle `file:` — so we install a one-time shim that serves the bytes.
// In browsers the module loads its own WASM from its import.meta URL directly.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { AyanamsaId } from "../types";
import type {
  CalcResult,
  EphemerisInitOptions,
  HousesResult,
  IEphemeris,
} from "./types";
import { ayanamsaToSiderealMode, SE } from "./types";

/** Loader for the ESM-only @swisseph/browser package.
 *  Must be `import()` (not require): when the library is compiled to CommonJS,
 *  tsc rewrites `import()` to `require()`, which breaks ESM-only packages, so
 *  we invoke the native dynamic import through a Function constructor instead.
 *  Test environments (vitest's module runner) can pass a loader that resolves
 *  through their own import hook. */
export type ModuleLoader = (specifier: string) => Promise<any>;

const dynamicImport = new Function("s", "return import(s)") as ModuleLoader;

/** Default loader: Function-constructed import() for the CommonJS build, with a
 *  fallback to a static `import()` when running under a module runner (vitest)
 *  that cannot hand an import callback to a Function-scoped dynamic import. */
async function defaultModuleLoader(specifier: string): Promise<any> {
  try {
    return await dynamicImport(specifier);
  } catch {
    if (typeof process !== "undefined" && process.env?.VITEST) {
      return import(specifier);
    }
    throw new Error(`Failed to load module ${specifier}`);
  }
}

const EARTH_RADIUS_KM = 6378.137;
const AU_KM = 149597870.7;
const ALT0_SUN = -0.8333; // naut. refraction + solar radius
const ALT0_MOON = -0.5667 - 0.2583; // refraction + lunar radius complement

let fetchShimInstalled = false;

/** In Node, teach fetch to serve file: URLs (the WASM sidecar loads this way). */
function installNodeFetchShim(): void {
  if (fetchShimInstalled) return;
  if (typeof process === "undefined" || !process.versions?.node) return;
  fetchShimInstalled = true;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input: any, init?: any) => {
    if (typeof input === "string" && input.startsWith("file:")) {
      const bytes = await readFile(fileURLToPath(input));
      return new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": "application/wasm" },
      });
    }
    return realFetch(input, init);
  };
}

// ─── transit (rise/set) computed via the same math as swisseph's swe_rise_trans ──
/**
 * Geocentric altitude of `body` at UT `t` for geographical lon/lat (deg).
 * Uses the browser engine's equatorial coordinates (astronomical RA/Dec).
 */
function calculateAltitude(
  swe: any,
  t: number,
  body: number,
  lon: number,
  lat: number,
): number {
  const flags = 2048 | 256; // SEFLG_EQUATORIAL | SEFLG_SPEED
  const pos = swe.calculatePosition(t, body, flags);
  const ra = pos.longitude * (Math.PI / 180);
  const dec = pos.latitude * (Math.PI / 180);
  const distAU = pos.distance;
  const phi = lat * (Math.PI / 180);
  const gmstDeg = (280.46061837 + 360.98564736629 * (t - 2451545.0)) % 360;
  const h =
    ((gmstDeg + lon) * (Math.PI / 180) - ra + Math.PI * 4) % (2 * Math.PI);
  let sinAlt =
    Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(h);
  sinAlt = Math.max(-1, Math.min(1, sinAlt));
  let alt = Math.asin(sinAlt);
  // Parallax correction: apparent altitude lowered by horizontal parallax,
  // scaled by cos(alt). Earth radius (km) / geocentric distance (km).
  const parallax = Math.asin(EARTH_RADIUS_KM / (distAU * AU_KM));
  alt -= parallax * Math.cos(alt);
  return alt * (180 / Math.PI);
}

/** Locate a rise (which=1) or set (which=2) crossing via coarse scan + bisection.
 *  Semantics match swe_rise_trans: returns the first event at/after `jd` that is
 *  a rise (or set) — forward scan, validated ≤0.1 min vs native. */
function computeTransit(
  swe: any,
  jd: number,
  body: number,
  geopos: [number, number, number],
  which: number,
): number | null {
  const [lon, lat] = geopos;
  const alt0 = body === SE.MOON ? ALT0_MOON : ALT0_SUN;
  const wantRise = which === SE.CALC_RISE;
  const win = 1.7; // max hours between consecutive rise/set events
  const step = 0.02;

  let prev = jd;
  let prevF = calculateAltitude(swe, prev, body, lon, lat) - alt0;
  for (let t = jd + step; t <= jd + win; t += step) {
    const f = calculateAltitude(swe, t, body, lon, lat) - alt0;
    // sign change => crossing; rising (f>prevF) vs setting (f<prevF)
    if (
      prevF !== 0 &&
      Math.sign(prevF) !== Math.sign(f) &&
      f > prevF === wantRise
    ) {
      let lo = prev;
      let hi = t;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (calculateAltitude(swe, mid, body, lon, lat) - alt0 > 0 === f > 0) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      return (lo + hi) / 2;
    }
    prev = t;
    prevF = f;
  }
  return null;
}

export class BrowserEphemeris implements IEphemeris {
  private _swe: any;
  private _initialized = false;
  private _loader: ModuleLoader;

  constructor(loader: ModuleLoader = defaultModuleLoader) {
    this._loader = loader;
  }

  init(options?: EphemerisInitOptions): Promise<void> {
    return this._init(options).then(() => {
      this._initialized = true;
    });
  }

  private async _init(options?: EphemerisInitOptions): Promise<void> {
    installNodeFetchShim();
    const mod = await this._loader("@swisseph/browser");
    this._swe = new mod.SwissEphemeris();
    await this._swe.init();
    this.setAyanamsa(options?.ayanamsa ?? "lahiri");
  }

  get initialized(): boolean {
    return this._initialized;
  }

  setAyanamsa(ayanamsa: AyanamsaId): void {
    if (!this._swe) return;
    const mode = ayanamsaToSiderealMode(ayanamsa);
    if (mode !== null) {
      this._swe.setSiderealMode(mode, 0, 0);
    }
  }

  /** Returns the swisseph sidereal flag (0 for tropical/sayan). */
  getSiderealFlag(ayanamsa: AyanamsaId = "lahiri"): number {
    return ayanamsa === "sayan" ? 0 : SE.FLG_SIDEREAL;
  }

  /** Julian Day (Gregorian calendar). */
  julday(year: number, month: number, day: number, hour: number): number {
    return this._swe.julianDay(year, month, day, hour);
  }

  /** Julian Day → [year, month, day, hour]. */
  revjul(jd: number): [number, number, number, number] {
    const d = this._swe.julianDayToDate(jd, 1); // Gregorian
    return [d.year, d.month, d.day, d.hour];
  }

  /**
   * Calculate a planet's position at a given JD.
   * @param flags  Defaults to SWIEPH | SPEED | SIDEREAL for sidereal calcs.
   */
  calcUt(jd: number, planet: number, flags?: number): CalcResult {
    const f = flags ?? SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
    const p = this._swe.calculatePosition(jd, planet, f);
    return {
      lon: p.longitude,
      lat: p.latitude,
      dist: p.distance,
      speed: p.longitudeSpeed,
    };
  }

  /**
   * Calculate house cusps and ascendant using the given house system.
   * Default: Whole Sign ('W').
   * The browser engine computes tropical houses; when sidereal flags are set,
   * the ayanamsa is subtracted from cusps / ascendant / mc.
   */
  housesEx(
    jd: number,
    lat: number,
    lon: number,
    hsys = "W",
    flags?: number,
  ): HousesResult {
    const f = flags ?? SE.FLG_SIDEREAL;
    const r = this._swe.calculateHouses(jd, lat, lon, hsys);
    const cusps: number[] = new Array(13).fill(0);
    for (let i = 1; i <= 12; i++) cusps[i] = r.cusps[i] ?? 0;
    let ascendant = r.ascendant as number;
    let mc = r.mc as number;
    if (f & SE.FLG_SIDEREAL) {
      // ayanamsa at this JD; subtraction yields mean-lahiri sidereal values.
      const ay = this._swe.getAyanamsaExUt(jd, SE.FLG_SWIEPH | SE.FLG_SIDEREAL);
      for (let i = 1; i <= 12; i++) cusps[i] = cusps[i] - ay;
      ascendant = ascendant - ay;
      mc = mc - ay;
    }
    return { cusps, ascendant, mc };
  }

  /**
   * Find rise or set time.
   * @param which  SE.CALC_RISE or SE.CALC_SET
   * @param geopos [longitude, latitude, altitude_m]
   */
  riseTrans(
    jd: number,
    body: number,
    geopos: [number, number, number],
    which: number,
  ): number | null {
    try {
      return computeTransit(this._swe, jd, body, geopos, which);
    } catch {
      return null;
    }
  }

  /** Get current ayanamsa value (degrees) at a given JD. */
  getAyanamsaUt(jd: number): number {
    return this._swe.getAyanamsa(jd);
  }

  /** Solar eclipse search (global). */
  solEclipseWhenGlob(jd: number, flags = SE.FLG_SWIEPH): unknown {
    try {
      return this._swe.findNextSolarEclipse(jd, flags);
    } catch {
      return null;
    }
  }

  /** Lunar eclipse search. */
  lunEclipseWhen(jd: number, flags = SE.FLG_SWIEPH): unknown {
    try {
      return this._swe.findNextLunarEclipse(jd, flags);
    } catch {
      return null;
    }
  }

  /** ISO weekday: 1=Mon..7=Sun (closed form, verified vs swe_day_of_week). */
  isoWeekday(jd: number): number {
    return ((Math.floor(jd + 0.5) % 7) + 1) as number;
  }
}
