/**
 * Ashtakavarga — Bhinnashtakavarga (BAV) and Sarvashtakavarga (SAV).
 * For each of 7 planets, for each contributor (Sun..Saturn + Ascendant),
 * award a point to signs based on the BAV_RULES lookup tables.
 */

import type { AshtakavargaResult } from "../types";
import { BAV_RULES, BAV_CONTRIBUTORS } from "../constants/planets";

/**
 * Planet abbreviation → index into BAV_CONTRIBUTORS order
 */
const PLANET_SIGN_MAP: Record<string, string> = {
  Su: "Sun",
  Mo: "Moon",
  Ma: "Mars",
  Me: "Mercury",
  Ju: "Jupiter",
  Ve: "Venus",
  Sa: "Saturn",
};

/**
 * Compute Ashtakavarga for all 7 planets.
 *
 * @param planetSigns  Map: planet abbreviation → sign ID (1-12)
 * @param ascSignId    Ascendant sign ID (1-12)
 */
export function computeAshtakavarga(
  planetSigns: Record<string, number>,
  ascSignId: number,
): AshtakavargaResult {
  // BAV planets (7)
  const BAV_PLANETS = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
  ];

  const bav: Record<string, number[]> = {};

  // Initialize each planet's BAV with 12 zeros
  for (const p of BAV_PLANETS) {
    bav[p] = new Array(12).fill(0);
  }

  // contributor sign IDs
  const contributorSigns: Record<string, number> = {
    Sun: planetSigns["Su"] ?? 1,
    Moon: planetSigns["Mo"] ?? 1,
    Mars: planetSigns["Ma"] ?? 1,
    Mercury: planetSigns["Me"] ?? 1,
    Jupiter: planetSigns["Ju"] ?? 1,
    Venus: planetSigns["Ve"] ?? 1,
    Saturn: planetSigns["Sa"] ?? 1,
    Asc: ascSignId,
  };

  for (const planet of BAV_PLANETS) {
    const rules = BAV_RULES[planet];
    if (!rules) continue;

    for (const contributor of BAV_CONTRIBUTORS) {
      const houseOffsets = rules[contributor];
      if (!houseOffsets) continue;

      const contribSign = contributorSigns[contributor] ?? 1;

      for (const offset of houseOffsets) {
        // Target sign = (contributorSign - 1 + offset - 1) % 12
        const targetSign = (((contribSign - 1 + offset - 1) % 12) + 12) % 12; // 0-based
        bav[planet][targetSign] += 1;
      }
    }
  }

  // SAV = element-wise sum of all 7 BAV arrays
  const sav = new Array(12).fill(0);
  for (const points of Object.values(bav)) {
    for (let i = 0; i < 12; i++) {
      sav[i] += points[i];
    }
  }

  return { bav, sav };
}
