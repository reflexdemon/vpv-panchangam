/**
 * Ganda Mula nakshatra detection and Ravi Yoga calculation.
 */

import type { PanchangItem } from "../types";

// Ganda Mula nakshatras (indices 0-26): Ashwini(0), Ashlesha(8), Magha(9),
// Jyeshtha(17), Mula(18), Revati(26)
const GANDA_MULA_INDICES = new Set([0, 8, 9, 17, 18, 26]);

export interface GandaMulaResult {
  nakshatra: string;
  ends_at: string;
}

/**
 * Detect Ganda Mula — returns the first Ganda Mula nakshatra in the sequence,
 * or null if none on this day.
 */
export function detectGandaMula(
  nakshatras: PanchangItem[],
): GandaMulaResult | null {
  for (const nak of nakshatras) {
    if (GANDA_MULA_INDICES.has(nak.index)) {
      return { nakshatra: nak.name, ends_at: nak.ends_at };
    }
  }
  return null;
}

// Ravi Yoga: Sun's nakshatra and weekday combinations that produce Ravi Yoga
// Sun weekday (ISO 7=Sun) + specific nakshatras
const RAVI_YOGA_COMBOS: Record<number, Set<number>> = {
  7: new Set([7, 14, 21]), // Sunday + Pushya(7), Swati(14), Shravana(21)
  1: new Set([3, 10, 17]), // Monday + Rohini(3), Magha(9)... (simplified)
};

export interface RaviYogaResult {
  start: string;
  end: string;
}

/**
 * Detect Ravi Yoga based on Sun nakshatra and weekday.
 *
 * @param sunNakIdx  Sun's nakshatra index (0-26)
 * @param weekday    ISO weekday (1=Mon..7=Sun)
 * @param sunriseIso Sunrise ISO string (start of Ravi Yoga)
 * @param sunsetIso  Sunset ISO string (end of Ravi Yoga)
 */
export function detectRaviYoga(
  sunNakIdx: number,
  weekday: number,
  sunriseIso: string,
  sunsetIso: string,
): RaviYogaResult | null {
  const set = RAVI_YOGA_COMBOS[weekday];
  if (!set || !set.has(sunNakIdx)) return null;
  return { start: sunriseIso, end: sunsetIso };
}
