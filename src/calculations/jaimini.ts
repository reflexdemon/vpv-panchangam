/**
 * Jaimini Chara Karakas — rank planets by degree-in-sign (descending).
 * AK (Atmakaraka) = highest degree, DK (Darakaraka) = lowest.
 */

import type { Karaka, PlanetPosition } from "../types";
import { degreeInSign, formatDms } from "./panchang";

const KARAKA_TITLES = [
  "Atmakaraka",
  "Amatyakaraka",
  "Bhratrukaraka",
  "Matrukaraka",
  "Putrakaraka",
  "Gnatikaraka",
  "Darakaraka",
];

const KARAKA_ABBRS = ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"];

// Only 7 visible planets for chara karaka (Sun through Saturn; Rahu/Ketu excluded)
const CHARA_PLANETS = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"];

/**
 * Compute Jaimini Chara Karakas.
 *
 * @param positions  Planet positions (needs sign_id, longitude, abbr, name)
 * @param namesFn    Resolve sign name from sign ID
 */
export function computeKarakas(
  positions: PlanetPosition[],
  namesFn: (signId: number) => string,
): Karaka[] {
  // Filter to chara planets only and sort by degree-in-sign DESCENDING
  const eligible = positions
    .filter((p) => CHARA_PLANETS.includes(p.abbr))
    .map((p) => ({
      ...p,
      _degInSign: degreeInSign(p.longitude),
    }))
    .sort((a, b) => b._degInSign - a._degInSign);

  return eligible.slice(0, 7).map((p, i) => ({
    rank: i + 1,
    abbr: KARAKA_ABBRS[i]!,
    title: KARAKA_TITLES[i]!,
    planet: p.name,
    planet_abbr: p.abbr,
    sign: namesFn(p.sign_id),
    sign_id: p.sign_id,
    degree_in_sign: p._degInSign,
    dms: formatDms(p._degInSign),
  }));
}

/**
 * Derive Karakamsa and Swamsa (D9 sign of Atmakaraka).
 */
export function computeKarakamsa(
  atmakaraka: Karaka,
  d9Chart: Record<number, string[]>, // house → planet abbrs
  d9AscSign: number,
  namesFn: (signId: number) => string,
): { karakamsa: string; swamsa: string } {
  // Find the house in D9 where AK is placed, then derive the absolute sign
  let akSign = -1;
  for (const [house, abbrs] of Object.entries(d9Chart)) {
    if (abbrs.includes(atmakaraka.planet_abbr)) {
      // house number (1-based); sign = (d9AscSign - 1 + house - 1) % 12 + 1
      const h = parseInt(house, 10);
      akSign = ((d9AscSign - 1 + h - 1) % 12) + 1;
      break;
    }
  }

  const karakamsa = akSign > 0 ? namesFn(akSign) : "";
  // Swamsa = Karakamsa by default in simplified calculation
  return { karakamsa, swamsa: karakamsa };
}
