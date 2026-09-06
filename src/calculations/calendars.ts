/**
 * Calendar conversions: Shaka, Vikram, Kali, Gujarati, National Civil,
 * Nirayana solar, Lunar month, Ritu/Ayana.
 */

import type { EphemerisService } from "../ephemeris";
import { SE } from "../ephemeris";
import { findAngleTime } from "./bisection";
import {
  KALI_START_JD,
  RATA_DIE_EPOCH_JD,
  SIGN_TO_DRIK_RITU,
  SIGN_TO_VEDIC_RITU,
  UTTARAYANA_SIGNS,
  CHANDRA_MASA_BY_SUNSIGN,
  NATIONAL_CIVIL_MONTHS,
} from "../constants/calendars";
import { signIdFromLon } from "./panchang";

const SIDEREAL_FLAGS = () => SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;

export interface CalendarInfo {
  kaliYear: number;
  kaliAhargana: number;
  julianDay: number;
  modifiedJulianDay: number;
  rataDie: number;
  ayanamshaLahiri: number;
  shakaYear: number;
  vikramYear: number;
  gujaratiYear: number;
  nationalCivilDate: { month: string; day: number; shakaYear: number };
  nationalNirayanaDate: { month: string; day: number; shakaYear: number };
  samvatsaraShaka: string; // index into samvatsaras (0-59)
  samvatsaraVikram: string;
  samvatsaraShakaSuffix: number; // 0-based index
  samvatsaraVikramSuffix: number;
  vikramSamvat: number;
  shaka: number;
  gujaratiSamvat: number;
  chandramasaAmanta: string;
  chandramasaPurnimanta: string;
  paksha: string;
  pravishteDays: number;
  niraayanaSolarMonth: string;
  drikRitu: string;
  drikAyana: string;
  vedicRitu: string;
  vedicAyana: string;
}

/**
 * Compute Julian Day at UT noon for a given Gregorian date.
 */
export function dateToJd(
  year: number,
  month: number,
  day: number,
  ephe: EphemerisService,
): number {
  return ephe.julday(year, month, day, 12.0);
}

/**
 * Compute all calendar values for a given Julian Day (at sunrise, noon, or any UT).
 */
export function computeCalendars(
  jd: number,
  sunLon: number, // sidereal longitude of Sun
  moonLon: number, // sidereal longitude of Moon
  tithiIdx: number, // 1-30
  sunriseJd: number,
  ephe: EphemerisService,
  samvatsaraNames: string[],
  nakshatra?: string,
): CalendarInfo {
  // Julian Day and derived
  const julianDay = jd;
  const modifiedJulianDay = jd - 2400000.5;
  const rataDie = Math.floor(jd - RATA_DIE_EPOCH_JD);

  // Kali Ahargana: elapsed days from Kali epoch
  const kaliAhargana = Math.floor(jd - KALI_START_JD);
  // Kali year (approximate): elapsed since 3102 BCE
  const kaliYear = Math.floor(kaliAhargana / 365.25) + 1;

  // Shaka Samvat: tropical year CE − 78 for Mesha ingress
  // Simplified: Shaka = CE year − 78 (before Mesha) or CE year − 77 (after)
  const [gregYear, gregMonth, gregDay, gregHour] = ephe.revjul(jd);
  const afterMeshaIngress = sunLon >= 0; // Sun past 0° sidereal Aries
  const shakaYear = gregYear - (afterMeshaIngress ? 77 : 78);

  // Vikram Samvat: Shaka + 135
  const vikramYear = shakaYear + 135;

  // Gujarati Samvat: Vikram − 1 (new year is Kartik Shukla Pratipada)
  const gujaratiYear = vikramYear - 1;

  // Samvatsara (60-year cycle)
  // Shaka samvatsara = (shaka_year + 11) % 60
  const samvatsaraShakaSuffix = (shakaYear + 11) % 60;
  // Vikram samvatsara = (vikram_year + 9) % 60
  const samvatsaraVikramSuffix = (vikramYear + 9) % 60;
  const samvatsaraShaka = samvatsaraNames[samvatsaraShakaSuffix] ?? "";
  const samvatsaraVikram = samvatsaraNames[samvatsaraVikramSuffix] ?? "";

  // Nirayana solar month (sidereal Sun sign)
  const sunSignId = signIdFromLon(sunLon); // 1-12
  const niraayanaSolarMonth = getNirayanaSolarMonth(sunSignId - 1); // 0-based

  // Chandramasa (lunar month) from Sun sign
  const chandramasaAmanta = CHANDRA_MASA_BY_SUNSIGN[(sunSignId - 1 + 12) % 12];
  // Purnimanta is one month ahead
  const chandramasaPurnimanta = CHANDRA_MASA_BY_SUNSIGN[sunSignId % 12];

  // Paksha
  const paksha = tithiIdx <= 15 ? "Shukla Paksha" : "Krishna Paksha";

  // Pravishte days: days elapsed since new moon / full moon
  const pravishteDays = tithiIdx <= 15 ? tithiIdx : tithiIdx - 15;

  // Ritu and Ayana
  const drikRitu = SIGN_TO_DRIK_RITU[sunSignId] ?? "";
  const vedicRitu = SIGN_TO_VEDIC_RITU[sunSignId] ?? "";
  const drikAyana = UTTARAYANA_SIGNS.has(sunSignId)
    ? "Uttarayana"
    : "Dakshinayana";
  const vedicAyana = drikAyana;

  // National Civil Calendar (Indian Saka National Calendar)
  const nationalCivil = computeNationalCivilDate(jd, shakaYear, false);
  const nationalNirayana = computeNationalCivilDate(jd, shakaYear, true);

  // Ayanamsa (Lahiri) at this JD
  const ayanamshaLahiri = ephe.getAyanamsaUt(jd);

  return {
    kaliYear,
    kaliAhargana,
    julianDay,
    modifiedJulianDay,
    rataDie,
    ayanamshaLahiri,
    shakaYear,
    vikramYear,
    gujaratiYear,
    nationalCivilDate: { ...nationalCivil, shakaYear },
    nationalNirayanaDate: { ...nationalNirayana, shakaYear },
    samvatsaraShaka,
    samvatsaraVikram,
    samvatsaraShakaSuffix,
    samvatsaraVikramSuffix,
    vikramSamvat: vikramYear,
    shaka: shakaYear,
    gujaratiSamvat: gujaratiYear,
    chandramasaAmanta,
    chandramasaPurnimanta,
    paksha,
    pravishteDays,
    niraayanaSolarMonth,
    drikRitu,
    drikAyana,
    vedicRitu,
    vedicAyana,
  };
}

function getNirayanaSolarMonth(sunSignIdx: number): string {
  // Nirayana months: sign 0 (Aries) = Vaishakha, etc.
  const NIRAYANA = [
    "Vaishakha",
    "Jyeshtha",
    "Ashadha",
    "Shravana",
    "Bhadrapada",
    "Ashwin",
    "Kartika",
    "Margashirsha",
    "Pausha",
    "Magha",
    "Phalguna",
    "Chaitra",
  ];
  return NIRAYANA[sunSignIdx] ?? "";
}

/**
 * Compute the Indian National Civil Calendar date.
 * National Calendar Saka starts March 22 (March 21 in leap years) = 1 Chaitra.
 */
function computeNationalCivilDate(
  jd: number,
  shakaYear: number,
  _nirayana: boolean,
): { month: string; day: number } {
  const [gregYear, gregMonth, gregDay] = [0, 0, 0]; // placeholder
  // Chaitra 1 falls on March 22 (Gregorian) in common years, March 21 in leap years
  // We compute elapsed days from March 22 (or 21) of this Saka year start
  const [y] = [2000]; // we'll use the Saka year start
  // March 22 Julian Day for this Greg year
  const chaitraStartGreg = isGregorianLeap(shakaYear + 78) ? 21 : 22;
  const chaitraStartJd = new EphemerisServiceProxy().julday(
    shakaYear + 78,
    3,
    chaitraStartGreg,
    12,
  );

  let dayOfYear = Math.floor(jd) - Math.floor(chaitraStartJd);

  if (dayOfYear < 0) {
    // Previous Saka year
    const prevChaitraJd = new EphemerisServiceProxy().julday(
      shakaYear + 77,
      3,
      isGregorianLeap(shakaYear + 77) ? 21 : 22,
      12,
    );
    dayOfYear = Math.floor(jd) - Math.floor(prevChaitraJd);
  }

  let cumDays = 0;
  for (let i = 0; i < NATIONAL_CIVIL_MONTHS.length; i++) {
    const monthDays =
      i === 0 && isGregorianLeap(shakaYear + 78)
        ? 31
        : NATIONAL_CIVIL_MONTHS[i].days;
    if (dayOfYear < cumDays + monthDays) {
      return {
        month: NATIONAL_CIVIL_MONTHS[i].name,
        day: dayOfYear - cumDays + 1,
      };
    }
    cumDays += monthDays;
  }

  return { month: "Phalguna", day: 30 };
}

function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Minimal proxy to avoid circular import in this util function
class EphemerisServiceProxy {
  julday(y: number, m: number, d: number, h: number): number {
    // Using the Julian Day formula directly
    const a = Math.floor((14 - m) / 12);
    const yr = y + 4800 - a;
    const mo = m + 12 * a - 3;
    return (
      d +
      Math.floor((153 * mo + 2) / 5) +
      365 * yr +
      Math.floor(yr / 4) -
      Math.floor(yr / 100) +
      Math.floor(yr / 400) -
      32045 +
      (h - 12) / 24
    );
  }
}

/**
 * Find the JD of Sun's last ingress into a sign (Sankranti).
 * @param jd    Current JD (search backwards from here)
 * @param signId  Target sign (1-12)
 */
export function findLastSankranti(
  jd: number,
  signId: number,
  ephe: EphemerisService,
): number {
  const targetDeg = (signId - 1) * 30;
  const sunLonAt = (t: number) => ephe.calcUt(t, SE.SUN, SIDEREAL_FLAGS()).lon;

  // Search window: up to 32 days back (max time Sun spends in a sign)
  const result = findAngleTime(jd - 32, jd, targetDeg, sunLonAt);
  return result ?? jd;
}

/**
 * Compute Tamil Calendar info.
 */
export function computeTamilCalendar(
  jd: number,
  sunSignId: number,
  sunSignStartJd: number,
  weekday: number,
  ephe: EphemerisService,
  tamilMonths: Record<number, { en: string; ta: string }>,
  samvatsaraNames: string[],
  samvatsaraTaNames: string[],
): import("../types").TamilCalendar {
  const [gregYear] = ephe.revjul(jd);
  const tamilMonth = tamilMonths[sunSignId];
  const dayInMonth = Math.floor(jd - sunSignStartJd) + 1;

  // Tamil year = (greg_year - 57) → Thiruvalluvar era (rough approximation)
  // Actually: Tamil year index is Shaka + (samvatsara offset)
  // We use Shaka-based samvatsara for Tamil as well
  const shakaYear = gregYear - 78;
  const samvIdx = (shakaYear + 11) % 60;

  const EN_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const TA_DAYS = [
    "திங்கள்",
    "செவ்வாய்",
    "புதன்",
    "வியாழன்",
    "வெள்ளி",
    "சனி",
    "ஞாயிறு",
  ];

  const monthStartIso = (() => {
    const [sy, sm, sd, sh] = ephe.revjul(sunSignStartJd);
    return `${sy}-${String(sm).padStart(2, "0")}-${String(sd).padStart(2, "0")}`;
  })();

  return {
    week_day: {
      en: EN_DAYS[weekday - 1] ?? "",
      ta: TA_DAYS[weekday - 1] ?? "",
    },
    tamil_date: `${dayInMonth} ${tamilMonth?.ta ?? ""}`,
    tamil_month: {
      id: sunSignId,
      en: tamilMonth?.en ?? "",
      ta: tamilMonth?.ta ?? "",
      rashi: "",
    },
    tamil_year: {
      id: samvIdx + 1,
      name_en: samvatsaraNames[samvIdx] ?? "",
      name_ta: samvatsaraTaNames[samvIdx] ?? "",
      gregorian_start_year: gregYear,
    },
    month_start_iso: monthStartIso,
    nokku_naal: "",
    kari_naal: false,
    thaniya_naal: false,
  };
}
