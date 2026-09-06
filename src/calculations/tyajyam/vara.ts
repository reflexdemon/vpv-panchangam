import type { TimeWindow } from "../../types";
import {
  VARA_TYAJYAM_NAZHIGAI,
  VARA_TYAJYAM_DURATION_MIN,
} from "../../constants/muhurta";

/** Compute Vara Tyajyam window from sunrise. */
export function vara_tyajyam(
  sunriseIso: string,
  weekday: number,
): TimeWindow | null {
  const nazhigai = VARA_TYAJYAM_NAZHIGAI[weekday];
  if (nazhigai == null) return null;

  const sunriseMs = new Date(sunriseIso).getTime();
  const offsetMs = nazhigai * 24 * 60 * 1000; // 1 nazhigai = 24 min
  const durMs = VARA_TYAJYAM_DURATION_MIN * 60 * 1000;
  const start = sunriseMs + offsetMs;

  return {
    start: new Date(start).toISOString(),
    end: new Date(start + durMs).toISOString(),
  };
}
