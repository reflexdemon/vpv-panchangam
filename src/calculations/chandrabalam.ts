/**
 * Chandrabalam — moon-sign-based auspiciousness assessment.
 * Computes which signs are 'good' relative to the birth moon sign.
 */

import type { Chandrabalam } from "../types";
import { GOOD_CHANDRA_OFFSETS } from "../constants/calendars";

/**
 * Compute Chandrabalam good rashis.
 *
 * @param birthSignId  Birth moon sign ID (1-12)
 * @param namesFn      Function to resolve rashi name from 0-based index
 */
export function computeChandrabalam(
  birthSignId: number,
  namesFn: (idx: number) => string,
): Chandrabalam {
  const good_rashis: Array<{ rashi: string; index: number }> = [];
  const birthIdx = birthSignId - 1; // convert to 0-based

  for (let i = 0; i < 12; i++) {
    const offset = (i - birthIdx + 12) % 12;
    if (GOOD_CHANDRA_OFFSETS.has(offset)) {
      good_rashis.push({ rashi: namesFn(i), index: i + 1 });
    }
  }

  return { good_rashis };
}

/**
 * Check if a given sign is chandrabalam-good relative to birth moon sign.
 */
export function isChandraGood(
  currentSignId: number,
  birthSignId: number,
): boolean {
  const offset = (currentSignId - birthSignId + 12) % 12;
  return GOOD_CHANDRA_OFFSETS.has(offset);
}
