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
  AMANTA_MONTHS,
  NATIONAL_CIVIL_MONTHS,
} from "../constants/calendars";
import { signIdFromLon, tithiIndex } from "./panchang";

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

const TROP_FLAGS = () => SE.FLG_SWIEPH | SE.FLG_SPEED;

export function elongationAt(jd: number, ephe: EphemerisService): number {
  const s = ephe.calcUt(jd, SE.SUN, TROP_FLAGS()).lon;
  const m = ephe.calcUt(jd, SE.MOON, TROP_FLAGS()).lon;
  return (((m - s) % 360) + 360) % 360;
}

/** JD of the last new moon (elongation 0°) at or before `jd`. */
export function lastNewMoonBefore(jd: number, ephe: EphemerisService): number {
  let hi = jd;
  for (let i = 0; i < 35; i++) {
    const lo = hi - 1;
    if (elongationAt(lo, ephe) > elongationAt(hi, ephe)) {
      return findAngleTime(lo, hi, 0, (t) => elongationAt(t, ephe)) ?? hi;
    }
    hi = lo;
  }
  return jd - 29.530588;
}

/** Sidereral Sun enters `signId` (1=Aries..12=Pisces) — the sankranti nearest the 1st of `month`. */
function sankrantiInMonth(
  year: number,
  month: number,
  signId: number,
  ephe: EphemerisService,
): number {
  const lo = dateToJd(year, month, 1, ephe) - 5;
  const hi = dateToJd(year, month, 28, ephe) + 5;
  const target = (signId - 1) * 30;
  return (
    findAngleTime(
      lo,
      hi,
      target,
      (t) => ephe.calcUt(t, SE.SUN, SIDEREAL_FLAGS()).lon,
    ) ?? dateToJd(year, month, 15, ephe)
  );
}

/** Instant (JD) when Sun enters sidereal Aries (Mesha) in Gregorian `year`. */
export function meshaSankrantiJd(year: number, ephe: EphemerisService): number {
  return sankrantiInMonth(year, 4, 1, ephe);
}

/** Chaitra Shukla Pratipada instant for the Shaka year that begins in Gregorian `year`. */
export function chaitraShukla1Jd(year: number, ephe: EphemerisService): number {
  const mesha = meshaSankrantiJd(year, ephe); // Sun enters Aries in April
  return lastNewMoonBefore(mesha, ephe);
}

/** Kartik Shukla Pratipada instant (≈ Diwali) in Gregorian `year`. */
export function kartikShukla1Jd(year: number, ephe: EphemerisService): number {
  const vrischika = sankrantiInMonth(year, 11, 8, ephe); // Sun enters Scorpio in November
  return lastNewMoonBefore(vrischika, ephe);
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

  // Shaka year increments on Chaitra Shukla Pratipada (the new moon before the
  // Mesha sankranti), not at Mesha ingress.
  const [gregYear, gregMonth, gregDay] = ephe.revjul(jd);
  const chaitraThis = chaitraShukla1Jd(gregYear, ephe);
  const shakaYear = jd >= chaitraThis ? gregYear - 78 : gregYear - 79;

  // Vikram Samvat = Shaka + 135
  const vikramYear = shakaYear + 135;

  // Kali year = Shaka + 3179
  const kaliYear = shakaYear + 3179;

  // Gujarati Samvat = Vikram − 1 between Chaitra Shukla 1 and Kartik Shukla 1; else Vikram.
  // The Chaitra end of that window tracks the Shaka/Vikram roll (the new-moon
  // date, compared against `jd` above). The Kartik new year (Bestu Varas) is the
  // day Kartik Shukla Pratipada is current at **sunrise** — the panchang day
  // boundary — which is why Gujarati is location-dependent on the boundary day
  // (e.g. 2026-11-09: Delhi/Chennai sunrise precedes the 07:02 UT new moon → 2082;
  // London sunrise follows it → 2083).
  const chaitraPrev = chaitraShukla1Jd(gregYear - 1, ephe);
  const kartikThis = kartikShukla1Jd(gregYear, ephe);
  const kartikPrev = kartikShukla1Jd(gregYear - 1, ephe);
  const lastChaitra = jd >= chaitraThis ? chaitraThis : chaitraPrev;
  const lastKartik = sunriseJd >= kartikThis ? kartikThis : kartikPrev;
  const gujaratiYear = lastChaitra > lastKartik ? vikramYear - 1 : vikramYear;

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

  // Amanta lunar month = the month begun by the last new moon before sunrise,
  // named by the Sun's sidereal sign at that new moon (Meena → Chaitra).
  // Purnimanta = amanta during Shukla paksha, next month during Krishna paksha.
  // The paksha is taken at sunrise (the panchang day boundary): the noon tithi
  // can differ, e.g. 2026-03-19 where Amavasya ends 06:52 after sunrise 06:26.
  const lastNm = lastNewMoonBefore(sunriseJd, ephe);
  const sunSignAtNm = signIdFromLon(
    ephe.calcUt(lastNm, SE.SUN, SIDEREAL_FLAGS()).lon,
  ); // 1..12
  const amantaIdx = sunSignAtNm % 12;
  const chandramasaAmanta = AMANTA_MONTHS[amantaIdx];
  const tithiIdxAtSunrise = tithiIndex(
    ephe.calcUt(sunriseJd, SE.SUN, SIDEREAL_FLAGS()).lon,
    ephe.calcUt(sunriseJd, SE.MOON, SIDEREAL_FLAGS()).lon,
  );
  const chandramasaPurnimanta =
    tithiIdxAtSunrise <= 15
      ? chandramasaAmanta
      : AMANTA_MONTHS[(amantaIdx + 1) % 12];

  // Paksha
  const paksha = tithiIdxAtSunrise <= 15 ? "Shukla Paksha" : "Krishna Paksha";

  // Pravishte days: days elapsed since new moon / full moon
  const pravishteDays = tithiIdx <= 15 ? tithiIdx : tithiIdx - 15;

  // Ritu and Ayana
  const drikRitu = SIGN_TO_DRIK_RITU[sunSignId] ?? "";
  const vedicRitu = SIGN_TO_VEDIC_RITU[sunSignId] ?? "";
  const drikAyana = UTTARAYANA_SIGNS.has(sunSignId)
    ? "Uttarayana"
    : "Dakshinayana";
  const vedicAyana = drikAyana;

  // National Civil Calendar (Indian Saka National Calendar) is solar: Chaitra 1
  // is Mar 22 (Mar 21 in leap years), not the lunar Chaitra Shukla Pratipada
  // used by the Shaka year above.
  const nationalShakaYear =
    gregMonth > 3 ||
    (gregMonth === 3 && gregDay >= (isGregorianLeap(gregYear) ? 21 : 22))
      ? gregYear - 78
      : gregYear - 79;
  // `_nirayana` is unused, so both national dates coincide today (known open delta).
  const nationalCivil = computeNationalCivilDate(jd, nationalShakaYear, false);
  const nationalNirayana = computeNationalCivilDate(
    jd,
    nationalShakaYear,
    true,
  );

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
    nationalCivilDate: { ...nationalCivil, shakaYear: nationalShakaYear },
    nationalNirayanaDate: {
      ...nationalNirayana,
      shakaYear: nationalShakaYear,
    },
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
    "Ashwina",
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
  shakaYearOverride?: number,
): import("../types").TamilCalendar {
  const [gregYear] = ephe.revjul(jd);
  const tamilMonth = tamilMonths[sunSignId];
  const dayInMonth = Math.floor(jd - sunSignStartJd) + 1;

  // Tamil solar year changes at Mesha sankranti (Sun entering Aries in mid-April, Chithirai 1).
  // The Tamil 60-year samvatsara cycle follows this solar boundary:
  // Before Mesha sankranti: gregYear - 79
  // At/after Mesha sankranti: gregYear - 78
  let shakaYear: number;
  if (shakaYearOverride !== undefined) {
    shakaYear = shakaYearOverride;
  } else {
    const meshaJd = meshaSankrantiJd(gregYear, ephe);
    shakaYear = jd >= meshaJd ? gregYear - 78 : gregYear - 79;
  }
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
