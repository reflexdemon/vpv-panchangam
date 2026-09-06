import type { GowriTyajyamWindow, GowriSegment } from "../../types";

const INAUSPICIOUS_GOWRI = new Set(["Soram", "Visham", "Rogam"]);

/** Extract Gowri Tyajyam from Gowri segments. */
export function gowri_tyajyam(
  day: GowriSegment[],
  night: GowriSegment[],
): GowriTyajyamWindow[] {
  const all = [...day, ...night];
  return all
    .filter((s) => INAUSPICIOUS_GOWRI.has(s.name))
    .map((s) => ({
      start: s.start,
      end: s.end,
      name: s.name,
      period: day.includes(s) ? "day" : "night",
    }));
}
