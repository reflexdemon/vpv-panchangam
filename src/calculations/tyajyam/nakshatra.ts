import type { NakshatraTyajyamWindow, PanchangItem } from "../../types";
import {
  NAKSHATRA_TYAJYAM_RATIO,
  NAKSHATRA_TYAJYAM_DURATION_MIN,
} from "../../constants/muhurta";
import { NAK_SPAN } from "../../constants/panchang";

/** Compute Nakshatra Tyajyam windows from a nakshatra sequence. */
export function nakshatra_tyajyam(
  nakshatras: PanchangItem[],
): NakshatraTyajyamWindow[] {
  const results: NakshatraTyajyamWindow[] = [];
  const durMs = NAKSHATRA_TYAJYAM_DURATION_MIN * 60 * 1000;

  for (const nak of nakshatras) {
    const ratio = NAKSHATRA_TYAJYAM_RATIO[nak.index];
    if (!ratio) continue;
    const [num, denom] = ratio;

    const nakStart = new Date(nak.starts_at ?? nak.ends_at).getTime();
    const nakEnd = new Date(nak.ends_at).getTime();
    const nakDurMs = nakEnd - nakStart;

    const offsetMs = (nakDurMs * num) / denom;
    const startMs = nakStart + offsetMs;
    const endMs = startMs + durMs;

    results.push({
      start: new Date(startMs).toISOString(),
      end: new Date(Math.min(endMs, nakEnd)).toISOString(),
      nakshatra: nak.name,
    });
  }
  return results;
}
