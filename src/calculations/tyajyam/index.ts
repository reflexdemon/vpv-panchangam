/**
 * Tyajyam orchestrator — aggregates all 10 inauspicious period types.
 */

export { nakshatra_tyajyam } from "./nakshatra";
export { tithi_tyajyam } from "./tithi";
export { vara_tyajyam } from "./vara";
export { amritadi_yogam } from "./amritadi";
export { lagna_tyajyam } from "./lagna";
export { karana_tyajyam } from "./karana";
export { gowri_tyajyam } from "./gowri";
export { dosha_tyajyam } from "./dosha";
export { tithi_lagna_tyajyam } from "./tithi-lagna";
export { tamil_month_avoidables } from "./tamil-month";

import type {
  Tyajyam,
  PanchangItem,
  GowriSegment,
  GowriPanchanga,
} from "../../types";
import { nakshatra_tyajyam } from "./nakshatra";
import { tithi_tyajyam } from "./tithi";
import { vara_tyajyam } from "./vara";
import { amritadi_yogam } from "./amritadi";
import { lagna_tyajyam } from "./lagna";
import { karana_tyajyam } from "./karana";
import { gowri_tyajyam } from "./gowri";
import { dosha_tyajyam } from "./dosha";
import { tithi_lagna_tyajyam } from "./tithi-lagna";
import { tamil_month_avoidables } from "./tamil-month";

export interface TyajyamInputs {
  nakshatras: PanchangItem[];
  tithis: PanchangItem[];
  karanas: PanchangItem[];
  sunriseIso: string;
  sunsetIso: string;
  weekday: number;
  gowri: GowriPanchanga;
  lagnas: Array<{ sign: string; rashi: string; start: string; end: string }>;
  signNames: string[];
  jupiterLon: number;
  venusLon: number;
  venusRetro: boolean;
  sunLon: number;
  eclipseWins: Array<{ start: string; end: string; kind: "solar" | "lunar" }>;
  tamilMonthEn: string;
}

/** Compute all Tyajyam types at once. */
export function computeTyajyam(inputs: TyajyamInputs): Tyajyam {
  return {
    nakshatraTyajyam: nakshatra_tyajyam(inputs.nakshatras),
    tithiTyajyam: tithi_tyajyam(inputs.tithis),
    varaTyajyam: vara_tyajyam(inputs.sunriseIso, inputs.weekday),
    amritadiYogam: amritadi_yogam(inputs.nakshatras, inputs.weekday),
    lagnaTyajyam: lagna_tyajyam(inputs.lagnas),
    karanaTyajyam: karana_tyajyam(inputs.karanas),
    gowriTyajyam: gowri_tyajyam(inputs.gowri.day, inputs.gowri.night),
    doshaTyajyam: dosha_tyajyam(
      inputs.sunriseIso,
      inputs.sunsetIso,
      inputs.eclipseWins,
      inputs.jupiterLon,
      inputs.venusLon,
      inputs.venusRetro,
      inputs.sunLon,
    ),
    tithiLagnaTyajyam: tithi_lagna_tyajyam(
      inputs.tithis,
      inputs.lagnas,
      inputs.signNames,
    ),
    tamilMonthAvoidables: tamil_month_avoidables(inputs.tamilMonthEn),
  };
}
