/**
 * Bisection search engine — finds the Julian Day when a monotonically
 * increasing angle function crosses a target degree within [lo, hi].
 *
 * Used by all panchang boundary finders (tithi, nakshatra, yoga, etc.)
 */

export type AngleFn = (jd: number) => number;

/**
 * Normalize an angular difference to the range (-180, 180].
 */
function normDiff(diff: number): number {
  diff = diff % 360;
  if (diff > 180) diff -= 360;
  if (diff <= -180) diff += 360;
  return diff;
}

/**
 * Find the JD when angleFn(jd) crosses targetDeg within [lo, hi].
 *
 * angleFn must return degrees in [0, 360).
 * Uses ~50 bisection iterations → better than 1e-9 JD precision.
 *
 * @returns JD of crossing, or null if no crossing exists in [lo, hi].
 */
export function findAngleTime(
  lo: number,
  hi: number,
  targetDeg: number,
  angleFn: AngleFn,
): number | null {
  const fLo = angleFn(lo);
  const fHi = angleFn(hi);
  const tg = ((targetDeg % 360) + 360) % 360;

  // Exact matches at boundary
  if (Math.abs(normDiff(fLo - tg)) < 1e-10) return lo;
  if (Math.abs(normDiff(fHi - tg)) < 1e-10) return hi;

  // Normalise both endpoints to [0, 360)
  const nLo = ((fLo % 360) + 360) % 360;
  const nHi = ((fHi % 360) + 360) % 360;

  // Forward arc from start to target, and from start to hi
  const arcToTarget = (tg - nLo + 360) % 360;
  // If nHi wrapped back to same as nLo, the angle advanced a full 360°
  const arcToHi =
    nHi === nLo ? (fHi > fLo + 1e-9 ? 360 : 0) : (nHi - nLo + 360) % 360;

  if (arcToHi < 1e-8) return null; // angle didn't advance
  if (arcToTarget > arcToHi) return null; // target beyond the hi endpoint

  // Binary search (~50 iterations → ~1e-15 JD precision)
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const fMid = angleFn(mid);
    const diff = normDiff(tg - fMid);
    if (diff > 0) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-10) break;
  }

  return (lo + hi) / 2;
}

/**
 * Find all times when angleFn crosses successive multiples of stepDeg
 * within [startJd, endJd], starting from an already-known current angle.
 *
 * Returns an array of {jd, index} for each crossing found.
 *
 * The function internally samples the range to avoid missing crossings
 * when the window spans multiple full cycles.
 */
export function findAllCrossings(
  startJd: number,
  endJd: number,
  stepDeg: number,
  angleFn: AngleFn,
  currentAngle?: number,
): Array<{ jd: number; index: number }> {
  const results: Array<{ jd: number; index: number }> = [];
  const angle0 = currentAngle ?? angleFn(startJd);
  const norm0 = ((angle0 % 360) + 360) % 360;
  const totalSteps = Math.round(360 / stepDeg);
  let curIdx = Math.floor(norm0 / stepDeg); // 0-based current slot
  let searchFrom = startJd;

  // Estimate the JD duration per degree of angle change.
  // Sample a small interval to get angular velocity (deg/JD).
  const sampleDelta = Math.max((endJd - startJd) / 100, 1e-4);
  const sampleAngle = angleFn(startJd + sampleDelta);
  const sampleAdv = (sampleAngle - angle0 + 360) % 360;
  // deg/JD — if near 0 use a fallback
  const degPerJd = sampleAdv > 1e-6 ? sampleAdv / sampleDelta : 1;
  // JD per step
  const jdPerStep = stepDeg / degPerJd;
  // Use half the step size as the sub-window to ensure we catch each crossing
  const subWindow = jdPerStep * 1.5;

  for (let iter = 0; iter < 400; iter++) {
    const nextIdx = (curIdx + 1) % totalSteps;
    const nextTarget = nextIdx * stepDeg;
    // Search only within a reasonable sub-window around the expected crossing
    const searchEnd = Math.min(searchFrom + subWindow, endJd);
    const jd =
      findAngleTime(searchFrom, searchEnd, nextTarget, angleFn) ??
      findAngleTime(searchFrom, endJd, nextTarget, angleFn);
    if (jd == null || jd > endJd) break;
    results.push({ jd, index: nextIdx });
    curIdx = nextIdx;
    searchFrom = jd + 1e-8;
  }

  return results;
}
