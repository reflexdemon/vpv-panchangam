// Shared ephemeris types and constant definitions.
// SE values are numeric literals matching swisseph (native) and @swisseph/browser.

import type { AyanamsaId } from "../types";
import { AYANAMSA_MAP } from "../constants/planets";

export type EngineId = "native" | "browser";

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

export interface EphemerisInitOptions {
  engine?: EngineId;
  ephePath?: string;
  ayanamsa?: AyanamsaId;
}

/**
 * Swiss Ephemeris planet / flag / calendar constants, as plain numbers.
 * Values match both the `swisseph` npm addon and `@swisseph/browser`.
 */
export const SE = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  MEAN_NODE: 10, // Rahu

  FLG_SWIEPH: 2,
  FLG_SPEED: 256,
  FLG_SIDEREAL: 65536,

  CALC_RISE: 1,
  CALC_SET: 2,

  GREG_CAL: 1,
} as const;

export interface IEphemeris {
  readonly initialized: boolean;

  /** Initialize the engine. May be synchronous (native) or async (browser). */
  init(options?: EphemerisInitOptions): void | Promise<void>;

  /** Set the ayanamsa mode used for sidereal calculations. */
  setAyanamsa(ayanamsa: AyanamsaId): void;

  /** Returns the sidereal flag (0 for tropical/sayan). */
  getSiderealFlag(ayanamsa?: AyanamsaId): number;

  /** Julian Day (Gregorian calendar). */
  julday(year: number, month: number, day: number, hour: number): number;

  /** Julian Day → [year, month, day, hour]. */
  revjul(jd: number): [number, number, number, number];

  /** Calculate a planet's position at a given JD. */
  calcUt(jd: number, planet: number, flags?: number): CalcResult;

  /** Calculate house cusps and ascendant. */
  housesEx(
    jd: number,
    lat: number,
    lon: number,
    hsys?: string,
    flags?: number,
  ): HousesResult;

  /** Find rise or set time; null if not found (circumpolar, etc.). */
  riseTrans(
    jd: number,
    body: number,
    geopos: [number, number, number],
    which: number,
  ): number | null;

  /** Ayanamsa value (degrees) at a given JD. */
  getAyanamsaUt(jd: number): number;

  /** ISO weekday: 1=Mon..7=Sun. */
  isoWeekday(jd: number): number;

  /** Solar eclipse search (global). */
  solEclipseWhenGlob(jd: number, flags?: number): unknown;

  /** Lunar eclipse search. */
  lunEclipseWhen(jd: number, flags?: number): unknown;
}

/** Map an AyanamsaId to the @swisseph/browser SiderealMode value (or null). */
export function ayanamsaToSiderealMode(ayanamsa: AyanamsaId): number | null {
  const config = AYANAMSA_MAP[ayanamsa];
  if (!config) throw new Error(`Unknown ayanamsa: ${ayanamsa}`);
  return config.mode;
}
