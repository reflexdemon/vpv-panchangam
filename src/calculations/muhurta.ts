/**
 * Auspicious and inauspicious timing windows.
 * All computations are based on the day/night muhurta division.
 */

import type { EphemerisService } from "../ephemeris";
import type { TimeWindow } from "../types";
import { jdToIso } from "./panchang";
import {
  RAHU_KAAL_SEGMENT,
  YAMAGANDA_SEGMENT,
  GULIKA_SEGMENT,
} from "../constants/panchang";
import { DUR_MUHURTA, ABHIJIT_MUHURTA_INDEX } from "../constants/muhurta";
import {
  SARVARTHA_SIDDHI,
  AMRITA_SIDDHI,
  VARJYAM_GHATIKAS,
  VARJYAM_DURATION_GHATIKAS,
  AMRIT_GHATIKAS,
  AMRIT_KALAM_DURATION_GHATIKAS,
} from "../constants/muhurta";

const GHATIKAS_PER_DAY = 60;
const MINS_PER_GHATIKA = 24; // 1 ghatika = 24 min

function jdToWin(
  startJd: number,
  endJd: number,
  ephe: EphemerisService,
): TimeWindow {
  return { start: jdToIso(startJd, ephe), end: jdToIso(endJd, ephe) };
}

/**
 * Compute the 30 muhurta windows (15 day + 15 night) from sunrise to next sunrise.
 * Returns 1-indexed: [0] is a placeholder, [1]..[30] are the muhurtas.
 */
export function muhurtaWindows(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
): Array<[number, number]> {
  const dayDur = sunsetJd - sunriseJd;
  const nightDur = nextSunriseJd - sunsetJd;
  const dayMuh = dayDur / 15;
  const nightMuh = nightDur / 15;

  const wins: Array<[number, number]> = [[0, 0]]; // placeholder index 0
  for (let i = 0; i < 15; i++) {
    wins.push([sunriseJd + i * dayMuh, sunriseJd + (i + 1) * dayMuh]);
  }
  for (let i = 0; i < 15; i++) {
    wins.push([sunsetJd + i * nightMuh, sunsetJd + (i + 1) * nightMuh]);
  }
  return wins;
}

/**
 * Brahma Muhurta: the 14th night muhurta (2nd muhurta before sunrise),
 * computed against the night that *ends* at today's sunrise
 * (i.e. prevSunsetJd → sunriseJd).
 */
export function brahmaMuhurta(
  prevSunsetJd: number,
  sunriseJd: number,
  ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (sunriseJd - prevSunsetJd) / 15;
  return jdToWin(sunriseJd - 2 * nightMuh, sunriseJd - nightMuh, ephe);
}

/** Pratah Sandhya: the 1.5 night-muhurtas immediately before sunrise. */
export function pratahSandhya(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (nextSunriseJd - sunsetJd) / 15;
  return jdToWin(sunriseJd - 1.5 * nightMuh, sunriseJd, ephe);
}

/** Abhijit Muhurta: 8th muhurta (middle of the day) */
export function abhijitMuhurta(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  weekday: number,
  ephe: EphemerisService,
): TimeWindow | null {
  // Wednesday's Dur Muhurta at index 8 suppresses Abhijit
  if (DUR_MUHURTA[weekday]?.includes(ABHIJIT_MUHURTA_INDEX)) return null;
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(
    wins[ABHIJIT_MUHURTA_INDEX][0],
    wins[ABHIJIT_MUHURTA_INDEX][1],
    ephe,
  );
}

/** Vijay Muhurta: 11th muhurta of the day (day muhurta #11) */
export function vijayMuhurta(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  ephe: EphemerisService,
): TimeWindow {
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(wins[11][0], wins[11][1], ephe);
}

/**
 * Godhuli Muhurta: half a night-muhurta starting at sunset.
 * The muhurta length is derived from the night beginning at sunset
 * (sunsetJd → nextSunriseJd).
 */
export function godhuliMuhurta(
  sunsetJd: number,
  nextSunriseJd: number,
  ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (nextSunriseJd - sunsetJd) / 15;
  return jdToWin(sunsetJd, sunsetJd + nightMuh / 2, ephe);
}

/** Sayahna Sandhya: the 1.5 night-muhurtas immediately after sunset. */
export function sayahnaSandhya(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (nextSunriseJd - sunsetJd) / 15;
  return jdToWin(sunsetJd, sunsetJd + 1.5 * nightMuh, ephe);
}

/** Nishita Muhurta: midnight muhurta (22nd-23rd, i.e. 8th night muhurta) */
export function nishitaMuhurta(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  ephe: EphemerisService,
): TimeWindow {
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(wins[23][0], wins[23][1], ephe);
}

/**
 * Dur Muhurtam windows for a given weekday.
 * Returns an array of TimeWindow (one or two bad muhurtas per day).
 */
export function durMuhurtam(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  weekday: number,
  ephe: EphemerisService,
): TimeWindow[] {
  const indices = DUR_MUHURTA[weekday] ?? [];
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return indices.map((i) => jdToWin(wins[i][0], wins[i][1], ephe));
}

/**
 * Rahu Kalam window (1/8 of daylight, starting at segment index from table).
 */
export function rahuKalam(
  sunriseJd: number,
  sunsetJd: number,
  weekday: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const seg = RAHU_KAAL_SEGMENT[weekday];
  if (!seg) return null;
  const dayDur = sunsetJd - sunriseJd;
  const segDur = dayDur / 8;
  const start = sunriseJd + (seg - 1) * segDur;
  return jdToWin(start, start + segDur, ephe);
}

/** Yamaganda window */
export function yamaganda(
  sunriseJd: number,
  sunsetJd: number,
  weekday: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const seg = YAMAGANDA_SEGMENT[weekday];
  if (!seg) return null;
  const dayDur = sunsetJd - sunriseJd;
  const segDur = dayDur / 8;
  const start = sunriseJd + (seg - 1) * segDur;
  return jdToWin(start, start + segDur, ephe);
}

/** Gulika Kalam window */
export function gulikaKalam(
  sunriseJd: number,
  sunsetJd: number,
  weekday: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const seg = GULIKA_SEGMENT[weekday];
  if (!seg) return null;
  const dayDur = sunsetJd - sunriseJd;
  const segDur = dayDur / 8;
  const start = sunriseJd + (seg - 1) * segDur;
  return jdToWin(start, start + segDur, ephe);
}

/**
 * Varjyam window from nakshatra ghatika table.
 * @param nakIdx     Current nakshatra index (0-26)
 * @param nakStartJd JD when the current nakshatra started
 * @param nakEndJd   JD when the current nakshatra ends
 */
export function varjyamWindow(
  nakIdx: number,
  nakStartJd: number,
  nakEndJd: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const ghatikaOffset = VARJYAM_GHATIKAS[nakIdx];
  if (ghatikaOffset == null) return null;
  const nakDur = nakEndJd - nakStartJd;
  const ghatikaFrac = ghatikaOffset / GHATIKAS_PER_DAY;
  const durationFrac = VARJYAM_DURATION_GHATIKAS / GHATIKAS_PER_DAY;
  const start = nakStartJd + ghatikaFrac * nakDur;
  return jdToWin(start, start + durationFrac * nakDur, ephe);
}

/**
 * Varjyam window using a custom ghatika offset (for nakshatras with a secondary window).
 */
export function varjyamWindow2(
  customGhOffset: number,
  nakIdx: number,
  nakStartJd: number,
  nakEndJd: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const nakDur = nakEndJd - nakStartJd;
  const ghatikaFrac = customGhOffset / GHATIKAS_PER_DAY;
  const durationFrac = VARJYAM_DURATION_GHATIKAS / GHATIKAS_PER_DAY;
  const start = nakStartJd + ghatikaFrac * nakDur;
  return jdToWin(start, start + durationFrac * nakDur, ephe);
}

/**
 * Amrit Kalam = nakshatra-anchored window per AMRIT_GHATIKAS table.
 */
export function amritKalamWindow(
  nakIdx: number,
  nakStartJd: number,
  nakEndJd: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const ghatikaOffset = AMRIT_GHATIKAS[nakIdx];
  if (ghatikaOffset == null) return null;
  const nakDur = nakEndJd - nakStartJd;
  const ghatikaFrac = ghatikaOffset / GHATIKAS_PER_DAY;
  const durationFrac = AMRIT_KALAM_DURATION_GHATIKAS / GHATIKAS_PER_DAY;
  const start = nakStartJd + ghatikaFrac * nakDur;
  return jdToWin(start, start + durationFrac * nakDur, ephe);
}

/**
 * Sarvartha Siddhi Yoga window: present for entire day if conditions met.
 */
export function sarvarthaSiddhiYoga(
  sunriseJd: number,
  sunsetJd: number,
  weekday: number,
  nakIdx: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const set = SARVARTHA_SIDDHI[weekday];
  if (!set || !set.has(nakIdx)) return null;
  return jdToWin(sunriseJd, sunsetJd, ephe);
}

/**
 * Amrita Siddhi Yoga window: present for entire day if conditions met.
 */
export function amritaSiddhiYoga(
  sunriseJd: number,
  sunsetJd: number,
  weekday: number,
  nakIdx: number,
  ephe: EphemerisService,
): TimeWindow | null {
  const set = AMRITA_SIDDHI[weekday];
  if (!set || !set.has(nakIdx)) return null;
  return jdToWin(sunriseJd, sunsetJd, ephe);
}

/**
 * Bhadra (Vishti karana) windows — extracted from karana sequence.
 */
export function bhadraWindows(
  karanas: Array<{
    index: number;
    name: string;
    starts_at?: string;
    ends_at: string;
  }>,
): TimeWindow[] {
  return karanas
    .filter((k) => k.name === "Vishti")
    .map((k) => ({ start: k.starts_at ?? k.ends_at, end: k.ends_at }));
}
