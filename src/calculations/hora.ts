/**
 * Planetary Horas — 12 day + 12 night segments cycling through planetary hours.
 */

import type { Hora, HoraSegment } from "../types";
import {
  HORA_CYCLE,
  HORA_DAY_START,
  AUSPICIOUS_HORAS,
} from "../constants/muhurta";
import { jdToIso } from "./panchang";
import type { EphemerisService } from "../ephemeris";

/**
 * Compute Hora for one day.
 */
export function computeHora(
  sunriseJd: number,
  sunsetJd: number,
  nextSunriseJd: number,
  weekday: number,
  ephe: EphemerisService,
): Hora {
  const dayStart = HORA_DAY_START[weekday] ?? 0;
  const nightStart = (dayStart + 12) % 7; // continues from 12th hora

  const dayDur = (sunsetJd - sunriseJd) / 12;
  const nightDur = (nextSunriseJd - sunsetJd) / 12;

  const day: HoraSegment[] = [];
  for (let i = 0; i < 12; i++) {
    const name = HORA_CYCLE[(dayStart + i) % 7]!;
    const start = sunriseJd + i * dayDur;
    const end = sunriseJd + (i + 1) * dayDur;
    day.push({
      name,
      auspicious: AUSPICIOUS_HORAS.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe),
    });
  }

  const night: HoraSegment[] = [];
  for (let i = 0; i < 12; i++) {
    const name = HORA_CYCLE[(nightStart + i) % 7]!;
    const start = sunsetJd + i * nightDur;
    const end = sunsetJd + (i + 1) * nightDur;
    night.push({
      name,
      auspicious: AUSPICIOUS_HORAS.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe),
    });
  }

  return { day, night };
}
