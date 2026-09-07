/**
 * computeDetailedPanchang() — public API entry point.
 */

import type { Locale, PanchangResponse } from "../types";
import { PanchangError } from "../types";
import { EphemerisService, SE } from "../ephemeris";
import { getLocaleTable } from "../locales";
import {
  tithiIndex,
  nakshatraIndex,
  yogaIndex,
  moonSignId,
  karanaHalfIndex,
  signIdFromLon,
  degreeInSign,
  formatDms,
  jdToIso,
  generateTithis,
  generateNakshatras,
  generateYogas,
  generateKaranas,
  generateMoonSigns,
  generateNakshatraPadas,
} from "../calculations/panchang";
import { karanaName } from "../constants/panchang";
import {
  computeSolarTimes,
  computeDaySegments,
  generateUdayaLagna,
} from "../calculations/sunrise";
import {
  muhurtaWindows,
  rahuKalam,
  yamaganda,
  gulikaKalam,
  durMuhurtam,
  brahmaMuhurta,
  pratahSandhya,
  abhijitMuhurta,
  vijayMuhurta,
  godhuliMuhurta,
  sayahnaSandhya,
  nishitaMuhurta,
  varjyamWindow,
  amritKalamWindow,
  sarvarthaSiddhiYoga,
  amritaSiddhiYoga,
  bhadraWindows,
} from "../calculations/muhurta";
import { computeGowri } from "../calculations/gowri";
import { computeHora } from "../calculations/hora";
import { computeNallaNeram } from "../calculations/nalla-neram";
import { computeTyajyam } from "../calculations/tyajyam";
import {
  computeCalendars,
  computeTamilCalendar,
  findLastSankranti,
} from "../calculations/calendars";
import { computeTarabalam } from "../calculations/tarabalam";
import { computeChandrabalam } from "../calculations/chandrabalam";
import {
  detectGandaMula,
  detectRaviYoga,
} from "../calculations/ganda-mula-ravi-yoga";
import {
  DISHA_SHOOL,
  RAHU_VASA,
  CHANDRA_VASA,
  TAMIL_MONTHS_BY_SIGN,
} from "../constants/calendars";
import { NAK_SPAN } from "../constants/panchang";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateToJdNoon(dateStr: string, ephe: EphemerisService): number {
  const [y, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  return ephe.julday(y, m, d, 12.0);
}

/** Convert a JD to an ISO string in a given timezone. */
function jdToTzIso(jd: number, tz: string, ephe: EphemerisService): string {
  const [y, mo, d, hFrac] = ephe.revjul(jd);
  const h = Math.floor(hFrac);
  const mF = (hFrac - h) * 60;
  const min = Math.floor(mF);
  const sF = (mF - min) * 60;
  const sec = Math.floor(sF);
  const ms = Math.round((sF - sec) * 1000);
  const utc = new Date(Date.UTC(y, mo - 1, d, h, min, sec, ms));
  // Format in the target timezone
  return utc
    .toLocaleString("sv-SE", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(" ", "T");
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Compute the full Drik Panchang for a date, location, and locale.
 */
export async function computeDetailedPanchang(
  date?: string,
  latitude?: number,
  longitude?: number,
  timezone = "UTC",
  locale: Locale = "en",
): Promise<PanchangResponse> {
  const ephe = EphemerisService.getInstance();
  if (!ephe.initialized) {
    try {
      await ephe.init();
    } catch (err) {
      throw new PanchangError(
        "EPHEMERIS_ERROR",
        `Ephemeris initialization failed: ${String(err)}`,
      );
    }
  }

  // Validate inputs
  const dateStr = date ?? todayDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new PanchangError("INVALID_DATE", `Invalid date format: ${dateStr}`);
  }
  const lat = latitude ?? 0;
  const lon = longitude ?? 0;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new PanchangError(
      "INVALID_LOCATION",
      `Invalid coordinates: ${lat}, ${lon}`,
    );
  }

  try {
    const table = getLocaleTable(locale);
    const jdNoon = dateToJdNoon(dateStr, ephe);
    const flags = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;

    // ── Sun & Moon positions at noon ──────────────────────────────────────────
    const sunPos = ephe.calcUt(jdNoon, SE.SUN, flags);
    const moonPos = ephe.calcUt(jdNoon, SE.MOON, flags);
    const sunLon = sunPos.lon;
    const moonLon = moonPos.lon;

    // ── Rise/set times ────────────────────────────────────────────────────────
    const solarTimes = computeSolarTimes(jdNoon, lat, lon, ephe);
    const sunriseJd = solarTimes.sunrise ?? jdNoon - 0.25;
    const sunsetJd = solarTimes.sunset ?? jdNoon + 0.25;
    const nextSunriseJd = solarTimes.nextSunrise ?? sunriseJd + 1;

    const sunriseIso =
      solarTimes.sunrise != null ? jdToIso(sunriseJd, ephe) : null;
    const sunsetIso =
      solarTimes.sunset != null ? jdToIso(sunsetJd, ephe) : null;
    const moonriseIso =
      solarTimes.moonrise != null ? jdToIso(solarTimes.moonrise, ephe) : null;
    const moonsetIso =
      solarTimes.moonset != null ? jdToIso(solarTimes.moonset, ephe) : null;
    const nextSunriseIso =
      solarTimes.nextSunrise != null ? jdToIso(nextSunriseJd, ephe) : null;

    const dayInfo = computeDaySegments(sunriseJd, sunsetJd, nextSunriseJd);

    // ── Weekday (ISO: 1=Mon, 7=Sun) ───────────────────────────────────────────
    const weekday = ephe.isoWeekday(jdNoon);

    // ── Vara ──────────────────────────────────────────────────────────────────
    const vara = {
      index: weekday,
      sanskrit: table.varas[weekday] ?? "",
      english: table.varaEnglish[weekday] ?? "",
    };

    // ── Window for sequence generation: sunrise to next sunrise ──────────────
    const winStart = sunriseJd;
    const winEnd = nextSunriseJd;

    // ── Tithis ────────────────────────────────────────────────────────────────
    const tithiSeq = generateTithis(
      winStart,
      winEnd,
      ephe,
      (i) => table.tithis[i] ?? `Tithi ${i}`,
    );
    const tithiNow = tithiSeq[0] ?? null;

    // ── Nakshatras ────────────────────────────────────────────────────────────
    const nakSeq = generateNakshatras(
      winStart,
      winEnd,
      ephe,
      (i) => table.nakshatras[i] ?? `Nak ${i}`,
    );
    const nakNow = nakSeq[0] ?? null;

    // ── Yogas ─────────────────────────────────────────────────────────────────
    const yogaSeq = generateYogas(
      winStart,
      winEnd,
      ephe,
      (i) => table.yogas[i] ?? `Yoga ${i}`,
    );
    const yogaNow = yogaSeq[0] ?? null;

    // ── Karanas ───────────────────────────────────────────────────────────────
    const karanaSeq = generateKaranas(winStart, winEnd, ephe);
    const karanaNow = karanaSeq[0] ?? null;

    // ── Moon signs ────────────────────────────────────────────────────────────
    const moonSignSeq = generateMoonSigns(
      winStart,
      winEnd,
      ephe,
      (i) => table.rashis[i] ?? "",
      (i) => table.rashis[i] ?? "",
    );
    const moonSignNow = moonSignSeq[0] ?? null;

    // ── Sun sign ──────────────────────────────────────────────────────────────
    const sunSignId = signIdFromLon(sunLon);
    const sunsign = {
      index: sunSignId,
      sign: table.signs[sunSignId - 1] ?? "",
      rashi: table.rashis[sunSignId - 1] ?? "",
      longitude: sunLon,
    };

    // ── Surya Nakshatra ───────────────────────────────────────────────────────
    const sunNakIdx = Math.floor((((sunLon % 360) + 360) % 360) / NAK_SPAN);
    const suryaNak = {
      index: sunNakIdx,
      name: table.nakshatras[sunNakIdx] ?? "",
      pada:
        Math.floor(
          ((((sunLon % 360) + 360) % 360) % NAK_SPAN) / (NAK_SPAN / 4),
        ) + 1,
      ends_at: null as string | null,
    };

    // Moon nakshatra padas
    const moonNakPadas = generateNakshatraPadas(
      winStart,
      winEnd,
      ephe,
      (i) => table.nakshatras[i] ?? "",
    );

    // ── Paksha ───────────────────────────────────────────────────────────────
    const tIdx = tithiIndex(sunLon, moonLon);
    const paksha = tIdx <= 15 ? "Shukla Paksha" : "Krishna Paksha";

    // ── Muhurta windows ───────────────────────────────────────────────────────
    const brahma = brahmaMuhurta(sunriseJd, nextSunriseJd, ephe);
    const pratah = pratahSandhya(sunriseJd, sunsetJd, nextSunriseJd, ephe);
    const abhijit = abhijitMuhurta(
      sunriseJd,
      sunsetJd,
      nextSunriseJd,
      weekday,
      ephe,
    );
    const vijay = vijayMuhurta(sunriseJd, sunsetJd, nextSunriseJd, ephe);
    const godhuli = godhuliMuhurta(sunsetJd, ephe);
    const sayahna = sayahnaSandhya(sunriseJd, sunsetJd, nextSunriseJd, ephe);
    const nishita = nishitaMuhurta(sunriseJd, sunsetJd, nextSunriseJd, ephe);

    // Varjyam + Amrit from current nakshatra
    const varjyamWins: import("../types").TimeWindow[] = [];
    const amritWins: import("../types").TimeWindow[] = [];
    for (const nak of nakSeq) {
      const w = varjyamWindow(
        nak.index,
        new Date(nak.starts_at ?? nak.ends_at).getTime() / 86400000 + 2440587.5,
        new Date(nak.ends_at).getTime() / 86400000 + 2440587.5,
        ephe,
      );
      if (w) varjyamWins.push(w);
      const a = amritKalamWindow(
        nak.index,
        new Date(nak.starts_at ?? nak.ends_at).getTime() / 86400000 + 2440587.5,
        new Date(nak.ends_at).getTime() / 86400000 + 2440587.5,
        ephe,
      );
      if (a) amritWins.push(a);
    }

    // Siddhi Yogas
    const curNakIdx = nakNow?.index ?? 0;
    const sarvarthaWins: import("../types").TimeWindow[] = [];
    const amritaSiddhiWins: import("../types").TimeWindow[] = [];
    const sv = sarvarthaSiddhiYoga(
      sunriseJd,
      sunsetJd,
      weekday,
      curNakIdx,
      ephe,
    );
    if (sv) sarvarthaWins.push(sv);
    const as = amritaSiddhiYoga(sunriseJd, sunsetJd, weekday, curNakIdx, ephe);
    if (as) amritaSiddhiWins.push(as);

    // Inauspicious timings
    const rahuWin = rahuKalam(sunriseJd, sunsetJd, weekday, ephe);
    const yamaWin = yamaganda(sunriseJd, sunsetJd, weekday, ephe);
    const gulikaWin = gulikaKalam(sunriseJd, sunsetJd, weekday, ephe);
    const durWins = durMuhurtam(
      sunriseJd,
      sunsetJd,
      nextSunriseJd,
      weekday,
      ephe,
    );
    const bhadraWins = bhadraWindows(karanaSeq);

    // Madhyahna (midday)
    const madhyahnaJd = sunriseJd + (sunsetJd - sunriseJd) / 2;

    // ── Udaya Lagna ───────────────────────────────────────────────────────────
    const udayaLagna = generateUdayaLagna(
      sunriseJd,
      nextSunriseJd,
      lat,
      lon,
      ephe,
      (id) => table.signs[id - 1] ?? "",
      (id) => table.rashis[id - 1] ?? "",
    );

    // ── Gowri + Hora + Nalla Neram ────────────────────────────────────────────
    const gowri = computeGowri(
      sunriseJd,
      sunsetJd,
      nextSunriseJd,
      weekday,
      ephe,
    );
    const hora = computeHora(sunriseJd, sunsetJd, nextSunriseJd, weekday, ephe);
    const inauspiciousWins = [
      ...(rahuWin ? [rahuWin] : []),
      ...(yamaWin ? [yamaWin] : []),
      ...(gulikaWin ? [gulikaWin] : []),
    ];
    const allHoras = [...hora.day, ...hora.night];
    const nallaNeramWins = computeNallaNeram(allHoras, inauspiciousWins);

    // ── Calendars ──────────────────────────────────────────────────────────────
    const calInfo = computeCalendars(
      jdNoon,
      sunLon,
      moonLon,
      tIdx,
      sunriseJd,
      ephe,
      table.samvatsaras,
    );

    // Sun sign start JD (last Mesha/current sign sankranti)
    const sunSignStartJd = findLastSankranti(jdNoon, sunSignId, ephe);

    // ── Tamil Calendar ────────────────────────────────────────────────────────
    let tamilCal: import("../types").TamilCalendar | null = null;
    try {
      tamilCal = computeTamilCalendar(
        jdNoon,
        sunSignId,
        sunSignStartJd,
        weekday,
        ephe,
        TAMIL_MONTHS_BY_SIGN,
        table.samvatsaras,
        table.samvatsaras,
      );
    } catch {
      /* non-critical */
    }

    // ── Tarabalam + Chandrabalam ───────────────────────────────────────────────
    // No birth data for panchang — default to Rohini (3) and Taurus (2)
    const tarabalam = computeTarabalam(3, (i) => table.nakshatras[i] ?? "");
    const chandrabalam = computeChandrabalam(2, (i) => table.rashis[i] ?? "");

    // ── Tyajyam ───────────────────────────────────────────────────────────────
    const jupiterPos = ephe.calcUt(jdNoon, SE.JUPITER, flags);
    const venusPos = ephe.calcUt(jdNoon, SE.VENUS, flags);
    const tyajyam = computeTyajyam({
      nakshatras: nakSeq,
      tithis: tithiSeq,
      karanas: karanaSeq,
      sunriseIso: sunriseIso ?? jdToIso(sunriseJd, ephe),
      sunsetIso: sunsetIso ?? jdToIso(sunsetJd, ephe),
      weekday,
      gowri,
      lagnas: udayaLagna,
      signNames: table.signs,
      jupiterLon: jupiterPos.lon,
      venusLon: venusPos.lon,
      venusRetro: venusPos.speed < 0,
      sunLon,
      eclipseWins: [],
      tamilMonthEn: tamilCal?.tamil_month.en ?? "",
    });

    // ── Ganda Mula + Ravi Yoga ────────────────────────────────────────────────
    const gandaMula = detectGandaMula(nakSeq);
    const raviYoga = detectRaviYoga(
      sunNakIdx,
      weekday,
      sunriseIso ?? jdToIso(sunriseJd, ephe),
      sunsetIso ?? jdToIso(sunsetJd, ephe),
    );

    // ── Shool / Vasa ──────────────────────────────────────────────────────────
    const moonSignId2 = moonSignNow?.index ?? 1;
    const shoolVasa = {
      disha_shool: DISHA_SHOOL[weekday] ?? "",
      rahu_vasa: RAHU_VASA[weekday] ?? "",
      chandra_vasa: CHANDRA_VASA[moonSignId2] ?? "",
    };

    // ── Assemble response ─────────────────────────────────────────────────────
    return {
      date: dateStr,
      location: { latitude: lat, longitude: lon, timezone },
      sun_moon: {
        sunrise: sunriseIso,
        sunset: sunsetIso,
        moonrise: moonriseIso,
        moonset: moonsetIso,
        next_sunrise: nextSunriseIso,
        dinaman_hours: dayInfo.dinamanHours,
        ratriman_hours: dayInfo.ratrimanHours,
        madhyahna: jdToIso(madhyahnaJd, ephe),
      },
      vara,
      panchang: {
        tithi: tithiNow,
        tithi_sequence: tithiSeq,
        nakshatra: nakNow,
        nakshatra_sequence: nakSeq,
        yoga: yogaNow,
        yoga_sequence: yogaSeq,
        karana: karanaNow,
        karana_sequence: karanaSeq,
        paksha,
      },
      rashi_nakshatra: {
        moonsign: moonSignNow,
        moonsign_sequence: moonSignSeq,
        sunsign,
        surya_nakshatra: suryaNak,
        moon_nakshatra_padas: moonNakPadas,
      },
      lunar_month: {
        samvatsara_shaka: calInfo.samvatsaraShaka,
        samvatsara_vikram: calInfo.samvatsaraVikram,
        vikram_samvat: calInfo.vikramSamvat,
        shaka_samvat: calInfo.shaka,
        gujarati_samvat: calInfo.gujaratiSamvat,
        chandramasa_amanta: calInfo.chandramasaAmanta,
        chandramasa_purnimanta: calInfo.chandramasaPurnimanta,
        paksha,
        pravishte_day: calInfo.pravishteDays,
        nirayana_solar_month: calInfo.niraayanaSolarMonth,
      },
      ritu_ayana: {
        drik_ritu: calInfo.drikRitu,
        drik_ayana: calInfo.drikAyana,
        vedic_ritu: calInfo.vedicRitu,
        vedic_ayana: calInfo.vedicAyana,
      },
      auspicious_timings: {
        brahma_muhurta: brahma,
        pratah_sandhya: pratah,
        abhijit: abhijit,
        vijay_muhurta: vijay,
        godhuli_muhurta: godhuli,
        sayahna_sandhya: sayahna,
        nishita_muhurta: nishita,
        amrit_kalam: amritWins,
        sarvartha_siddhi_yoga: sarvarthaWins,
        amrita_siddhi_yoga: amritaSiddhiWins,
      },
      inauspicious_timings: {
        rahu_kalam: rahuWin,
        yamaganda: yamaWin,
        gulika_kalam: gulikaWin,
        dur_muhurtam: durWins,
        bhadra: bhadraWins,
        varjyam: varjyamWins,
      },
      udaya_lagna: udayaLagna,
      chandrabalam,
      tarabalam,
      shool_vasa: shoolVasa,
      yogas_extra: {
        ganda_mula: gandaMula,
        ravi_yoga: raviYoga,
      },
      gowri_panchang: gowri,
      hora,
      tyajyam,
      nalla_neram: nallaNeramWins,
      tamil_calendar: tamilCal,
      calendars: {
        kali_year: calInfo.kaliYear,
        kali_ahargana_days: calInfo.kaliAhargana,
        julian_day: calInfo.julianDay,
        modified_julian_day: calInfo.modifiedJulianDay,
        rata_die: calInfo.rataDie,
        ayanamsha_lahiri: calInfo.ayanamshaLahiri,
        national_civil_date: {
          month: calInfo.nationalCivilDate.month,
          day: calInfo.nationalCivilDate.day,
          shaka_year: calInfo.shakaYear,
        },
        national_nirayana_date: {
          month: calInfo.nationalNirayanaDate.month,
          day: calInfo.nationalNirayanaDate.day,
          shaka_year: calInfo.shakaYear,
        },
      },
    };
  } catch (err) {
    if (err instanceof PanchangError) throw err;
    throw new PanchangError("CALCULATION_FAILED", String(err));
  }
}
