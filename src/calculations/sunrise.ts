/**
 * Sunrise, sunset, moonrise, moonset and related time calculations.
 * Also provides Udaya Lagna (rising sign) sequence.
 */

import type { EphemerisService } from "../ephemeris";
import { SE } from "../ephemeris";
import { jdToIso, signIdFromLon } from "./panchang";
import { findAngleTime } from "./bisection";

export interface SolarTimes {
  sunrise: number | null; // JD
  sunset: number | null;
  moonrise: number | null;
  moonset: number | null;
  nextSunrise: number | null;
}

export interface DaySegments {
  /** Start of day period (sunrise) */
  sunriseJd: number;
  /** End of day period (sunset) */
  sunsetJd: number;
  /** 8 equal day segments [startJd, endJd][] */
  daySegments: Array<[number, number]>;
  /** 8 equal night segments [startJd, endJd][] */
  nightSegments: Array<[number, number]>;
  /** Duration of day and night in hours */
  dinamanHours: number;
  ratrimanHours: number;
}

/**
 * Compute sunrise/sunset/moonrise/moonset for a given date and location.
 *
 * @param jdNoon  Julian Day at noon UT of the target date
 * @param lat     Latitude
 * @param lon     Geographic longitude (west is negative)
 */
export function computeSolarTimes(
  jdNoon: number,
  lat: number,
  lon: number,
  ephe: EphemerisService,
): SolarTimes {
  // Search from previous midnight
  const jdMidnight = jdNoon - 0.5;
  const geopos: [number, number, number] = [lon, lat, 0];

  const sunrise = ephe.riseTrans(jdMidnight, SE.SUN, geopos, SE.CALC_RISE);
  const sunset =
    sunrise != null
      ? ephe.riseTrans(sunrise, SE.SUN, geopos, SE.CALC_SET)
      : null;
  const nextSunrise =
    sunset != null
      ? ephe.riseTrans(sunset, SE.SUN, geopos, SE.CALC_RISE)
      : null;
  const moonrise = ephe.riseTrans(jdMidnight, SE.MOON, geopos, SE.CALC_RISE);
  const moonset =
    moonrise != null
      ? ephe.riseTrans(moonrise, SE.MOON, geopos, SE.CALC_SET)
      : null;

  return { sunrise, sunset, moonrise, moonset, nextSunrise };
}

/**
 * Divide the day and night into 8 equal segments each.
 */
export function computeDaySegments(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
): DaySegments {
  const dayDur = sunsetJd - sunriseJd;
  const nightDur = nextSunriseJd - sunsetJd;
  const daySeg = dayDur / 8;
  const nightSeg = nightDur / 8;

  const daySegments: Array<[number, number]> = Array.from(
    { length: 8 },
    (_, i) => [sunriseJd + i * daySeg, sunriseJd + (i + 1) * daySeg],
  );
  const nightSegments: Array<[number, number]> = Array.from(
    { length: 8 },
    (_, i) => [sunsetJd + i * nightSeg, sunsetJd + (i + 1) * nightSeg],
  );

  return {
    sunriseJd,
    sunsetJd,
    daySegments,
    nightSegments,
    dinamanHours: dayDur * 24,
    ratrimanHours: nightDur * 24,
  };
}

/**
 * Compute 15 equal Muhurta windows from sunrise to next sunrise (30 muhurtas
 * total per day — 15 day + 15 night).
 * Returns an array of [startJd, endJd] for each muhurta (1-indexed: [0] unused).
 */
export function computeMuhurtaWindows(
  sunriseJd: number,
  nextSunriseJd: number,
): Array<[number, number]> {
  const totalDur = nextSunriseJd - sunriseJd;
  const muhurtaDur = totalDur / 30;
  return Array.from({ length: 30 }, (_, i) => [
    sunriseJd + i * muhurtaDur,
    sunriseJd + (i + 1) * muhurtaDur,
  ]);
}

/**
 * Generate Udaya Lagna (rising sign) sequence for a day.
 * Ascendant moves ~1 sign per ~2 hours. We scan [startJd, endJd] for sign
 * boundaries by bisecting the ascendant longitude.
 */
export function generateUdayaLagna(
  startJd: number,
  endJd: number,
  lat: number,
  lon: number,
  ephe: EphemerisService,
  namesFn: (signId: number) => string = (id) => `Sign ${id}`,
  rashiFn: (signId: number) => string = (id) => `Rashi ${id}`,
): Array<{ sign: string; rashi: string; start: string; end: string }> {
  const results: Array<{
    sign: string;
    rashi: string;
    start: string;
    end: string;
  }> = [];

  const ascLon = (jd: number): number => {
    const h = ephe.housesEx(jd, lat, lon);
    return h.ascendant;
  };

  let cur = startJd;
  const asc0 = ascLon(startJd);
  let curSignId = signIdFromLon(asc0);

  // Ascendant advances ~1 degree per 4 minutes; a sign = 30°, so ~2hr per sign.
  // We scan with a 30° step.
  for (let iter = 0; iter < 24; iter++) {
    const nextSignBoundary = curSignId * 30; // 0-360: boundary at end of curSignId
    const jd = findAngleTime(cur, endJd, nextSignBoundary, ascLon);
    if (jd == null || jd >= endJd) {
      // Final segment
      const signId = curSignId;
      results.push({
        sign: namesFn(signId),
        rashi: rashiFn(signId),
        start: jdToIso(cur, ephe),
        end: jdToIso(endJd, ephe),
      });
      break;
    }
    results.push({
      sign: namesFn(curSignId),
      rashi: rashiFn(curSignId),
      start: jdToIso(cur, ephe),
      end: jdToIso(jd, ephe),
    });
    cur = jd + 1e-7;
    curSignId = (curSignId % 12) + 1;
  }

  return results;
}

/**
 * Convert a Julian Day fraction to a local ISO-like string using Intl.
 */
export function jdToLocalIso(
  jd: number,
  timezone: string,
  ephe: EphemerisService,
): string {
  const [y, mo, d, hFrac] = ephe.revjul(jd);
  const h = Math.floor(hFrac);
  const mF = (hFrac - h) * 60;
  const m = Math.floor(mF);
  const sF = (mF - m) * 60;
  const s = Math.floor(sF);
  const ms = Math.round((sF - s) * 1000);

  const utcDate = new Date(Date.UTC(y, mo - 1, d, h, m, s, ms));
  return utcDate
    .toLocaleString("sv-SE", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(" ", "T");
}
