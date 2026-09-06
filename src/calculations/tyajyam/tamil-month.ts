import type { TamilMonthAvoidables } from "../../types";

/**
 * Tamil Month Avoidables — per-month lists of tithis/nakshatras/lagnas to avoid.
 * Returns null when the current month has no avoidables.
 */
export function tamil_month_avoidables(
  tamilMonthEn: string,
): TamilMonthAvoidables | null {
  // Per-month avoidable lookups (representative subset; extend as needed)
  const AVOIDABLES: Record<string, Omit<TamilMonthAvoidables, "windows">> = {
    Chithirai: {
      avoid_tithis: ["Ashtami"],
      avoid_nakshatras: ["Bharani"],
      avoid_lagnas: ["Scorpio"],
    },
    Vaikasi: {
      avoid_tithis: ["Chaturdashi"],
      avoid_nakshatras: ["Krittika"],
      avoid_lagnas: [],
    },
    Aani: {
      avoid_tithis: ["Navami"],
      avoid_nakshatras: ["Ardra"],
      avoid_lagnas: [],
    },
    Aadi: {
      avoid_tithis: ["Saptami"],
      avoid_nakshatras: ["Ashlesha"],
      avoid_lagnas: ["Cancer"],
    },
    Aavani: { avoid_tithis: [], avoid_nakshatras: [], avoid_lagnas: [] },
    Purattasi: {
      avoid_tithis: ["Ashtami"],
      avoid_nakshatras: ["Vishakha"],
      avoid_lagnas: [],
    },
    Aippasi: {
      avoid_tithis: [],
      avoid_nakshatras: ["Jyeshtha"],
      avoid_lagnas: [],
    },
    Karthigai: {
      avoid_tithis: ["Trayodashi"],
      avoid_nakshatras: ["Mula"],
      avoid_lagnas: [],
    },
    Margazhi: {
      avoid_tithis: [],
      avoid_nakshatras: ["Purva Ashadha"],
      avoid_lagnas: [],
    },
    Thai: {
      avoid_tithis: ["Ekadashi"],
      avoid_nakshatras: [],
      avoid_lagnas: [],
    },
    Maasi: {
      avoid_tithis: [],
      avoid_nakshatras: ["Uttara Bhadrapada"],
      avoid_lagnas: [],
    },
    Panguni: {
      avoid_tithis: ["Dwitiya"],
      avoid_nakshatras: ["Revati"],
      avoid_lagnas: [],
    },
  };

  const data = AVOIDABLES[tamilMonthEn];
  if (!data) return null;
  if (
    !data.avoid_tithis.length &&
    !data.avoid_nakshatras.length &&
    !data.avoid_lagnas.length
  )
    return null;

  return { ...data, windows: [] };
}
