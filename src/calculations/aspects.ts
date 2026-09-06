/**
 * Graha Drishti (planetary aspects).
 * Standard 7th house aspect + special aspects for Mars, Jupiter, Saturn, Rahu, Ketu.
 */

import type { AspectResult, AspectEdge } from "../types";

// Special house aspects per planet (in addition to the universal 7th)
const SPECIAL_ASPECTS: Record<string, number[]> = {
  Mars: [4, 8],
  Jupiter: [5, 9],
  Saturn: [3, 10],
  Rahu: [5, 9],
  Ketu: [5, 9],
};

const BENEFIC_PLANETS = new Set(["Jupiter", "Venus", "Moon", "Mercury"]);

/**
 * Compute all aspects for a chart.
 *
 * @param positions  Array of {name, abbr, house, sign_id, retrograde, combust}
 */
export function computeAspects(
  positions: Array<{
    name: string;
    abbr: string;
    house: number;
    sign_id: number;
    retrograde: boolean;
    combust: boolean;
  }>,
): AspectResult {
  const aspects: AspectEdge[] = [];
  const byPlanet: AspectResult["by_planet"] = {};

  for (const planet of positions) {
    const fromHouse = planet.house;
    const fromSign = planet.sign_id;
    const benefic = BENEFIC_PLANETS.has(planet.name);

    // Houses aspected by this planet
    const offsets = new Set<number>([7]);
    for (const sp of SPECIAL_ASPECTS[planet.name] ?? []) {
      offsets.add(sp);
    }

    const aspectedHouses: number[] = [];
    const details: AspectEdge[] = [];

    for (const offset of offsets) {
      const toHouse = ((fromHouse - 1 + offset - 1) % 12) + 1;
      const toSign = ((fromSign - 1 + offset - 1) % 12) + 1;
      const type: "standard" | "special" =
        offset === 7 ? "standard" : "special";
      // Strength: 100 for 7th, 75 for special
      const strength = offset === 7 ? 100 : 75;

      const edge: AspectEdge = {
        planet: planet.name,
        planet_abbr: planet.abbr,
        from_sign: fromSign,
        from_house: fromHouse,
        to_sign: toSign,
        to_house: toHouse,
        offset,
        aspect_type: type,
        strength,
        benefic,
      };
      aspects.push(edge);
      aspectedHouses.push(toHouse);
      details.push(edge);
    }

    byPlanet[planet.abbr] = {
      name: planet.name,
      abbr: planet.abbr,
      house: fromHouse,
      benefic,
      retrograde: planet.retrograde,
      combust: planet.combust,
      aspected_houses: aspectedHouses,
      details,
    };
  }

  // Mutual aspects: two planets that aspect each other's houses
  const mutual: Array<{ planet1: string; planet2: string }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]!;
      const b = positions[j]!;
      const aAspects = byPlanet[a.abbr]?.aspected_houses ?? [];
      const bAspects = byPlanet[b.abbr]?.aspected_houses ?? [];
      if (aAspects.includes(b.house) && bAspects.includes(a.house)) {
        const key = [a.abbr, b.abbr].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          mutual.push({ planet1: a.abbr, planet2: b.abbr });
        }
      }
    }
  }

  return { aspects, by_planet: byPlanet, mutual };
}
