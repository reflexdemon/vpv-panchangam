import type { TithiLagnaTyajyamWindow } from "../../types";

/**
 * Tithi-Lagna Tyajyam: inauspicious when certain tithis coincide with
 * their corresponding bad lagnas. Simplified: flag when Lagna sign
 * matches the tithi's afflicted sign.
 *
 * Afflicted sign = same sign as current tithi's number mod 12 (rough heuristic).
 */
export function tithi_lagna_tyajyam(
  tithis: Array<{
    index: number;
    name: string;
    starts_at?: string;
    ends_at: string;
  }>,
  lagnas: Array<{ sign: string; rashi: string; start: string; end: string }>,
  signNames: string[], // 0-indexed sign names
): TithiLagnaTyajyamWindow[] {
  const results: TithiLagnaTyajyamWindow[] = [];

  // Find overlapping windows between each tithi and lagna
  for (const tithi of tithis) {
    const tStart = new Date(tithi.starts_at ?? tithi.ends_at).getTime();
    const tEnd = new Date(tithi.ends_at).getTime();

    // The afflicted lagna for this tithi: sign index = (tithi.index - 1) % 12
    const afflictedSignIdx = (tithi.index - 1) % 12;
    const afflictedSign = signNames[afflictedSignIdx] ?? "";

    for (const lagna of lagnas) {
      if (lagna.sign !== afflictedSign) continue;
      const lStart = new Date(lagna.start).getTime();
      const lEnd = new Date(lagna.end).getTime();

      const overlapStart = Math.max(tStart, lStart);
      const overlapEnd = Math.min(tEnd, lEnd);
      if (overlapEnd <= overlapStart) continue;

      results.push({
        start: new Date(overlapStart).toISOString(),
        end: new Date(overlapEnd).toISOString(),
        tithi: tithi.name,
        sign: lagna.sign,
      });
    }
  }

  return results;
}
