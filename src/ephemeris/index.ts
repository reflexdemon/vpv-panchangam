// Ephemeris service — browser (WebAssembly) engine.
// Wraps @swisseph/browser behind the same synchronous calculation API the
// calculation layer has always used. init() is async (WASM + module load).

import type { AyanamsaId } from "../types";
import type {
  CalcResult,
  EphemerisInitOptions,
  HousesResult,
  IEphemeris,
} from "./types";
import { SE } from "./types";
import { BrowserEphemeris } from "./browser";

export { SE };
export type { CalcResult, HousesResult, IEphemeris, EphemerisInitOptions };

export class EphemerisService {
  private static _instance: EphemerisService;
  private _ephe: IEphemeris;
  private _initialized = false;
  private _initPromise: Promise<void> | null = null;

  private constructor() {
    this._ephe = new BrowserEphemeris();
  }

  static getInstance(): EphemerisService {
    if (!EphemerisService._instance) {
      EphemerisService._instance = new EphemerisService();
    }
    return EphemerisService._instance;
  }

  /** Reset singleton (for testing). */
  static destroy(): void {
    (EphemerisService._instance as unknown) = undefined;
  }

  /**
   * Initialize the ephemeris service (loads the @swisseph/browser WASM engine).
   * Concurrent init() calls share the same in-flight initialization; a failure
   * clears it so a later init() attempt can retry.
   * @param options.ayanamsa Default ayanamsa (defaults to 'lahiri').
   */
  init(options: EphemerisInitOptions = {}): Promise<void> {
    if (this._initialized) return Promise.resolve();
    if (!this._initPromise) {
      this._initPromise = Promise.resolve(
        this._ephe.init({ ayanamsa: options.ayanamsa }),
      )
        .then(() => {
          this._initialized = true;
        })
        .finally(() => {
          this._initPromise = null;
        });
    }
    return this._initPromise!;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  setAyanamsa(ayanamsa: AyanamsaId): void {
    this._ephe.setAyanamsa(ayanamsa);
  }

  /** Returns the swisseph sidereal flag (0 for tropical/sayan). */
  getSiderealFlag(ayanamsa: AyanamsaId = "lahiri"): number {
    return ayanamsa === "sayan" ? 0 : SE.FLG_SIDEREAL;
  }

  /** Julian Day (Gregorian calendar). */
  julday(year: number, month: number, day: number, hour: number): number {
    return this._ephe.julday(year, month, day, hour);
  }

  /** Julian Day → [year, month, day, hour]. */
  revjul(jd: number): [number, number, number, number] {
    return this._ephe.revjul(jd);
  }

  /**
   * Calculate a planet's position at a given JD.
   * @param flags  Defaults to SWIEPH | SPEED | SIDEREAL for sidereal calcs.
   */
  calcUt(jd: number, planet: number, flags?: number): CalcResult {
    return this._ephe.calcUt(jd, planet, flags);
  }

  /**
   * Calculate house cusps and ascendant using the given house system.
   * Default: Whole Sign ('W').
   */
  housesEx(
    jd: number,
    lat: number,
    lon: number,
    hsys = "W",
    flags?: number,
  ): HousesResult {
    return this._ephe.housesEx(jd, lat, lon, hsys, flags);
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
    return this._ephe.riseTrans(jd, body, geopos, which);
  }

  /** Get current ayanamsa value (degrees) at a given JD. */
  getAyanamsaUt(jd: number): number {
    return this._ephe.getAyanamsaUt(jd);
  }

  /** Solar eclipse search (global). */
  solEclipseWhenGlob(jd: number, flags = SE.FLG_SWIEPH): unknown {
    return this._ephe.solEclipseWhenGlob(jd, flags);
  }

  /** Lunar eclipse search. */
  lunEclipseWhen(jd: number, flags = SE.FLG_SWIEPH): unknown {
    return this._ephe.lunEclipseWhen(jd, flags);
  }

  /** Day of week — ISO weekday: 1=Mon..7=Sun */
  isoWeekday(jd: number): number {
    return this._ephe.isoWeekday(jd);
  }
}
