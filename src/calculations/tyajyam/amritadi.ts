import type { AmritadiYogamWindow, PanchangItem } from "../../types";
import { AMRITADI_TABLE } from "../../constants/muhurta";

const YOGAM_NAMES: Record<string, string> = {
  A: "Amrita",
  S: "Siddha",
  M: "Marana",
  P: "Prabalarishta",
};

/** Compute Amritadi Yogam for each nakshatra in the sequence. */
export function amritadi_yogam(
  nakshatras: PanchangItem[],
  weekday: number, // 1=Mon..7=Sun
): AmritadiYogamWindow[] {
  const results: AmritadiYogamWindow[] = [];
  const dayCol = weekday - 1; // 0-based column in AMRITADI_TABLE

  for (const nak of nakshatras) {
    const row = AMRITADI_TABLE[nak.index];
    if (!row) continue;
    const code = row[dayCol] ?? "S";
    const yogam = YOGAM_NAMES[code] ?? "Siddha";

    results.push({
      start: nak.starts_at ?? nak.ends_at,
      end: nak.ends_at,
      nakshatra: nak.name,
      yogam,
    });
  }
  return results;
}
