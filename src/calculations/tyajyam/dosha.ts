import type { DoshaTyajyamWindow } from "../../types";
import {
  GURU_ASTHAMANAM_ORB,
  SUKRA_ASTHAMANAM_ORB_DIRECT,
  SUKRA_ASTHAMANAM_ORB_RETRO,
} from "../../constants/muhurta";

function withinOrb(lon: number, sunLon: number, orb: number): boolean {
  const diff = Math.abs(lon - sunLon);
  return diff <= orb || diff >= 360 - orb;
}

/**
 * Compute Dosha Tyajyam from eclipse windows and combustion periods.
 *
 * @param sunriseIso    Day start
 * @param sunsetIso     Day end
 * @param eclipseWins   Eclipse windows intersecting this day (from swe.eclipse calls)
 * @param jupiterLon    Jupiter sidereal longitude
 * @param venusLon      Venus sidereal longitude
 * @param venusRetro    Whether Venus is retrograde
 * @param sunLon        Sun sidereal longitude
 */
export function dosha_tyajyam(
  sunriseIso: string,
  sunsetIso: string,
  eclipseWins: Array<{ start: string; end: string; kind: "solar" | "lunar" }>,
  jupiterLon: number,
  venusLon: number,
  venusRetro: boolean,
  sunLon: number,
): DoshaTyajyamWindow[] {
  const results: DoshaTyajyamWindow[] = [];
  const dayStart = new Date(sunriseIso).getTime();
  const dayEnd = new Date(sunsetIso).getTime();

  // Eclipse windows clipped to day
  for (const e of eclipseWins) {
    const eStart = Math.max(new Date(e.start).getTime(), dayStart);
    const eEnd = Math.min(new Date(e.end).getTime(), dayEnd);
    if (eEnd > eStart) {
      results.push({
        start: new Date(eStart).toISOString(),
        end: new Date(eEnd).toISOString(),
        dosha: `${e.kind === "solar" ? "Solar" : "Lunar"} Eclipse`,
      });
    }
  }

  // Guru Asthamanam (Jupiter combustion)
  if (withinOrb(jupiterLon, sunLon, GURU_ASTHAMANAM_ORB)) {
    results.push({
      start: sunriseIso,
      end: sunsetIso,
      dosha: "Guru Asthamanam",
    });
  }

  // Sukra Asthamanam (Venus combustion)
  const venusOrb = venusRetro
    ? SUKRA_ASTHAMANAM_ORB_RETRO
    : SUKRA_ASTHAMANAM_ORB_DIRECT;
  if (withinOrb(venusLon, sunLon, venusOrb)) {
    results.push({
      start: sunriseIso,
      end: sunsetIso,
      dosha: "Sukra Asthamanam",
    });
  }

  return results;
}
