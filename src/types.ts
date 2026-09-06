// ─── Primitives ──────────────────────────────────────────────────────────────

export type Locale = "en" | "hi" | "ta";

export type Planet =
  | "Sun"
  | "Moon"
  | "Mars"
  | "Mercury"
  | "Jupiter"
  | "Venus"
  | "Saturn"
  | "Rahu"
  | "Ketu"
  | "Uranus"
  | "Neptune"
  | "Pluto";

export type AyanamsaId =
  "lahiri" | "kp_new" | "kp_old" | "raman" | "kp_khullar" | "sayan" | "manoj";

export type VargaNumber =
  1 | 2 | 3 | 4 | 7 | 9 | 10 | 11 | 12 | 16 | 20 | 24 | 27 | 30 | 40 | 45 | 60;

// ─── Named Entity ─────────────────────────────────────────────────────────────

export interface NamedEntity {
  id: number;
  name: string; // resolved in requested locale
}

// ─── Time Window ──────────────────────────────────────────────────────────────

export interface TimeWindow {
  start: string; // ISO-8601 datetime
  end: string;
}

// ─── Location & Birth Info ────────────────────────────────────────────────────

export interface GeoLocation {
  latitude: number;
  longitude: number;
  timezone?: string; // IANA timezone, e.g. "America/New_York"
}

export interface BirthInfo {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  latitude: number;
  longitude: number;
  timezone?: string;
  ayanamsa?: AyanamsaId; // default "lahiri"
}

// ─── Planet Position ──────────────────────────────────────────────────────────

export interface PlanetPosition {
  name: string; // "Sun", "Moon", ..., "Ascendant"
  abbr: string; // "Su", "Mo", "Ma", etc.
  longitude: number; // 0-360 (sidereal if applicable)
  sign_id: number; // 1-12 (Aries=1)
  sign: string; // locale-resolved
  sign_lord: string; // locale-resolved
  degree_in_sign: number; // 0-30
  dms: string; // "12° 34' 56\""
  nakshatra: string; // locale-resolved
  nakshatra_pada: number; // 1-4
  nakshatra_lord: string; // locale-resolved
  retrograde: boolean;
  combust: boolean;
  house: number; // 1-12 (whole sign)
  exalted: boolean;
  debilitated: boolean;
  own_sign: boolean;
  moolatrikona: boolean;
  vargottama: boolean;
  digbala: boolean;
  pushkara_bhaga: boolean;
  pushkara_navamsa: boolean;
  mrityu_bhaga: boolean;
  gandanta: boolean;
  neecha_bhanga: boolean;
  parivartana: boolean;
  parivartana_with: string | null;
  graha_yuddha: boolean;
  graha_yuddha_with: string | null;
}

// ─── Panchang Types ───────────────────────────────────────────────────────────

export interface PanchangItem {
  index: number;
  name: string; // locale-resolved
  starts_at?: string; // ISO datetime
  ends_at: string;
}

export interface Vara {
  index: number; // 1=Monday ... 7=Sunday
  sanskrit: string; // "Ravivara"
  english: string; // "Sunday"
}

export interface SunSign {
  index: number;
  sign: string; // "Aries"
  rashi: string; // locale-resolved: "मेष" / "மேஷம்"
  longitude: number;
}

export interface MoonSign {
  index: number; // 1-12
  name: string;
  rashi: string;
  ends_at: string;
}

export interface NakshatraPada {
  index: number;
  name: string;
  pada: number; // 1-4
  ends_at: string | null; // null only for surya_nakshatra
}

export interface Chandrabalam {
  good_rashis: Array<{ rashi: string; index: number }>;
}

export interface Tarabalam {
  good_nakshatras: Array<{ nakshatra: string; index: number }>;
}

// ─── Varga Chart ──────────────────────────────────────────────────────────────

export interface VargaChart {
  chart: Record<number, string[]>; // house => [planet abbreviations]
  asc_sign: number; // 1-12
  name: string; // "Navamsa"
  subtitle: string; // "Spouse / Dharma"
  division: number;
  planet_degrees: Record<string, number>; // abbr => deg within divisional sign
}

// ─── Dasha Types ──────────────────────────────────────────────────────────────

export interface Mahadasha {
  lord: string;
  start: string; // ISO datetime
  end: string;
  years: number;
  antardashas?: Antardasha[];
}

export interface Antardasha {
  lord: string;
  start: string;
  end: string;
  years: number;
  pratyantars?: Pratyantar[];
}

export interface Pratyantar {
  lord: string;
  start: string;
  end: string;
  years: number;
}

// ─── Jaimini ──────────────────────────────────────────────────────────────────

export interface Karaka {
  rank: number; // 1-7
  abbr: string; // "AK" through "DK"
  title: string; // "Atmakaraka" etc.
  planet: string; // planet long name
  planet_abbr: string; // "Ke"
  sign: string; // locale-resolved
  sign_id: number;
  degree_in_sign: number;
  dms: string;
}

// ─── Friendships ──────────────────────────────────────────────────────────────

export interface FriendshipTables {
  natural: Record<string, Record<string, string>>; // from → { to → "F"|"N"|"E" }
  temporal: Record<string, Record<string, string>>;
  composite: Record<string, Record<string, string>>; // "GF"|"F"|"N"|"E"|"GE"
}

// ─── Kalsarpa ─────────────────────────────────────────────────────────────────

export interface KalsarpaResult {
  present: boolean;
  verdict: string;
  kind: string | null;
  direction: string | null;
  rahu_house: number;
  ketu_house: number;
}

// ─── Ashtakavarga ─────────────────────────────────────────────────────────────

export interface AshtakavargaResult {
  bav: Record<string, number[]>; // planet name => [12 points per sign]
  sav: number[]; // total per sign (sum across 7 planets)
}

// ─── Aspects (Drishti) ────────────────────────────────────────────────────────

export interface AspectEdge {
  planet: string;
  planet_abbr: string;
  from_sign: number; // 1-12
  from_house: number; // 1-12
  to_sign: number;
  to_house: number;
  offset: number; // house offset 1-12
  aspect_type: "standard" | "special";
  strength: number; // 0-100
  benefic: boolean;
}

export interface AspectResult {
  aspects: AspectEdge[];
  by_planet: Record<
    string,
    {
      name: string;
      abbr: string;
      house: number;
      benefic: boolean;
      retrograde: boolean;
      combust: boolean;
      aspected_houses: number[];
      details: AspectEdge[];
    }
  >;
  mutual: Array<{ planet1: string; planet2: string }>;
}

// ─── Gowri Panchangam ────────────────────────────────────────────────────────

export interface GowriSegment {
  name: string; // "Soram" | "Uthi" | etc.
  auspicious: boolean;
  start: string; // ISO datetime
  end: string;
}

export interface GowriPanchanga {
  day: GowriSegment[]; // 8 segments
  night: GowriSegment[]; // 8 segments
}

// ─── Hora ─────────────────────────────────────────────────────────────────────

export interface HoraSegment {
  name: string; // planet name
  auspicious: boolean;
  start: string;
  end: string;
}

export interface Hora {
  day: HoraSegment[]; // 12 segments
  night: HoraSegment[]; // 12 segments
}

// ─── Tyajyam ──────────────────────────────────────────────────────────────────

export interface NakshatraTyajyamWindow extends TimeWindow {
  nakshatra: string;
}
export interface TithiTyajyamWindow extends TimeWindow {
  tithi: string;
}
export interface AmritadiYogamWindow extends TimeWindow {
  nakshatra: string;
  yogam: string;
}
export interface LagnaTyajyamWindow extends TimeWindow {
  sign: string;
  position: string;
}
export interface KaranaTyajyamWindow extends TimeWindow {
  karana: string;
}
export interface DoshaTyajyamWindow extends TimeWindow {
  dosha: string;
}
export interface GowriTyajyamWindow extends TimeWindow {
  name: string;
  period: string;
}
export interface TithiLagnaTyajyamWindow extends TimeWindow {
  tithi: string;
  sign: string;
}

export interface TamilMonthAvoidables {
  avoid_tithis: string[];
  avoid_nakshatras: string[];
  avoid_lagnas: string[];
  windows: Array<TimeWindow & { kind: string; name: string }>;
}

export interface Tyajyam {
  nakshatraTyajyam: NakshatraTyajyamWindow[];
  tithiTyajyam: TithiTyajyamWindow[];
  varaTyajyam: TimeWindow | null;
  amritadiYogam: AmritadiYogamWindow[];
  lagnaTyajyam: LagnaTyajyamWindow[];
  karanaTyajyam: KaranaTyajyamWindow[];
  gowriTyajyam: GowriTyajyamWindow[];
  doshaTyajyam: DoshaTyajyamWindow[];
  tithiLagnaTyajyam: TithiLagnaTyajyamWindow[];
  tamilMonthAvoidables: TamilMonthAvoidables | null;
}

// ─── Tamil Calendar ───────────────────────────────────────────────────────────

export interface TamilCalendar {
  week_day: { en: string; ta: string };
  tamil_date: string;
  tamil_month: {
    id: number; // solar sign id (1-12)
    en: string;
    ta: string;
    rashi: string;
  };
  tamil_year: {
    id: number; // samvatsara id (1-60)
    name_en: string;
    name_ta: string;
    gregorian_start_year: number;
  };
  month_start_iso: string;
  nokku_naal: string;
  kari_naal: boolean;
  thaniya_naal: boolean;
}

// ─── Locale Table ─────────────────────────────────────────────────────────────

export interface LocaleTable {
  code: string;
  label: string;
  nakshatras: string[];
  tithis: string[];
  rashis: string[];
  signs: string[];
  yogas: string[];
  movableKaranas: string[];
  signLords: string[];
  nakshatraLords: string[];
  varas: string[];
  varaEnglish: string[];
  samvatsaras: string[];
  chandraMasa: string[];
  vargaNames: Record<number, string>;
  vargaSubtitles: Record<number, string>;
  gowriNames: string[];
  karakaTitles: string[];
  kalsarpaTypes: string[];
  drikRitu: string[];
  vedicRitu: string[];
  directions: string[];
  nirayanaMonths: string[];
  shakaMonths: string[];
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface PanchangResponse {
  date: string; // YYYY-MM-DD
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  sun_moon: {
    sunrise: string | null;
    sunset: string | null;
    moonrise: string | null;
    moonset: string | null;
    next_sunrise: string | null;
    dinaman_hours: number | null;
    ratriman_hours: number | null;
    madhyahna: string | null;
  };
  vara: Vara;
  panchang: {
    tithi: PanchangItem | null;
    tithi_sequence: PanchangItem[];
    nakshatra: PanchangItem | null;
    nakshatra_sequence: PanchangItem[];
    yoga: PanchangItem | null;
    yoga_sequence: PanchangItem[];
    karana: PanchangItem | null;
    karana_sequence: PanchangItem[];
    paksha: string; // "Shukla Paksha" | "Krishna Paksha"
  };
  rashi_nakshatra: {
    moonsign: MoonSign | null;
    moonsign_sequence: MoonSign[];
    sunsign: SunSign;
    surya_nakshatra: NakshatraPada;
    moon_nakshatra_padas: NakshatraPada[];
  };
  lunar_month: {
    samvatsara_shaka: string;
    samvatsara_vikram: string;
    vikram_samvat: number;
    shaka_samvat: number;
    gujarati_samvat: number;
    chandramasa_amanta: string;
    chandramasa_purnimanta: string;
    paksha: string;
    pravishte_day: number;
    nirayana_solar_month: string;
  };
  ritu_ayana: {
    drik_ritu: string;
    drik_ayana: string;
    vedic_ritu: string;
    vedic_ayana: string;
  };
  auspicious_timings: {
    brahma_muhurta: TimeWindow | null;
    pratah_sandhya: TimeWindow | null;
    abhijit: TimeWindow | null;
    vijay_muhurta: TimeWindow | null;
    godhuli_muhurta: TimeWindow | null;
    sayahna_sandhya: TimeWindow | null;
    nishita_muhurta: TimeWindow | null;
    amrit_kalam: TimeWindow[];
    sarvartha_siddhi_yoga: TimeWindow[];
    amrita_siddhi_yoga: TimeWindow[];
  };
  inauspicious_timings: {
    rahu_kalam: TimeWindow | null;
    yamaganda: TimeWindow | null;
    gulika_kalam: TimeWindow | null;
    dur_muhurtam: TimeWindow[];
    bhadra: TimeWindow[];
    varjyam: TimeWindow[];
  };
  udaya_lagna: Array<{
    sign: string;
    rashi: string;
    start: string;
    end: string;
  }>;
  chandrabalam: Chandrabalam;
  tarabalam: Tarabalam;
  shool_vasa: {
    disha_shool: string;
    rahu_vasa: string;
    chandra_vasa: string;
  };
  yogas_extra: {
    ganda_mula: {
      nakshatra: string;
      ends_at: string;
    } | null;
    ravi_yoga: {
      start: string;
      end: string;
    } | null;
  };
  gowri_panchang: GowriPanchanga;
  hora: Hora;
  tyajyam: Tyajyam;
  nalla_neram: TimeWindow[];
  tamil_calendar: TamilCalendar | null;
  calendars: {
    kali_year: number;
    kali_ahargana_days: number;
    julian_day: number;
    modified_julian_day: number;
    rata_die: number;
    ayanamsha_lahiri: number;
    national_civil_date: {
      month: string;
      day: number;
      shaka_year: number;
    };
    national_nirayana_date: {
      month: string;
      day: number;
      shaka_year: number;
    };
  };
}

export interface ChartResponse {
  birth: {
    local_time: string;
    utc_time: string;
    timezone: string;
    latitude: number;
    longitude: number;
    julian_day: number;
    ayanamsa: number;
    ayanamsa_id: string;
    ayanamsa_label: string;
  };
  ascendant: PlanetPosition;
  planets_data: PlanetPosition[];
  d1_chart: VargaChart;
  d2_chart: VargaChart;
  d9_chart: VargaChart;
  d1_asc_sign: string;
  d2_asc_sign: string;
  d9_asc_sign: string;
  vargas: Record<string, VargaChart>;
  varga_order: VargaNumber[];
  dasha: Mahadasha[];
  dasha_antar: Mahadasha[];
  karakas: Karaka[];
  karakamsa: string;
  swamsa: string;
  friendships: FriendshipTables;
  kalsarpa: KalsarpaResult;
  ashtakavarga: AshtakavargaResult;
  drishti: AspectResult;
}

// ─── Error Classes ────────────────────────────────────────────────────────────

export class PanchangError extends Error {
  constructor(
    public code:
      | "INVALID_DATE"
      | "INVALID_LOCATION"
      | "CALCULATION_FAILED"
      | "EPHEMERIS_ERROR",
    detail: string,
  ) {
    super(detail);
    this.name = "PanchangError";
  }
}

export class ChartError extends Error {
  constructor(
    public code:
      "INVALID_BIRTH_INFO" | "CALCULATION_FAILED" | "EPHEMERIS_ERROR",
    detail: string,
  ) {
    super(detail);
    this.name = "ChartError";
  }
}
