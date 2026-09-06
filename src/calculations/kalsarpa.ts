/**
 * Kalsarpa Yoga detection.
 * Checks if all 7 visible planets lie within the Rahu–Ketu arc.
 */

import type { KalsarpaResult } from "../types";

const KALSARPA_NAMES = [
  "Anant",
  "Kulik",
  "Vasuki",
  "Shankhpal",
  "Padma",
  "Mahapadma",
  "Takshak",
  "Karkotak",
  "Shankhachood",
  "Ghatak",
  "Vishaktak",
  "Sheshnag",
];

/**
 * Check if a longitude lies on the arc from `from` to `to` (going forward/east).
 */
function onArc(lon: number, from: number, to: number): boolean {
  const norm = (lon - from + 360) % 360;
  const arc = (to - from + 360) % 360;
  return norm > 0 && norm < arc;
}

/**
 * Detect Kalsarpa Yoga.
 *
 * @param planetLons   Map of planet name → longitude (Rahu and Ketu required)
 * @param ascSignId    Ascendant sign ID (1-12)
 * @param rahuHouse    House number of Rahu (1-12)
 * @param ketuHouse    House number of Ketu (1-12)
 */
export function computeKalsarpa(
  planetLons: Record<string, number>,
  rahuHouse: number,
  ketuHouse: number,
): KalsarpaResult {
  const rahuLon = planetLons["Rahu"] ?? planetLons["Ra"];
  const ketuLon = planetLons["Ketu"] ?? planetLons["Ke"];

  if (rahuLon == null || ketuLon == null) {
    return {
      present: false,
      verdict: "Kalsarpa Yoga not present",
      kind: null,
      direction: null,
      rahu_house: rahuHouse,
      ketu_house: ketuHouse,
    };
  }

  const VISIBLE = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
  ];
  const lons = VISIBLE.map((p) => planetLons[p]).filter(
    (l) => l != null,
  ) as number[];

  // Forward arc: Rahu → Ketu
  const forwardArc = (ketuLon - rahuLon + 360) % 360;
  // Reverse arc: Ketu → Rahu
  const reverseArc = (rahuLon - ketuLon + 360) % 360;

  const allOnForward = lons.every((l) => onArc(l, rahuLon, ketuLon));
  const allOnReverse = lons.every((l) => onArc(l, ketuLon, rahuLon));

  if (!allOnForward && !allOnReverse) {
    return {
      present: false,
      verdict: "Kalsarpa Yoga not present",
      kind: null,
      direction: null,
      rahu_house: rahuHouse,
      ketu_house: ketuHouse,
    };
  }

  const kind = KALSARPA_NAMES[(rahuHouse - 1) % 12]!;
  const direction = allOnForward
    ? "Forward (Rahu leading)"
    : "Reverse (Ketu leading)";
  const verdict = `${kind} Kalsarpa Yoga is present (${direction})`;

  return {
    present: true,
    verdict,
    kind,
    direction,
    rahu_house: rahuHouse,
    ketu_house: ketuHouse,
  };
}
