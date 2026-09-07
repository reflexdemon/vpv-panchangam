// Ephemeris facade — selects between the native addon and the WASM browser engine.
// The engine is chosen at init() time (default: 'native' during migration,
// 'browser' once the native addon is removed).

import type { AyanamsaId } from "../types";
import type {
  CalcResult,
  EngineId,
  EphemerisInitOptions,
  HousesResult,
  IEphemeris,
} from "./types";
import { SE } from "./types";
import { NativeEphemeris } from "./native";

export { SE };
export type {
  CalcResult,
  HousesResult,
  EngineId,
  IEphemeris,
  EphemerisInitOptions,
};

export class EphemerisService {
  private static _instance: EphemerisService;
  private _ephe: IEphemeris;
  private _initialized = false;

  private constructor() {
    this._ephe = new NativeEphemeris();
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
   * Initialize the ephemeris service.
   * @param options.engine   Which engine to use ('native' default for now).
   * @param options.ephePath Optional path to ephemeris data files.
   * @param options.ayanamsa Default ayanamsa (defaults to 'lahiri').
   */
  async init(options: EphemerisInitOptions = {}): Promise<void> {
    if (this._initialized) return;
    const engine: EngineId = options.engine ?? "native";

    if (engine === "browser") {
      const { BrowserEphemeris } = await import("./browser");
      this._ephe = new BrowserEphemeris();
    } else {
      this._ephe = new NativeEphemeris();
    }
    await this._ephe.init({
      ephePath: options.ephePath,
      ayanamsa: options.ayanamsa,
    });
    this._initialized = true;
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
