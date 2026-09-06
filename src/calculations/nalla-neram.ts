/**
 * Nalla Neram — auspicious periods = auspicious horas minus inauspicious windows.
 */

import type { TimeWindow, HoraSegment } from "../types";

/** Subtract inauspicious windows from a list of good windows. */
function subtractWindows(good: TimeWindow[], bad: TimeWindow[]): TimeWindow[] {
  const result: TimeWindow[] = [];

  for (const g of good) {
    let remaining: TimeWindow[] = [g];

    for (const b of bad) {
      const newRemaining: TimeWindow[] = [];
      for (const r of remaining) {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        const rStart = new Date(r.start).getTime();
        const rEnd = new Date(r.end).getTime();

        if (bEnd <= rStart || bStart >= rEnd) {
          // No overlap
          newRemaining.push(r);
        } else {
          // Left part
          if (bStart > rStart) {
            newRemaining.push({
              start: r.start,
              end: new Date(bStart).toISOString(),
            });
          }
          // Right part
          if (bEnd < rEnd) {
            newRemaining.push({
              start: new Date(bEnd).toISOString(),
              end: r.end,
            });
          }
        }
      }
      remaining = newRemaining;
    }

    result.push(...remaining);
  }

  // Filter out empty windows (<1 min)
  return result.filter((w) => {
    const dur = new Date(w.end).getTime() - new Date(w.start).getTime();
    return dur > 60 * 1000;
  });
}

/**
 * Compute Nalla Neram (auspicious hours).
 *
 * @param horas       Hora segments (day + night)
 * @param inauspicious Inauspicious timing windows to subtract
 */
export function computeNallaNeram(
  horas: HoraSegment[],
  inauspicious: TimeWindow[],
): TimeWindow[] {
  const goodHoras: TimeWindow[] = horas
    .filter((h) => h.auspicious)
    .map((h) => ({ start: h.start, end: h.end }));

  return subtractWindows(goodHoras, inauspicious);
}
