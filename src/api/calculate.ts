/**
 * computeChart() — full Kundali (birth chart) calculator.
 */

import type {
  Locale,
  BirthInfo,
  ChartResponse,
  PlanetPosition,
  VargaNumber,
} from "../types";
import { ChartError } from "../types";
import { EphemerisService, SE } from "../ephemeris";
import { getLocaleTable } from "../locales";
import { AYANAMSA_MAP, PLANET_ORDER } from "../constants/planets";
import { VARGA_ORDER } from "../constants/vargas";
import {
  signIdFromLon,
  degreeInSign,
  formatDms,
  nakshatraIndex,
  nakshatraPada,
  jdToIso,
} from "../calculations/panchang";
import { vargaSign, buildVargaCharts } from "../calculations/vargas";
import {
  computeMahadashas,
  enrichWithAntardashas,
} from "../calculations/dasha";
import { computeAshtakavarga } from "../calculations/ashtakavarga";
import { applySpecialPlacements } from "../calculations/placements";
import { computeKarakas, computeKarakamsa } from "../calculations/jaimini";
import { computeFriendships } from "../calculations/relationships";
import { computeAspects } from "../calculations/aspects";
import { computeKalsarpa } from "../calculations/kalsarpa";
import { NAK_SPAN } from "../constants/panchang";

// ─── Date/time helpers ────────────────────────────────────────────────────────

function parseLocalTime(date: string, time: string, timezone: string): Date {
  // Parse "YYYY-MM-DD" + "HH:MM" in the given IANA timezone
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mn] = time.split(":").map(Number);

  // Build a UTC timestamp by finding the offset at this local time
  const isoLocal = `${date}T${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}:00`;
  const utc = localToUtc(isoLocal, timezone);
  return utc;
}

function localToUtc(isoLocal: string, tz: string): Date {
  // Trick: use Intl to format a UTC guess in the target TZ, then find the offset
  const candidate = new Date(isoLocal + "Z");
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(candidate);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const tzY = get("year");
  const tzMo = get("month");
  const tzD = get("day");
  const tzH = get("hour") === 24 ? 0 : get("hour");
  const tzMn = get("minute");
  const tzS = get("second");
  const tzUtc = Date.UTC(tzY, tzMo - 1, tzD, tzH, tzMn, tzS);
  const offset = candidate.getTime() - tzUtc;
  return new Date(new Date(isoLocal + "Z").getTime() + offset);
}

function utcToJd(utcDate: Date, ephe: EphemerisService): number {
  const y = utcDate.getUTCFullYear();
  const mo = utcDate.getUTCMonth() + 1;
  const d = utcDate.getUTCDate();
  const h =
    utcDate.getUTCHours() +
    utcDate.getUTCMinutes() / 60 +
    utcDate.getUTCSeconds() / 3600 +
    utcDate.getUTCMilliseconds() / 3600000;
  return ephe.julday(y, mo, d, h);
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function computeChart(
  birthInfo: BirthInfo,
  locale: Locale = "en",
): Promise<ChartResponse> {
  const ephe = EphemerisService.getInstance();
  if (!ephe.initialized) {
    try {
      await ephe.init();
    } catch (err) {
      throw new ChartError(
        "EPHEMERIS_ERROR",
        `Ephemeris initialization failed: ${String(err)}`,
      );
    }
  }

  if (!birthInfo.date || !birthInfo.time) {
    throw new ChartError("INVALID_BIRTH_INFO", "date and time are required");
  }
  if (birthInfo.latitude < -90 || birthInfo.latitude > 90) {
    throw new ChartError("INVALID_BIRTH_INFO", "Invalid latitude");
  }

  const tz = birthInfo.timezone ?? "UTC";
  const ayanamsa = birthInfo.ayanamsa ?? "lahiri";

  try {
    const table = getLocaleTable(locale);
    ephe.setAyanamsa(ayanamsa);
    const sidFlag = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;

    // ── JD calculation ────────────────────────────────────────────────────────
    const birthUtc = parseLocalTime(birthInfo.date, birthInfo.time, tz);
    const jd = utcToJd(birthUtc, ephe);

    // ── Ayanamsa ──────────────────────────────────────────────────────────────
    const ayanamsaValue = ephe.getAyanamsaUt(jd);
    const ayanamsaLabel = AYANAMSA_MAP[ayanamsa]?.label ?? "";

    // ── Ascendant (Lagna) ─────────────────────────────────────────────────────
    const housesResult = ephe.housesEx(
      jd,
      birthInfo.latitude,
      birthInfo.longitude,
    );
    const ascLon = housesResult.ascendant;

    // ── Planet positions ──────────────────────────────────────────────────────
    const SE_IDS: Record<string, number> = {
      Sun: SE.SUN,
      Moon: SE.MOON,
      Mars: SE.MARS,
      Mercury: SE.MERCURY,
      Jupiter: SE.JUPITER,
      Venus: SE.VENUS,
      Saturn: SE.SATURN,
      Uranus: SE.URANUS,
      Neptune: SE.NEPTUNE,
      Pluto: SE.PLUTO,
      Rahu: SE.MEAN_NODE,
    };

    const sunCalc = ephe.calcUt(jd, SE.SUN, sidFlag);
    const ascSignId = signIdFromLon(ascLon);

    const planets: PlanetPosition[] = [];
    const planetLongitudes: Record<string, number> = {};
    const planetSigns: Record<string, number> = {};

    for (const { name, abbr } of PLANET_ORDER) {
      let lon: number;
      let speed: number;

      if (name === "Ketu") {
        // Ketu = Rahu + 180°
        const rahLon = planetLongitudes["Rahu"] ?? 0;
        lon = (rahLon + 180) % 360;
        speed = 0;
      } else {
        const seId = SE_IDS[name];
        if (seId == null) continue;
        const calc = ephe.calcUt(jd, seId, sidFlag);
        lon = ((calc.lon % 360) + 360) % 360;
        speed = calc.speed;
      }

      const signId = signIdFromLon(lon);
      const degSign = degreeInSign(lon);
      const nakIdx = Math.floor((((lon % 360) + 360) % 360) / NAK_SPAN);
      const nakPada = nakshatraPada(lon);
      const house = ((signId - ascSignId + 12) % 12) + 1;
      const retrograde = speed < 0;

      const pos: PlanetPosition = {
        name,
        abbr,
        longitude: lon,
        sign_id: signId,
        sign: table.signs[signId - 1] ?? "",
        sign_lord: table.signLords[signId - 1] ?? "",
        degree_in_sign: degSign,
        dms: formatDms(degSign),
        nakshatra: table.nakshatras[nakIdx] ?? "",
        nakshatra_pada: nakPada,
        nakshatra_lord: table.nakshatraLords[nakIdx % 9] ?? "",
        retrograde,
        combust: false,
        house,
        exalted: false,
        debilitated: false,
        own_sign: false,
        moolatrikona: false,
        vargottama: false,
        digbala: false,
        pushkara_bhaga: false,
        pushkara_navamsa: false,
        mrityu_bhaga: false,
        gandanta: false,
        neecha_bhanga: false,
        parivartana: false,
        parivartana_with: null,
        graha_yuddha: false,
        graha_yuddha_with: null,
      };

      planets.push(pos);
      planetLongitudes[abbr] = lon;
      planetLongitudes[name] = lon;
      planetSigns[abbr] = signId;
      planetSigns[name] = signId;
    }

    // Ascendant as a pseudo-planet position
    const ascSignDeg = degreeInSign(ascLon);
    const ascNakIdx = Math.floor((((ascLon % 360) + 360) % 360) / NAK_SPAN);
    const ascPos: PlanetPosition = {
      name: "Ascendant",
      abbr: "As",
      longitude: ((ascLon % 360) + 360) % 360,
      sign_id: ascSignId,
      sign: table.signs[ascSignId - 1] ?? "",
      sign_lord: table.signLords[ascSignId - 1] ?? "",
      degree_in_sign: ascSignDeg,
      dms: formatDms(ascSignDeg),
      nakshatra: table.nakshatras[ascNakIdx] ?? "",
      nakshatra_pada: nakshatraPada(ascLon),
      nakshatra_lord: table.nakshatraLords[ascNakIdx % 9] ?? "",
      retrograde: false,
      combust: false,
      house: 1,
      exalted: false,
      debilitated: false,
      own_sign: false,
      moolatrikona: false,
      vargottama: false,
      digbala: false,
      pushkara_bhaga: false,
      pushkara_navamsa: false,
      mrityu_bhaga: false,
      gandanta: false,
      neecha_bhanga: false,
      parivartana: false,
      parivartana_with: null,
      graha_yuddha: false,
      graha_yuddha_with: null,
    };

    // Apply special placements
    applySpecialPlacements(planets, ascSignId, sunCalc.lon);

    // ── Varga charts ──────────────────────────────────────────────────────────
    const vargas = buildVargaCharts(
      planetLongitudes,
      ascLon,
      table.vargaNames,
      table.vargaSubtitles,
    );

    // ── Dasha ─────────────────────────────────────────────────────────────────
    const moonLon = planetLongitudes["Mo"] ?? 0;
    const dashas = computeMahadashas(moonLon, birthUtc);
    const dashaAntar = enrichWithAntardashas(dashas);

    // ── Ashtakavarga ──────────────────────────────────────────────────────────
    const ashtakavarga = computeAshtakavarga(planetSigns, ascSignId);

    // ── Karakas ───────────────────────────────────────────────────────────────
    const karakas = computeKarakas(planets, (id) => table.signs[id - 1] ?? "");
    const ak = karakas[0];
    const d9 = vargas["d9"];
    const { karakamsa, swamsa } =
      ak && d9
        ? computeKarakamsa(
            ak,
            d9.chart,
            d9.asc_sign,
            (id) => table.signs[id - 1] ?? "",
          )
        : { karakamsa: "", swamsa: "" };

    // ── Friendships ───────────────────────────────────────────────────────────
    const friendships = computeFriendships(planetSigns);

    // ── Aspects ───────────────────────────────────────────────────────────────
    const drishti = computeAspects(
      planets.map((p) => ({
        name: p.name,
        abbr: p.abbr,
        house: p.house,
        sign_id: p.sign_id,
        retrograde: p.retrograde,
        combust: p.combust,
      })),
    );

    // ── Kalsarpa ──────────────────────────────────────────────────────────────
    const rahuHouse = planets.find((p) => p.name === "Rahu")?.house ?? 1;
    const ketuHouse = planets.find((p) => p.name === "Ketu")?.house ?? 7;
    const kalsarpa = computeKalsarpa(planetLongitudes, rahuHouse, ketuHouse);

    // ── Build response ────────────────────────────────────────────────────────
    const d1 = vargas["d1"]!;
    const d2 = vargas["d2"]!;
    const d9c = vargas["d9"]!;

    return {
      birth: {
        local_time: birthInfo.date + "T" + birthInfo.time,
        utc_time: birthUtc.toISOString(),
        timezone: tz,
        latitude: birthInfo.latitude,
        longitude: birthInfo.longitude,
        julian_day: jd,
        ayanamsa: ayanamsaValue,
        ayanamsa_id: ayanamsa,
        ayanamsa_label: ayanamsaLabel,
      },
      ascendant: ascPos,
      planets_data: planets,
      d1_chart: d1,
      d2_chart: d2,
      d9_chart: d9c,
      d1_asc_sign: table.signs[d1.asc_sign - 1] ?? "",
      d2_asc_sign: table.signs[d2.asc_sign - 1] ?? "",
      d9_asc_sign: table.signs[d9c.asc_sign - 1] ?? "",
      vargas,
      varga_order: VARGA_ORDER as unknown as VargaNumber[],
      dasha: dashas,
      dasha_antar: dashaAntar,
      karakas,
      karakamsa,
      swamsa,
      friendships,
      kalsarpa,
      ashtakavarga,
      drishti,
    };
  } catch (err) {
    if (err instanceof ChartError) throw err;
    throw new ChartError("CALCULATION_FAILED", String(err));
  }
}
