import type { TithiTyajyamWindow, PanchangItem } from "../../types";
import {
  TITHI_TYAJYAM_BASE,
  TITHI_TYAJYAM_DURATION_MIN,
} from "../../constants/muhurta";

/** Compute Tithi Tyajyam windows from a tithi sequence. */
export function tithi_tyajyam(tithis: PanchangItem[]): TithiTyajyamWindow[] {
  const results: TithiTyajyamWindow[] = [];
  const durMs = TITHI_TYAJYAM_DURATION_MIN * 60 * 1000;

  for (const tithi of tithis) {
    const idx = tithi.index; // 1-30
    // Purnima (15) → base[14], Amavasya (30) → base[15]
    let baseIdx = (idx - 1) % 15;
    if (idx === 15) baseIdx = 14;
    if (idx === 30) baseIdx = 15;

    const ratio = TITHI_TYAJYAM_BASE[baseIdx];
    if (!ratio) continue;
    const [num, denom] = ratio;

    const tStart = new Date(tithi.starts_at ?? tithi.ends_at).getTime();
    const tEnd = new Date(tithi.ends_at).getTime();
    const tDur = tEnd - tStart;

    const offsetMs = (tDur * num) / denom;
    const startMs = tStart + offsetMs;

    results.push({
      start: new Date(startMs).toISOString(),
      end: new Date(Math.min(startMs + durMs, tEnd)).toISOString(),
      tithi: tithi.name,
    });
  }
  return results;
}
