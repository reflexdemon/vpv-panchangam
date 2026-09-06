import type { LagnaTyajyamWindow } from "../../types";
import {
  LAGNA_DEFECT_POSITION,
  LAGNA_DEFECT_RATIO,
} from "../../constants/muhurta";

/** Compute Lagna Tyajyam from the Udaya Lagna sequence. */
export function lagna_tyajyam(
  lagnas: Array<{ sign: string; start: string; end: string }>,
): LagnaTyajyamWindow[] {
  const results: LagnaTyajyamWindow[] = [];

  for (const lagna of lagnas) {
    const position = LAGNA_DEFECT_POSITION[lagna.sign] ?? "beginning";
    const startMs = new Date(lagna.start).getTime();
    const endMs = new Date(lagna.end).getTime();
    const durMs = endMs - startMs;
    const defectMs = durMs * LAGNA_DEFECT_RATIO;

    let tyStart: number;
    let tyEnd: number;

    if (position === "beginning") {
      tyStart = startMs;
      tyEnd = startMs + defectMs;
    } else if (position === "end") {
      tyStart = endMs - defectMs;
      tyEnd = endMs;
    } else {
      // middle
      const mid = startMs + durMs / 2;
      tyStart = mid - defectMs / 2;
      tyEnd = mid + defectMs / 2;
    }

    results.push({
      start: new Date(tyStart).toISOString(),
      end: new Date(tyEnd).toISOString(),
      sign: lagna.sign,
      position,
    });
  }

  return results;
}
