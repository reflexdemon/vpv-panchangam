/**
 * Divisional chart (Varga) calculations — D1 through D60.
 * Implements all 17 vargas including special rules for D2, D7, D10, D11, D30.
 */

import {
  VARGA_ORDER,
  SIGN_QUALITY,
  D30_BREAKS_ODD,
  D30_BREAKS_EVEN,
  D30_SIGNS_ODD,
  D30_SIGNS_EVEN,
} from "../constants/vargas";
import type { VargaChart, VargaNumber } from "../types";

/**
 * Compute the divisional sign (1-12) for a planet at a given longitude.
 *
 * @param longitude  Ecliptic longitude (0-360, sidereal)
 * @param varga      Divisional number (1, 2, 3, ..., 60)
 */
export function vargaSign(longitude: number, varga: number): number {
  const norm = ((longitude % 360) + 360) % 360;
  const signId = Math.floor(norm / 30) + 1; // 1-12
  const degInSign = norm - (signId - 1) * 30; // 0-30

  switch (varga) {
    case 1:
      return signId;

    case 2: {
      // D2 Hora: odd signs → Leo(5) then Cancer(4); even → Cancer(4) then Leo(5)
      const part = degInSign >= 15 ? 1 : 0;
      if (signId % 2 === 1)
        return part === 0 ? 5 : 4; // odd: Leo first
      else return part === 0 ? 4 : 5; // even: Cancer first
    }

    case 3: {
      // D3 Drekkana: equal thirds; start at sign, +4, +8
      const part = Math.floor(degInSign / 10);
      return ((signId - 1 + part * 4) % 12) + 1;
    }

    case 4: {
      // D4 Chaturthamsa: equal quarters; start at sign, +3, +6, +9
      const part = Math.floor(degInSign / 7.5);
      return ((signId - 1 + part * 3) % 12) + 1;
    }

    case 7: {
      // D7 Saptamsa: 7 equal parts; odd signs start from same sign, even from 7th
      const part = Math.floor(degInSign / (30 / 7));
      const start = signId % 2 === 1 ? signId : ((signId - 1 + 6) % 12) + 1;
      return ((start - 1 + part) % 12) + 1;
    }

    case 9: {
      // D9 Navamsa: direct formula
      return Math.floor(((norm * 9) % 360) / 30) + 1;
    }

    case 10: {
      // D10 Dashamsa: 10 equal parts; odd start from same, even start from 9th
      const part = Math.floor(degInSign / 3);
      const start = signId % 2 === 1 ? signId : ((signId - 1 + 8) % 12) + 1;
      return ((start - 1 + part) % 12) + 1;
    }

    case 11: {
      // D11 Rudramsa: start anti-zodiacally from Aries (Gemini→Aquarius, etc.)
      // start = ((1 - signId) mod 12 + 12) mod 12 + 1
      const start = ((((1 - signId) % 12) + 12) % 12) + 1;
      const part = Math.floor(degInSign / (30 / 11));
      return ((start - 1 + part) % 12) + 1;
    }

    case 12: {
      // D12 Dvadashamsa: equal 12ths; each part starts from signId, moving forward
      const part = Math.floor(degInSign / 2.5);
      return ((signId - 1 + part) % 12) + 1;
    }

    case 16: {
      // D16 Shodashamsa: 16 equal parts; quality-based start
      const quality = SIGN_QUALITY[signId]!;
      const startSign = quality === 1 ? 1 : quality === 2 ? 5 : 9;
      const part = Math.floor(degInSign / (30 / 16));
      return ((startSign - 1 + part) % 12) + 1;
    }

    case 20: {
      // D20 Vimshamsa: 20 parts; fire=Aries, earth=Sagittarius, air=Leo, water=Cancer
      const quality = SIGN_QUALITY[signId]!;
      const startSign = quality === 1 ? 1 : quality === 3 ? 9 : 5;
      const part = Math.floor(degInSign / 1.5);
      return ((startSign - 1 + part) % 12) + 1;
    }

    case 24: {
      // D24 Chaturvimshamsa: 24 parts; odd signs start Cancer(4), even Leo(5)
      const startSign = signId % 2 === 1 ? 4 : 5;
      const part = Math.floor(degInSign / 1.25);
      return ((startSign - 1 + part) % 12) + 1;
    }

    case 27: {
      // D27 Bhamsa: 27 parts; fire start Aries(1), earth Capricorn(10),
      //             air Libra(7), water Cancer(4)
      const elem = [1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4][signId - 1]; // simplified: fire/water
      // Actual: fire(1→Aries=1), earth(2→Capricorn=10), air(3→Libra=7), water(4→Cancer=4)
      const STARTS: Record<number, number> = { 1: 1, 2: 10, 3: 7, 4: 4 };
      const elem2 = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4][signId - 1];
      const startSign = STARTS[elem2]!;
      const part = Math.floor(degInSign / (30 / 27));
      return ((startSign - 1 + part) % 12) + 1;
    }

    case 30: {
      // D30 Trimshamsa: uneven segments
      const breaks = signId % 2 === 1 ? D30_BREAKS_ODD : D30_BREAKS_EVEN;
      const signs = signId % 2 === 1 ? D30_SIGNS_ODD : D30_SIGNS_EVEN;
      for (let i = 0; i < breaks.length - 1; i++) {
        if (degInSign >= breaks[i] && degInSign < breaks[i + 1]) {
          return signs[i]!;
        }
      }
      return signs[signs.length - 1]!;
    }

    case 40: {
      // D40 Khavedamsa: 40 parts; odd start Aries(1), even Libra(7)
      const startSign = signId % 2 === 1 ? 1 : 7;
      const part = Math.floor(degInSign / 0.75);
      return ((startSign - 1 + part) % 12) + 1;
    }

    case 45: {
      // D45 Akshavedamsa: 45 parts; same quality-based start as D16
      const quality = SIGN_QUALITY[signId]!;
      const startSign = quality === 1 ? 1 : quality === 2 ? 5 : 9;
      const part = Math.floor(degInSign / (30 / 45));
      return ((startSign - 1 + part) % 12) + 1;
    }

    case 60: {
      // D60 Shashtyamsa: 60 equal parts of 0.5° each; cycles from same sign
      const part = Math.floor(degInSign / 0.5);
      return ((signId - 1 + part) % 12) + 1;
    }

    default:
      return signId;
  }
}

/**
 * Compute degree position within the divisional sign (0-30).
 */
export function vargaDegreeInSign(longitude: number, varga: number): number {
  const norm = ((longitude % 360) + 360) % 360;
  if (varga === 1) {
    return norm - Math.floor(norm / 30) * 30;
  }
  // For other vargas: use the fractional position within the part
  const partSize = 30 / varga;
  const degInSign = norm - Math.floor(norm / 30) * 30;
  const partFrac = (degInSign % partSize) / partSize;
  return partFrac * 30;
}

/**
 * Build all 17 varga charts from a set of planet positions.
 *
 * @param planetLongitudes   Map of planet abbreviation → sidereal longitude
 * @param ascLon             Ascendant sidereal longitude
 * @param vargaNames         Map of varga number → name
 * @param vargaSubtitles     Map of varga number → subtitle
 */
export function buildVargaCharts(
  planetLongitudes: Record<string, number>,
  ascLon: number,
  vargaNames: Record<number, string>,
  vargaSubtitles: Record<number, string>,
): Record<string, VargaChart> {
  const charts: Record<string, VargaChart> = {};

  for (const v of VARGA_ORDER) {
    const chart: Record<number, string[]> = {};
    for (let h = 1; h <= 12; h++) chart[h] = [];

    const ascSignId = vargaSign(ascLon, v);
    const planetDegrees: Record<string, number> = {};

    for (const [abbr, lon] of Object.entries(planetLongitudes)) {
      const pSignId = vargaSign(lon, v);
      // Whole-sign house
      const house = ((pSignId - ascSignId + 12) % 12) + 1;
      chart[house].push(abbr);
      planetDegrees[abbr] = vargaDegreeInSign(lon, v);
    }

    charts[`d${v}`] = {
      chart,
      asc_sign: ascSignId,
      name: vargaNames[v] ?? `D${v}`,
      subtitle: vargaSubtitles[v] ?? "",
      division: v,
      planet_degrees: planetDegrees,
    };
  }

  return charts;
}
