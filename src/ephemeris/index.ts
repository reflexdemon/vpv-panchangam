// Swiss Ephemeris adapter — wraps the swisseph 0.5.x npm package
// All methods are synchronous (swisseph is a native C++ addon).

import * as swe from "swisseph";
import type { AyanamsaId } from "../types";
import { AYANAMSA_MAP, SideralMode } from "../constants/planets";

// Re-export swisseph planet / flag constants under clean names
export const SE = {
  SUN: (swe as any).SE_SUN as number,
  MOON: (swe as any).SE_MOON as number,
  MERCURY: (swe as any).SE_MERCURY as number,
  VENUS: (swe as any).SE_VENUS as number,
  MARS: (swe as any).SE_MARS as number,
  JUPITER: (swe as any).SE_JUPITER as number,
  SATURN: (swe as any).SE_SATURN as number,
  URANUS: (swe as any).SE_URANUS as number,
  NEPTUNE: (swe as any).SE_NEPTUNE as number,
  PLUTO: (swe as any).SE_PLUTO as number,
  MEAN_NODE: (swe as any).SE_MEAN_NODE as number, // Rahu

  FLG_SWIEPH: (swe as any).SEFLG_SWIEPH as number, // 2
  FLG_SPEED: (swe as any).SEFLG_SPEED as number, // 256
  FLG_SIDEREAL: (swe as any).SEFLG_SIDEREAL as number, // 65536

  CALC_RISE: (swe as any).SE_CALC_RISE as number, // 1
  CALC_SET: (swe as any).SE_CALC_SET as number, // 2

  GREG_CAL: (swe as any).SE_GREG_CAL as number,
} as const;

export interface CalcResult {
  lon: number;
  lat: number;
  dist: number;
  speed: number; // longitudinal speed (deg/day)
}

export interface HousesResult {
  cusps: number[]; // [0..12], 1-indexed: cusps[1]..cusps[12]
  ascendant: number;
  mc: number;
}

export class EphemerisService {
  private static _instance: EphemerisService;
  private _initialized = false;

  private constructor() {}

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
   * @param ephePath  Optional path to ephemeris data files.
   *                  Defaults to the bundled path inside node_modules/swisseph.
   * @param ayanamsa  Default ayanamsa (defaults to 'lahiri').
   */
  init(ephePath?: string, ayanamsa: AyanamsaId = "lahiri"): void {
    if (this._initialized) return;
    if (ephePath) {
      (swe as any).swe_set_ephe_path(ephePath);
    }
    this.setAyanamsa(ayanamsa);
    this._initialized = true;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  setAyanamsa(ayanamsa: AyanamsaId): void {
    const config = AYANAMSA_MAP[ayanamsa];
    if (!config) throw new Error(`Unknown ayanamsa: ${ayanamsa}`);
    if (config.mode !== null) {
      (swe as any).swe_set_sid_mode(config.mode as number, 0, 0);
    }
  }

  /** Returns the swisseph sidereal flag (0 for tropical/sayan). */
  getSiderealFlag(ayanamsa: AyanamsaId = "lahiri"): number {
    return ayanamsa === "sayan" ? 0 : SE.FLG_SIDEREAL;
  }

  /** Julian Day (Gregorian calendar). */
  julday(year: number, month: number, day: number, hour: number): number {
    return (swe as any).swe_julday(
      year,
      month,
      day,
      hour,
      SE.GREG_CAL,
    ) as number;
  }

  /** Julian Day → [year, month, day, hour]. */
  revjul(jd: number): [number, number, number, number] {
    const r = (swe as any).swe_revjul(jd, SE.GREG_CAL);
    return [
      r.year as number,
      r.month as number,
      r.day as number,
      r.hour as number,
    ];
  }

  /**
   * Calculate a planet's position at a given JD.
   * @param flags  Defaults to SWIEPH | SPEED | SIDEREAL for sidereal calcs.
   */
  calcUt(jd: number, planet: number, flags?: number): CalcResult {
    const f = flags ?? SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
    const r = (swe as any).swe_calc_ut(jd, planet, f);
    return {
      lon: r.longitude as number,
      lat: r.latitude as number,
      dist: r.distance as number,
      speed: r.longitudeSpeed as number,
    };
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
    const f = flags ?? SE.FLG_SIDEREAL;
    const r = (swe as any).swe_houses_ex(jd, f, lat, lon, hsys.charCodeAt(0));
    // swisseph returns r.house as 1-indexed array [undefined, c1, c2, ..., c12]
    // OR a 0-indexed Float64Array depending on the binding version.
    const cusps: number[] = new Array(13).fill(0);
    if (r.house) {
      if (Array.isArray(r.house)) {
        // 0-indexed [c1..c12]
        for (let i = 0; i < 12; i++) cusps[i + 1] = r.house[i] as number;
      } else {
        // typed array
        for (let i = 0; i < 12; i++)
          cusps[i + 1] = (r.house as Float64Array)[i];
      }
    }
    return {
      cusps,
      ascendant: (r.ascendant ?? cusps[1]) as number,
      mc: r.mc as number,
    };
  }

  /**
   * Find rise or set time.
   * @param which  SE.CALC_RISE or SE.CALC_SET
   * @param geopos [longitude, latitude, altitude_m]
   * @returns JD of event or null if not found (circumpolar, etc.)
   */
  riseTrans(
    jd: number,
    body: number,
    geopos: [number, number, number],
    which: number,
  ): number | null {
    try {
      const r = (swe as any).swe_rise_trans(
        jd,
        body,
        "",
        SE.FLG_SWIEPH,
        which,
        geopos,
        1013.25,
        15,
      );
      if (r && r.transitTime != null) return r.transitTime as number;
    } catch {
      // fall-through
    }
    return null;
  }

  /** Get current ayanamsa value (degrees) at a given JD. */
  getAyanamsaUt(jd: number): number {
    return (swe as any).swe_get_ayanamsa_ut(jd) as number;
  }

  /** Solar eclipse search (global). */
  solEclipseWhenGlob(jd: number, flags = SE.FLG_SWIEPH): unknown {
    return (swe as any).swe_sol_eclipse_when_glob(jd, flags);
  }

  /** Lunar eclipse search. */
  lunEclipseWhen(jd: number, flags = SE.FLG_SWIEPH): unknown {
    return (swe as any).swe_lun_eclipse_when(jd, flags);
  }

  /** Day of week — ISO weekday: 1=Mon..7=Sun */
  isoWeekday(jd: number): number {
    // swe_day_of_week returns {dayOfWeek: 0=Mon..6=Sun}
    const r = (swe as any).swe_day_of_week(jd);
    const d =
      typeof r === "object" ? ((r as any).dayOfWeek as number) : (r as number);
    return d + 1; // convert to 1-7
  }
}
