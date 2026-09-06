/**
 * Vimshottari Mahadasha, Antardasha, and Pratyantar Dasha calculator.
 * Uses 365.25 days / year for all date arithmetic.
 */

import type { Mahadasha, Antardasha, Pratyantar } from "../types";
import {
  DASHA_SEQUENCE,
  DASHA_YEARS,
  DASHA_TOTAL_YEARS,
  NAKSHATRA_LORD_CYCLE,
} from "../constants/planets";
import { NAK_SPAN } from "../constants/panchang";

const DAYS_PER_YEAR = 365.25;

/**
 * Add a fractional number of years to a Date.
 */
function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * DAYS_PER_YEAR * 86400 * 1000);
}

function toIso(d: Date): string {
  return d.toISOString().replace(".000Z", "Z");
}

/**
 * Compute Mahadasha sequence from Moon's nakshatra position.
 *
 * @param moonLon   Sidereal Moon longitude (0-360)
 * @param birthUtc  Birth date/time as UTC Date
 * @returns         Array of 9 Mahadashas covering 120 years from balance at birth
 */
export function computeMahadashas(
  moonLon: number,
  birthUtc: Date,
): Mahadasha[] {
  const norm = ((moonLon % 360) + 360) % 360;
  const nakIdx = Math.floor(norm / NAK_SPAN); // 0-26
  const degInNak = norm - nakIdx * NAK_SPAN; // 0-NAK_SPAN
  const fractionElapsed = degInNak / NAK_SPAN; // 0-1

  // First lord = nakshatra lord of birth nakshatra
  const lordIdx = nakIdx % 9; // index into DASHA_SEQUENCE
  const firstLord = NAKSHATRA_LORD_CYCLE[lordIdx]!;
  const balanceYears = DASHA_YEARS[firstLord]! * (1 - fractionElapsed);

  const dashas: Mahadasha[] = [];
  let cur = birthUtc;
  let seqIdx = lordIdx; // current position in DASHA_SEQUENCE

  for (let i = 0; i < 9; i++) {
    const lord = DASHA_SEQUENCE[seqIdx % 9]!;
    const years = i === 0 ? balanceYears : DASHA_YEARS[lord]!;
    const end = addYears(cur, years);

    dashas.push({
      lord,
      start: toIso(cur),
      end: toIso(end),
      years,
    });

    cur = end;
    seqIdx = (seqIdx + 1) % 9;
  }

  return dashas;
}

/**
 * Compute Antardashas (sub-periods) for a Mahadasha.
 */
export function computeAntardashas(md: Mahadasha): Antardasha[] {
  const mdStart = new Date(md.start);
  const mdYears = md.years;

  // Find the lord's position in DASHA_SEQUENCE, then cycle all 9 from there
  const lordIdx = DASHA_SEQUENCE.indexOf(
    md.lord as (typeof DASHA_SEQUENCE)[number],
  );
  const antardashas: Antardasha[] = [];
  let cur = mdStart;

  for (let i = 0; i < 9; i++) {
    const adLord = DASHA_SEQUENCE[(lordIdx + i) % 9]!;
    const adYears = (mdYears * DASHA_YEARS[adLord]!) / DASHA_TOTAL_YEARS;
    const end = addYears(cur, adYears);

    antardashas.push({
      lord: adLord,
      start: toIso(cur),
      end: toIso(end),
      years: adYears,
    });

    cur = end;
  }

  return antardashas;
}

/**
 * Compute Pratyantardashas (sub-sub-periods) for an Antardasha.
 */
export function computePratyantars(ad: Antardasha): Pratyantar[] {
  const adStart = new Date(ad.start);
  const adYears = ad.years;

  const lordIdx = DASHA_SEQUENCE.indexOf(
    ad.lord as (typeof DASHA_SEQUENCE)[number],
  );
  const pratyantars: Pratyantar[] = [];
  let cur = adStart;

  for (let i = 0; i < 9; i++) {
    const pdLord = DASHA_SEQUENCE[(lordIdx + i) % 9]!;
    const pdYears = (adYears * DASHA_YEARS[pdLord]!) / DASHA_TOTAL_YEARS;
    const end = addYears(cur, pdYears);

    pratyantars.push({
      lord: pdLord,
      start: toIso(cur),
      end: toIso(end),
      years: pdYears,
    });

    cur = end;
  }

  return pratyantars;
}

/**
 * Enrich all Mahadashas with nested Antardashas (and optionally Pratyantars).
 */
export function enrichWithAntardashas(
  dashas: Mahadasha[],
  includePratyantars = false,
): Mahadasha[] {
  return dashas.map((md) => {
    const antardashas = computeAntardashas(md).map((ad) => ({
      ...ad,
      pratyantars: includePratyantars ? computePratyantars(ad) : undefined,
    }));
    return { ...md, antardashas };
  });
}
