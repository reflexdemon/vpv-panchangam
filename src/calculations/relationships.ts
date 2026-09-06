/**
 * Planetary friendship tables.
 * Natural, Temporal, and Composite (combined) relationships.
 */

import type { FriendshipTables } from "../types";

// F=Friend, N=Neutral, E=Enemy
const NATURAL: Record<string, Record<string, string>> = {
  Sun: {
    Sun: "N",
    Moon: "F",
    Mars: "F",
    Mercury: "N",
    Jupiter: "F",
    Venus: "E",
    Saturn: "E",
    Rahu: "E",
    Ketu: "E",
  },
  Moon: {
    Sun: "F",
    Moon: "N",
    Mars: "N",
    Mercury: "F",
    Jupiter: "F",
    Venus: "N",
    Saturn: "N",
    Rahu: "N",
    Ketu: "N",
  },
  Mars: {
    Sun: "F",
    Moon: "N",
    Mars: "N",
    Mercury: "E",
    Jupiter: "F",
    Venus: "N",
    Saturn: "N",
    Rahu: "N",
    Ketu: "N",
  },
  Mercury: {
    Sun: "F",
    Moon: "N",
    Mars: "N",
    Mercury: "N",
    Jupiter: "N",
    Venus: "F",
    Saturn: "N",
    Rahu: "F",
    Ketu: "N",
  },
  Jupiter: {
    Sun: "F",
    Moon: "F",
    Mars: "F",
    Mercury: "E",
    Jupiter: "N",
    Venus: "E",
    Saturn: "E",
    Rahu: "E",
    Ketu: "F",
  },
  Venus: {
    Sun: "E",
    Moon: "N",
    Mars: "N",
    Mercury: "F",
    Jupiter: "N",
    Venus: "N",
    Saturn: "F",
    Rahu: "F",
    Ketu: "N",
  },
  Saturn: {
    Sun: "E",
    Moon: "E",
    Mars: "E",
    Mercury: "F",
    Jupiter: "E",
    Venus: "F",
    Saturn: "N",
    Rahu: "F",
    Ketu: "N",
  },
  Rahu: {
    Sun: "E",
    Moon: "E",
    Mars: "E",
    Mercury: "F",
    Jupiter: "E",
    Venus: "F",
    Saturn: "F",
    Rahu: "N",
    Ketu: "N",
  },
  Ketu: {
    Sun: "E",
    Moon: "E",
    Mars: "F",
    Mercury: "N",
    Jupiter: "F",
    Venus: "N",
    Saturn: "N",
    Rahu: "N",
    Ketu: "N",
  },
};

const PLANET_LIST = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

/**
 * Compute temporal friendships based on house positions in the birth chart.
 * A planet 2,3,4,10,11,12 houses away → temporary friend; else enemy.
 *
 * @param planetSigns  name → sign ID (1-12)
 */
export function computeTemporalFriendships(
  planetSigns: Record<string, number>,
): Record<string, Record<string, string>> {
  const FRIEND_OFFSETS = new Set([2, 3, 4, 10, 11, 12]);
  const temporal: Record<string, Record<string, string>> = {};

  for (const p of PLANET_LIST) {
    temporal[p] = {};
    const pSign = planetSigns[p] ?? 1;
    for (const q of PLANET_LIST) {
      if (p === q) {
        temporal[p][q] = "N";
        continue;
      }
      const qSign = planetSigns[q] ?? 1;
      const offset = ((qSign - pSign + 12) % 12) + 1; // 1-12
      temporal[p][q] = FRIEND_OFFSETS.has(offset) ? "F" : "E";
    }
  }
  return temporal;
}

/**
 * Composite relationship = Natural + Temporal combined.
 * FF → GF (Great Friend), FN or NF → F, FE or EF → N,
 * NE or EN → E, EE → GE (Great Enemy), NN → N.
 */
export function computeCompositeRelationship(nat: string, tmp: string): string {
  const score = (r: string) => (r === "F" ? 1 : r === "E" ? -1 : 0);
  const total = score(nat) + score(tmp);
  if (total >= 2) return "GF";
  if (total === 1) return "F";
  if (total === 0) return "N";
  if (total === -1) return "E";
  return "GE";
}

/**
 * Compute all three friendship tables.
 */
export function computeFriendships(
  planetSigns: Record<string, number>,
): FriendshipTables {
  const temporal = computeTemporalFriendships(planetSigns);
  const composite: Record<string, Record<string, string>> = {};

  for (const p of PLANET_LIST) {
    composite[p] = {};
    for (const q of PLANET_LIST) {
      const nat = NATURAL[p]?.[q] ?? "N";
      const tmp = temporal[p]?.[q] ?? "N";
      composite[p][q] = computeCompositeRelationship(nat, tmp);
    }
  }

  return {
    natural: NATURAL,
    temporal,
    composite,
  };
}
