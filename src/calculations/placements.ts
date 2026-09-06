/**
 * Special planetary placements: exaltation, debilitation, own sign,
 * moolatrikona, vargottama, digbala, pushkara, mrityu bhaga,
 * gandanta, neecha bhanga, parivartana, graha yuddha.
 */

import type { PlanetPosition } from "../types";
import {
  EXALTATION,
  DEBILITATION,
  OWN_SIGNS,
  MOOLATRIKONA,
  DIGBALA_SIGNS,
  PUSHKARA_BHAGA,
  PUSHKARA_NAVAMSA_SIGNS,
  MRITYU_BHAGA,
  GANDANTA_JUNCTIONS,
  COMBUST_PLANETS,
  COMBUST_ORB,
} from "../constants/planets";
import { vargaSign } from "./vargas";
import { degreeInSign, signIdFromLon } from "./panchang";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function withinOrb(a: number, b: number, orb: number): boolean {
  const diff = Math.abs(a - b);
  return diff <= orb || diff >= 360 - orb;
}

// ─── Individual checks ────────────────────────────────────────────────────────

export function isExalted(
  planet: string,
  signId: number,
  deg: number,
): boolean {
  const ex = EXALTATION[planet];
  if (!ex) return false;
  return ex.sign === signId && Math.abs(deg - ex.degree) <= 1;
}

export function isDebilitated(
  planet: string,
  signId: number,
  deg: number,
): boolean {
  const db = DEBILITATION[planet];
  if (!db) return false;
  return db.sign === signId && Math.abs(deg - db.degree) <= 1;
}

export function isOwnSign(planet: string, signId: number): boolean {
  return (OWN_SIGNS[planet] ?? []).includes(signId);
}

export function isMoolatrikona(
  planet: string,
  signId: number,
  deg: number,
): boolean {
  const mt = MOOLATRIKONA[planet];
  if (!mt) return false;
  return mt.sign === signId && deg >= mt.start && deg <= mt.end;
}

/** Vargottama: D1 sign === D9 sign */
export function isVargottama(longitude: number): boolean {
  return vargaSign(longitude, 1) === vargaSign(longitude, 9);
}

export function isDigbala(planet: string, signId: number): boolean {
  return DIGBALA_SIGNS[planet] === signId;
}

export function isPushkaraBhaga(signId: number, deg: number): boolean {
  const pb = PUSHKARA_BHAGA[signId];
  if (!pb) return false;
  return pb.includes(Math.round(deg));
}

export function isPushkaraNavamsa(longitude: number): boolean {
  return PUSHKARA_NAVAMSA_SIGNS.has(vargaSign(longitude, 9));
}

export function isMrityuBhaga(
  planet: string,
  signId: number,
  deg: number,
): boolean {
  const mb = MRITYU_BHAGA[planet];
  if (!mb) return false;
  const mbDeg = mb[signId];
  return mbDeg != null && Math.abs(deg - mbDeg) < 1;
}

export function isGandanta(signId: number, deg: number): boolean {
  for (const jn of GANDANTA_JUNCTIONS) {
    if (jn.sign !== signId) continue;
    if (jn.edge === "start" && deg <= jn.orb) return true;
    if (jn.edge === "end" && deg >= 30 - jn.orb) return true;
  }
  return false;
}

export function isCombust(
  planet: string,
  lon: number,
  sunLon: number,
): boolean {
  if (!COMBUST_PLANETS.has(planet)) return false;
  return withinOrb(lon, sunLon, COMBUST_ORB);
}

// ─── Neecha Bhanga ────────────────────────────────────────────────────────────

/**
 * Neecha Bhanga (debilitation cancellation):
 * - Lord of the debilitation sign is in a kendra (1,4,7,10) from ascendant or moon
 * - Or the dispositor of the debilitated planet is exalted
 * - Simplified check: debilitation lord is in kendra
 */
export function isNeechaBhanga(
  planet: string,
  signId: number,
  planetSigns: Record<string, number>, // abbr → signId
  ascSignId: number,
): boolean {
  const db = DEBILITATION[planet];
  if (!db || db.sign !== signId) return false;

  // Lord of the sign where planet is debilitated
  const SIGN_LORDS: Record<number, string[]> = {
    1: ["Ma"],
    2: ["Ve"],
    3: ["Me"],
    4: ["Mo"],
    5: ["Su"],
    6: ["Me"],
    7: ["Ve"],
    8: ["Ma"],
    9: ["Ju"],
    10: ["Sa"],
    11: ["Sa"],
    12: ["Ju"],
  };
  const lords = SIGN_LORDS[db.sign] ?? [];

  for (const abbr of lords) {
    const lSign = planetSigns[abbr];
    if (lSign == null) continue;
    const houseFromAsc = ((lSign - ascSignId + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(houseFromAsc)) return true;
  }
  return false;
}

// ─── Parivartana ─────────────────────────────────────────────────────────────

/**
 * Parivartana (mutual reception): two planets are in each other's own signs.
 * Returns map: planet name → the other planet it exchanges with, or null.
 */
export function computeParivartana(
  planetSigns: Record<string, number>,
): Record<string, string | null> {
  const NAME_MAP: Record<string, string> = {
    Su: "Sun",
    Mo: "Moon",
    Ma: "Mars",
    Me: "Mercury",
    Ju: "Jupiter",
    Ve: "Venus",
    Sa: "Saturn",
  };
  const result: Record<string, string | null> = {};

  const abbrs = Object.keys(planetSigns);
  for (const a of abbrs) {
    result[a] = null;
    for (const b of abbrs) {
      if (a === b) continue;
      const aSign = planetSigns[a]!;
      const bSign = planetSigns[b]!;
      // a is in b's own sign AND b is in a's own sign
      if (
        (OWN_SIGNS[NAME_MAP[b] ?? ""] ?? []).includes(aSign) &&
        (OWN_SIGNS[NAME_MAP[a] ?? ""] ?? []).includes(bSign)
      ) {
        result[a] = b;
        break;
      }
    }
  }
  return result;
}

// ─── Graha Yuddha ─────────────────────────────────────────────────────────────

/**
 * Graha Yuddha (planetary war): two planets within 1° of each other.
 * Only for visible planets (not Rahu/Ketu). Winner = higher latitude.
 */
export function computeGrahaYuddha(
  planets: Array<{ abbr: string; lon: number; lat: number }>,
): Record<string, string | null> {
  const ELIGIBLE = new Set(["Ma", "Me", "Ju", "Ve", "Sa"]);
  const result: Record<string, string | null> = {};

  for (const p of planets) {
    result[p.abbr] = null;
  }

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i]!;
      const b = planets[j]!;
      if (!ELIGIBLE.has(a.abbr) || !ELIGIBLE.has(b.abbr)) continue;
      const diff = Math.abs(a.lon - b.lon);
      if (diff <= 1 || diff >= 359) {
        result[a.abbr] = b.abbr;
        result[b.abbr] = a.abbr;
      }
    }
  }

  return result;
}

/**
 * Apply all special placements to an array of PlanetPositions.
 * Modifies in-place and returns the array.
 */
export function applySpecialPlacements(
  positions: PlanetPosition[],
  ascSignId: number,
  sunLon: number,
): PlanetPosition[] {
  const planetSigns: Record<string, number> = {};
  const planetLons: Record<string, number> = {};
  const planetLats: Record<string, number> = {};

  for (const p of positions) {
    planetSigns[p.abbr] = p.sign_id;
    planetLons[p.abbr] = p.longitude;
    planetLats[p.abbr] = 0; // latitude not stored on PlanetPosition
  }

  const parivartana = computeParivartana(planetSigns);
  const yuddha = computeGrahaYuddha(
    positions.map((p) => ({ abbr: p.abbr, lon: p.longitude, lat: 0 })),
  );

  for (const p of positions) {
    const { name, abbr, sign_id, degree_in_sign, longitude } = p;

    p.exalted = isExalted(name, sign_id, degree_in_sign);
    p.debilitated = isDebilitated(name, sign_id, degree_in_sign);
    p.own_sign = isOwnSign(name, sign_id);
    p.moolatrikona = isMoolatrikona(name, sign_id, degree_in_sign);
    p.vargottama = isVargottama(longitude);
    p.digbala = isDigbala(name, sign_id);
    p.pushkara_bhaga = isPushkaraBhaga(sign_id, degree_in_sign);
    p.pushkara_navamsa = isPushkaraNavamsa(longitude);
    p.mrityu_bhaga = isMrityuBhaga(name, sign_id, degree_in_sign);
    p.gandanta = isGandanta(sign_id, degree_in_sign);
    p.combust = isCombust(name, longitude, sunLon);
    p.neecha_bhanga = isNeechaBhanga(name, sign_id, planetSigns, ascSignId);
    p.parivartana = parivartana[abbr] != null;
    p.parivartana_with = parivartana[abbr] ?? null;
    p.graha_yuddha = yuddha[abbr] != null;
    p.graha_yuddha_with = yuddha[abbr] ?? null;
  }

  return positions;
}
