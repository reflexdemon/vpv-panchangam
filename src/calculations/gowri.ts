/**
 * Gowri Panchangam — 8 day + 8 night segments cycling through Gowri names.
 */

import type { GowriPanchanga, GowriSegment } from "../types";
import { GOWRI_DAY_START } from "../constants/muhurta";
import { jdToIso } from "./panchang";
import type { EphemerisService } from "../ephemeris";

const GOWRI_NAMES = [
  "Soram",
  "Uthi",
  "Visham",
  "Amridha",
  "Rogam",
  "Labam",
  "Dhanam",
  "Sugam",
];
const AUSPICIOUS_GOWRI = new Set([
  "Amridha",
  "Sugam",
  "Labam",
  "Dhanam",
  "Uthi",
]);

/**
 * Compute Gowri Panchangam for one day.
 *
 * @param sunriseJd      JD of sunrise
 * @param sunsetJd       JD of sunset
 * @param nextSunriseJd  JD of next sunrise
 * @param weekday        ISO weekday (1=Mon .. 7=Sun)
 */
export function computeGowri(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  weekday: number,
  ephe: EphemerisService,
): GowriPanchanga {
  const dayStart = GOWRI_DAY_START[weekday] ?? 0;
  const nightStart = (dayStart + 5) % 8;

  const dayDur = (sunsetJd - sunriseJd) / 8;
  const nightDur = (nextSunriseJd - sunsetJd) / 8;

  const day: GowriSegment[] = [];
  for (let i = 0; i < 8; i++) {
    const name = GOWRI_NAMES[(dayStart + i) % 8]!;
    const start = sunriseJd + i * dayDur;
    const end = start + dayDur;
    day.push({
      name,
      auspicious: AUSPICIOUS_GOWRI.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe),
    });
  }

  const night: GowriSegment[] = [];
  for (let i = 0; i < 8; i++) {
    const name = GOWRI_NAMES[(nightStart + i) % 8]!;
    const start = sunsetJd + i * nightDur;
    const end = start + nightDur;
    night.push({
      name,
      auspicious: AUSPICIOUS_GOWRI.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe),
    });
  }

  return { day, night };
}
