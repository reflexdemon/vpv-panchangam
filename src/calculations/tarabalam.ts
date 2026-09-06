/**
 * Tarabalam — nakshatra-based auspiciousness assessment.
 * Computes which of the 27 nakshatras are 'good' relative to the birth nakshatra.
 */

import type { Tarabalam } from "../types";
import { GOOD_TARA_OFFSETS } from "../constants/calendars";

/**
 * Compute Tarabalam good nakshatras.
 *
 * @param birthNakIdx  Birth nakshatra index (0-26)
 * @param namesFn      Function to resolve nakshatra name from index
 */
export function computeTarabalam(
  birthNakIdx: number,
  namesFn: (idx: number) => string,
): Tarabalam {
  const good_nakshatras: Array<{ nakshatra: string; index: number }> = [];

  for (let i = 0; i < 27; i++) {
    const offset = (i - birthNakIdx + 27) % 27;
    if (GOOD_TARA_OFFSETS.has(offset)) {
      good_nakshatras.push({ nakshatra: namesFn(i), index: i });
    }
  }

  return { good_nakshatras };
}

/**
 * Check if a specific nakshatra is auspicious (good tara) relative to birth.
 */
export function isTaraGood(
  currentNakIdx: number,
  birthNakIdx: number,
): boolean {
  const offset = (currentNakIdx - birthNakIdx + 27) % 27;
  return GOOD_TARA_OFFSETS.has(offset);
}
