import type { KaranaTyajyamWindow, PanchangItem } from "../../types";
import { INAUSPICIOUS_KARANAS } from "../../constants/muhurta";

/** Extract Karana Tyajyam windows from the karana sequence. */
export function karana_tyajyam(karanas: PanchangItem[]): KaranaTyajyamWindow[] {
  return karanas
    .filter((k) => INAUSPICIOUS_KARANAS.has(k.name))
    .map((k) => ({
      start: k.starts_at ?? k.ends_at,
      end: k.ends_at,
      karana: k.name,
    }));
}
