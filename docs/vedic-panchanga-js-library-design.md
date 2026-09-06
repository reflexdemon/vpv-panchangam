# Vedic Panchanga JS Library — Design Specification

> **For AI agents.** This document defines the complete API surface, data types,
> algorithms, and module structure for a TypeScript library that ports the
> Vedic Panchanga backend (Python/FastAPI) to Node.js, using `swisseph` for
> astronomical calculations and pure TypeScript for everything else.

---

## 1. Identity

- **Package name**: `vedic-panchanga` (single npm package, Node.js only)
- **Language**: TypeScript (strict mode)
- **Astronomical dependency**: [`swisseph`](https://www.npmjs.com/package/swisseph) (native Node addon — synchronous C++)
- **Target**: Node.js 20+
- **Locales bundled**: `en`, `hi`, `ta` (default: `en`)
- **Testing**: Vitest (or similar), mirroring the ~309 pytest tests from the backend
- **Lint/format**: eslint + prettier, `npm run lint` / `npm run format`

---

## 2. Module Structure

```
vedic-panchanga/
├── src/
│   ├── index.ts                    # Barrel: exports public API, types, locales
│   │
│   ├── types.ts                    # All TypeScript interfaces
│   ├── types-constants.ts          # Internal numeric constants (enums for planet IDs, etc.)
│   │
│   ├── locales/                    # Locale data tables (bundled, not loaded at runtime)
│   │   ├── index.ts                # Locale resolver + Locale type export
│   │   ├── en.ts                   # English: tithi, nakshatra, yoga, karana, rashi, etc.
│   │   ├── hi.ts                   # Hindi (Devanagari script)
│   │   └── ta.ts                   # Tamil script
│   │
│   ├── constants/                  # Lookup tables (language-agnostic)
│   │   ├── panchang.ts             # Tithi/nakshatra/yoga/karana indices
│   │   ├── vargas.ts               # Varga definitions, D30 break tables
│   │   ├── planets.ts              # DASHA_SEQUENCE, DASHA_YEARS, BAV_RULES
│   │   ├── muhurta.ts              # Varjyam ghatikas, Dur muhurta, Siddhi yogas
│   │   ├── aspects.ts              # Special aspect tables
│   │   └── calendars.ts            # Samvatsara, Chandra masa, ritu, shool tables
│   │
│   ├── ephemeris/                  # Swiss Ephemeris adapter
│   │   ├── index.ts                # EphemerisService class (singleton)
│   │   └── types.ts                # Planet/flag enums matching swisseph constants
│   │
│   ├── calculations/               # Pure calculation logic (no IO, deterministic)
│   │   ├── bisection.ts            # findAngleTime() — the core search engine
│   │   ├── panchang.ts             # tithi/nakshatra/yoga/karana/moonsign sequences
│   │   ├── sunrise.ts              # Sunrise/sunset + 8-segment division
│   │   ├── muhurta.ts              # Brahma/Abhijit/Vijay/Godhuli/Nishita
│   │   ├── varjyam-amrit.ts        # Varjyam + Amrit Kalam
│   │   ├── siddhi-yogas.ts         # Sarvartha Siddhi + Amrita Siddhi
│   │   ├── tarabalam.ts            # Tarabalam (nakshatra-based)
│   │   ├── chandrabalam.ts         # Chandrabalam (moon sign based)
│   │   ├── vargas.ts               # All 17 divisional charts (D1–D60)
│   │   ├── dasha.ts                # Vimshottari Mahadasha + Antardasha + Pratyantar
│   │   ├── ashtakavarga.ts         # BAV + SAV
│   │   ├── placements.ts           # Exaltation/debilitation/own_sign/vargottama/etc.
│   │   ├── jaimini.ts              # Chara karakas + Karakamsa + Swamsa
│   │   ├── relationships.ts        # Natural/temporal/composite friendships
│   │   ├── aspects.ts              # Graha Drishti
│   │   ├── kalsarpa.ts             # Kalsarpa yoga
│   │   ├── gowri.ts                # Gowri Panchangam (8+8 segments)
│   │   ├── hora.ts                 # Planetary horas (12+12)
│   │   ├── nalla-neram.ts          # Nalla Neram (auspicious horas)
│   │   ├── tyajyam/               # Sub-module: 10 tyajyam types
│   │   │   ├── index.ts            # computeTyajyam() orchestration
│   │   │   ├── nakshatra.ts
│   │   │   ├── tithi.ts
│   │   │   ├── vara.ts
│   │   │   ├── amritadi.ts
│   │   │   ├── lagna.ts
│   │   │   ├── karana.ts
│   │   │   ├── gowri.ts
│   │   │   ├── dosha.ts            # Eclipse + combustion periods
│   │   │   ├── tithi-lagna.ts
│   │   │   └── tamil-month.ts
│   │   ├── calendars.ts            # Shaka/Vikram/Kali/Gujarati/National/Tamil
│   │   └── ganda-mula-ravi-yoga.ts # Ganda Mula + Ravi Yoga detectors
│   │
│   └── api/                        # Public API orchestration
│       ├── get-panchang.ts         # computeDetailedPanchang()
│       └── calculate.ts            # computeChart()
│
├── test/                           # Test suites (mirror backend test structure)
│   ├── panchang.test.ts
│   ├── vargas.test.ts
│   ├── dasha.test.ts
│   ├── ...
│   └── fixtures/                   # Reference data from backend tests
│
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## 3. Types (`src/types.ts`)

### 3.1 Primitives

```typescript
type Locale = 'en' | 'hi' | 'ta';

type Planet =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter'
  | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu'
  | 'Uranus' | 'Neptune' | 'Pluto';

type AyanamsaId =
  | 'lahiri' | 'kp_new' | 'kp_old' | 'raman'
  | 'kp_khullar' | 'sayan' | 'manoj';

type VargaNumber = 1 | 2 | 3 | 4 | 7 | 9 | 10 | 11 | 12 | 16 | 20 | 24 | 27 | 30 | 40 | 45 | 60;
```

### 3.2 Named Entity (locale-resolved)

```typescript
interface NamedEntity {
  id: number;
  name: string;     // resolved in requested locale
}
```

### 3.3 Time Window

```typescript
interface TimeWindow {
  start: string;    // ISO-8601 datetime
  end: string;
}
```

### 3.4 Location & Birth Info

```typescript
interface GeoLocation {
  latitude: number;
  longitude: number;
  timezone?: string;     // IANA timezone, e.g. "America/New_York"
}

interface BirthInfo {
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM (24h)
  latitude: number;
  longitude: number;
  timezone?: string;
  ayanamsa?: AyanamsaId; // default "lahiri"
}
```

### 3.5 Planet Position

```typescript
interface PlanetPosition {
  name: string;                              // "Sun", "Moon", ..., "Ascendant"
  abbr: string;                              // "Su", "Mo", "Ma", etc.
  longitude: number;                         // 0-360 (sidereal if applicable)
  sign_id: number;                           // 1-12 (Aries=1)
  sign: string;                              // locale-resolved
  sign_lord: string;                         // locale-resolved
  degree_in_sign: number;                    // 0-30
  dms: string;                               // "12° 34' 56\""
  nakshatra: string;                         // locale-resolved
  nakshatra_pada: number;                    // 1-4
  nakshatra_lord: string;                    // locale-resolved
  retrograde: boolean;
  combust: boolean;
  house: number;                             // 1-12 (whole sign)
  // Special placements (set by computeSpecialPlacements)
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
```

### 3.6 Panchang Types

```typescript
interface PanchangItem {
  index: number;
  name: string;                              // locale-resolved
  starts_at?: string;                        // ISO datetime
  ends_at: string;
}

interface Vara {
  index: number;                             // 1=Monday ... 7=Sunday
  sanskrit: string;                          // "Ravivara"
  english: string;                           // "Sunday"
}

interface SunSign {
  index: number;
  sign: string;                              // "Aries"
  rashi: string;                             // locale-resolved: "मेष" / "மேஷம்"
  longitude: number;
}

interface MoonSign {
  index: number;                             // 1-12
  name: string;
  rashi: string;
  ends_at: string;
}

interface NakshatraPada {
  index: number;
  name: string;
  pada: number;                              // 1-4
  ends_at: string | null;                    // null only for surya_nakshatra
}

interface Chandrabalam {
  good_rashis: Array<{ rashi: string; index: number }>;
}

interface Tarabalam {
  good_nakshatras: Array<{ nakshatra: string; index: number }>;
}
```

### 3.7 Varga Chart

```typescript
interface VargaChart {
  chart: Record<number, string[]>;           // house => [planet abbreviations]
  asc_sign: number;                          // 1-12
  name: string;                              // "Navamsa"
  subtitle: string;                          // "Spouse / Dharma"
  division: number;
  planet_degrees: Record<string, number>;    // abbr => deg within divisional sign
}
```

### 3.8 Dasha Types

```typescript
interface Mahadasha {
  lord: string;
  start: string;                             // ISO datetime
  end: string;
  years: number;
  antardashas?: Antardasha[];                // present on `dasha_antar` entries
}

interface Antardasha {
  lord: string;
  start: string;
  end: string;
  years: number;
  pratyantars?: Pratyantar[];
}

interface Pratyantar {
  lord: string;
  start: string;
  end: string;
  years: number;
}
```

### 3.9 Jaimini

```typescript
interface Karaka {
  rank: number;                              // 1-7
  abbr: string;                              // "AK" through "DK"
  title: string;                             // "Atmakaraka" etc.
  planet: string;                            // planet long name
  planet_abbr: string;                       // "Ke"
  sign: string;                              // locale-resolved
  sign_id: number;
  degree_in_sign: number;
  dms: string;
}
```

### 3.10 Friendships

```typescript
interface FriendshipTables {
  natural: Record<string, Record<string, string>>;    // from → { to → "F"|"N"|"E" }
  temporal: Record<string, Record<string, string>>;
  composite: Record<string, Record<string, string>>;   // "GF"|"F"|"N"|"E"|"GE"
}
```

### 3.11 Kalsarpa

```typescript
interface KalsarpaResult {
  present: boolean;
  verdict: string;                           // "Anant Kalsarpa Yoga is present" / "..."
  kind: string | null;                       // "Anant" ... "Sheshnag"
  direction: string | null;                  // "Forward (Rahu leading)" | "Reverse (Ketu leading)"
  rahu_house: number;
  ketu_house: number;
}
```

### 3.12 Ashtakavarga

```typescript
interface AshtakavargaResult {
  bav: Record<string, number[]>;             // planet name => [12 points per sign]
  sav: number[];                             // total per sign (sum across 7 planets)
}
```

### 3.13 Aspects (Drishti)

```typescript
interface AspectEdge {
  planet: string;
  planet_abbr: string;
  from_sign: number;                         // 1-12
  from_house: number;                        // 1-12
  to_sign: number;
  to_house: number;
  offset: number;                            // house offset 1-12
  aspect_type: 'standard' | 'special';
  strength: number;                          // 0-100
  benefic: boolean;
}

interface AspectResult {
  aspects: AspectEdge[];
  by_planet: Record<string, {
    name: string;
    abbr: string;
    house: number;
    benefic: boolean;
    retrograde: boolean;
    combust: boolean;
    aspected_houses: number[];
    details: AspectEdge[];
  }>;
  mutual: Array<{ planet1: string; planet2: string }>;
}
```

### 3.14 Gowri Panchangam

```typescript
interface GowriSegment {
  name: string;                              // "Soram" | "Uthi" | etc.
  auspicious: boolean;
  start: string;                             // ISO datetime
  end: string;
}

interface GowriPanchanga {
  day: GowriSegment[];                       // 8 segments
  night: GowriSegment[];                     // 8 segments
}
```

### 3.15 Hora

```typescript
interface HoraSegment {
  name: string;                              // planet name
  auspicious: boolean;
  start: string;
  end: string;
}

interface Hora {
  day: HoraSegment[];                        // 12 segments
  night: HoraSegment[];                      // 12 segments
}
```

### 3.16 Tyajyam

Mirrors `backend/advanced_panchang.py` (10 inauspicious-period types). All window
item shapes are `{ start, end }` plus a discriminator (shown inline below);
`tamilMonthAvoidables` returns null when the Tamil month has no avoidables.

```typescript
interface NakshatraTyajyamWindow extends TimeWindow { nakshatra: string; }
interface TithiTyajyamWindow extends TimeWindow { tithi: string; }
interface AmritadiYogamWindow extends TimeWindow { nakshatra: string; yogam: string; }
interface LagnaTyajyamWindow extends TimeWindow { sign: string; position: string; }
interface KaranaTyajyamWindow extends TimeWindow { karana: string; }
interface DoshaTyajyamWindow extends TimeWindow { dosha: string; }
interface GowriTyajyamWindow extends TimeWindow { name: string; period: string; }
interface TithiLagnaTyajyamWindow extends TimeWindow { tithi: string; sign: string; }

interface TamilMonthAvoidables {
  avoid_tithis: string[];
  avoid_nakshatras: string[];
  avoid_lagnas: string[];
  windows: Array<TimeWindow & { kind: string; name: string }>;
}

interface Tyajyam {
  nakshatraTyajyam: NakshatraTyajyamWindow[];
  tithiTyajyam: TithiTyajyamWindow[];
  varaTyajyam: TimeWindow | null;         // null when the whole day is tyajyam
  amritadiYogam: AmritadiYogamWindow[];
  lagnaTyajyam: LagnaTyajyamWindow[];
  karanaTyajyam: KaranaTyajyamWindow[];
  gowriTyajyam: GowriTyajyamWindow[];
  doshaTyajyam: DoshaTyajyamWindow[];
  tithiLagnaTyajyam: TithiLagnaTyajyamWindow[];
  tamilMonthAvoidables: TamilMonthAvoidables | null;
}
```

Backend source (snake_case) types, mirrored 1:1 in the wire format
(see §3.18): `nakshatra_tyajyam`, `tithi_tyajyam`, `vara_tyajyam`,
`amritadi_yogam`, `lagna_tyajyam`, `karana_tyajyam`, `gowri_tyajyam`,
`dosha_tyajyam`, `tithi_lagna_tyajyam`, `tamil_month_avoidables`.

### 3.17 Tamil Calendar

Mirrors `backend/tamil_calendar.py compute_tamil_calendar`; returns null when the
day is outside the supported Tamil-calendar range.

```typescript
interface TamilCalendar {
  week_day: { en: string; ta: string };
  tamil_date: string;
  tamil_month: {
    id: number;                           // solar sign id (1-12)
    en: string;                           // e.g. "Chithirai"
    ta: string;
    rashi: string;                        // e.g. "Mesha"
  };
  tamil_year: {
    id: number;                           // samvatsara id (1-60)
    name_en: string;
    name_ta: string;
    gregorian_start_year: number;
  };
  month_start_iso: string;
  nokku_naal: string;                     // Nokku karuvi name
  kari_naal: boolean;
  thaniya_naal: boolean;
}
```

### 3.18 Response Types

```typescript
interface PanchangResponse {
  date: string;                            // YYYY-MM-DD
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
    paksha: string;                        // "Shukla Paksha" | "Krishna Paksha"
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

interface ChartResponse {
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
  vargas: Record<`d${number}`, VargaChart>;
  varga_order: VargaNumber[];
  dasha: Mahadasha[];
  dasha_antar: Mahadasha[];
  karakas: Karaka[];
  karakamsa: string;                       // zodiac sign (legacy string)
  swamsa: string;                          // zodiac sign (legacy string)
  friendships: FriendshipTables;
  kalsarpa: KalsarpaResult;
  ashtakavarga: AshtakavargaResult;
  drishti: AspectResult;
}
```

---

## 4. Public API

### 4.1 computeDetailedPanchang

```typescript
/**
 * Compute the full Drik Panchang for a given date, location, and locale.
 *
 * @param date       Target date "YYYY-MM-DD" (default: today)
 * @param latitude   Geographic latitude
 * @param longitude  Geographic longitude
 * @param timezone   IANA timezone (auto-resolved if omitted)
 * @param locale     Response locale (default: "en")
 * @returns          Full PanchangResponse
 *
 * Throws on invalid parameters or calculation failure.
 *
 * The result shape matches the /api/get-panchang endpoint,
 * with all named entities resolved in the requested locale.
 */
function computeDetailedPanchang(
  date?: string,
  latitude: number,
  longitude: number,
  timezone?: string,
  locale?: Locale
): Promise<PanchangResponse>;
```

### 4.2 computeChart

```typescript
/**
 * Compute a full birth chart (Kundali) with all 17 divisional charts,
 * Vimshottari Dasha, Ashtakavarga, Jaimini Karakas, etc.
 *
 * @param birthInfo  Birth date, time, location, ayanamsa
 * @param locale     Response locale (default: "en")
 * @returns          Full ChartResponse
 *
 * Throws on invalid parameters or calculation failure.
 *
 * The result shape matches the /api/calculate endpoint.
 */
function computeChart(
  birthInfo: BirthInfo,
  locale?: Locale
): Promise<ChartResponse>;
```

---

## 5. Locale System (`src/locales/`)

### 5.1 Table structure

Each locale file exports the same shape:

```typescript
// src/locales/en.ts
const locale: LocaleTable = {
  code: 'en',
  label: 'English',
  // Astronomical names — 27 nakshatras
  nakshatras: [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
    "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
    "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra",
    "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
    "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
  ],
  // 30 tithi names (1-30)
  tithis: [
    "", "Pratipada", "Dwitiya", "Tritiya", "Chaturthi",
    "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami",
    "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
    "Purnima", "Pratipada", "Dwitiya", "Tritiya", "Chaturthi",
    "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami",
    "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Amavasya",
  ],
  // 12 rashi names
  rashis: [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
  ],
  // 12 signs (English)
  signs: [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ],
  // 27 yoga names
  yogas: [ /* ... 27 ... */ ],
  // 7 movable karana names
  movableKaranas: ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"],
  // 12 sign lords
  signLords: [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
  ],
  // 9 nakshatra lords (one per cycle of 9)
  nakshatraLords: ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"],
  // 7 weekdays
  varas: ["", "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara", "Ravivara"],
  varaEnglish: ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  // 60 samvatsaras
  samvatsaras: [ /* "Prabhava" ... "Akshaya" */ ],
  // 12 chandra masa
  chandraMasa: [ /* "Chaitra" ... "Phalguna" */ ],
  // Varga names (17 vargas incl. D11 Rudramsa; matches backend/vargas.py)
  vargaNames: {
    1: "Rashi", 2: "Hora", 3: "Drekkana", 4: "Chaturthamsa",
    7: "Saptamsa", 9: "Navamsa", 10: "Dashamsa", 11: "Rudramsa",
    12: "Dvadashamsa",
    16: "Shodashamsa", 20: "Vimshamsa", 24: "Chaturvimshamsa",
    27: "Nakshatramsa (Bhamsa)", 30: "Trimshamsa", 40: "Khavedamsa",
    45: "Akshavedamsa", 60: "Shashtyamsa",
  },
  vargaSubtitles: {
    1: "Physical Self / Body", 2: "Wealth", 3: "Siblings / Courage",
    4: "Fortunes / Home", 7: "Children",
    9: "Spouse / Dharma", 10: "Career / Achievement", 11: "Gains / Income",
    12: "Parents", 16: "Vehicles / Comforts",
    20: "Spiritual Progress", 24: "Education / Learning",
    27: "Strengths / Weaknesses", 30: "Misfortunes",
    40: "Maternal Legacy", 45: "Paternal Legacy",
    60: "Past-Life Karma",
  },
  // Gowri names
  gowriNames: ["Soram", "Uthi", "Visham", "Amridha", "Rogam", "Labam", "Dhanam", "Sugam"],
  // Jaimini karaka titles
  karakaTitles: ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"],
  // Kalsarpa types
  kalsarpaTypes: [
    "Anant", "Kulik", "Vasuki", "Shankhpal", "Padma", "Mahapadma",
    "Takshak", "Karkotak", "Shankhachood", "Ghatak", "Vishaktak", "Sheshnag",
  ],
  // Ritu names
  drikRitu: [ /* ... */ ],
  vedicRitu: [ /* ... */ ],
  // Direction names
  directions: ["East", "South-East", "South", "South-West", "West", "North-West", "North", "North-East"],
  // Month names
  nirayanaMonths: [ /* ... */ ],
  shakaMonths: [ /* ... */ ],
};

export default locale;
```

### 5.2 Resolver

```typescript
// src/locales/index.ts

type Locale = 'en' | 'hi' | 'ta';

interface LocaleTable { /* shape above */ }

const TABLES: Record<Locale, LocaleTable> = {
  en: require('./en').default,
  hi: require('./hi').default,
  ta: require('./ta').default,
};

function resolveName(id: number, tableKey: keyof LocaleTable, locale: Locale): string;
function resolveNamedEntity(id: number, tableKey: keyof LocaleTable, locale: Locale): NamedEntity;
```

---

## 6. Ephemeris Adapter (`src/ephemeris/`)

### 6.1 EphemerisService

```typescript
import swe from 'swisseph';

class EphemerisService {
  private static instance: EphemerisService;
  private initialized = false;

  private constructor() {}

  static getInstance(): EphemerisService;
  static destroy(): void;

  // Initialize with ephemeris data path
  init(ephePath?: string): void;

  // Swiss Ephemeris methods (all sync, wrapped for consistency)
  julday(year: number, month: number, day: number, hour: number): number;
  revjul(jd: number): [number, number, number, number];
  calcUt(jd: number, planet: number, flags?: number): { lon: number; lat: number; dist: number; speed: number };
  housesEx(jd: number, lat: number, lon: number, hsys?: string, flags?: number): { cusps: Float64Array; ascmc: Float64Array };
  riseTrans(jd: number, body: number, geopos: [number, number, number], which: number): number | null;
  getAyanamsaUt(jd: number): number;
  setSidMode(mode: number): void;
  solEclipseWhenGlob(jd: number, flags?: number): any;
  lunEclipseWhen(jd: number, flags?: number): any;
}
```

### 6.2 Planet/Flag Enums

```typescript
// These map 1:1 to swisseph C constants
enum PlanetId {
  SUN = 0,
  MOON = 1,
  MERCURY = 2,
  VENUS = 3,
  MARS = 4,
  JUPITER = 5,
  SATURN = 6,
  URANUS = 7,
  NEPTUNE = 8,
  PLUTO = 9,
  MEAN_NODE = 10,   // Rahu
}

enum Flag {
  SWIEPH = 2,
  SPEED = 256,
  SIDEREAL = 1024,
  MOSHIER = 64,
  JPLHOR = 8192,
}

enum SideralMode {
  LAHIRI = 1,
  RAMAN = 2,
  KRISHNAMURTI_VP291 = 3,
  TRUE_CITRA = 4,
  KRISHNAMURTI = 5,
  MANOJ = 28, // SIDM_LAHIRI_ICRC (verify value at implementation via npm)
}

import { AYANAMSA_MAP } from '../constants/planets';
// AYANAMSA_MAP: { lahiri, kp_new, kp_old, raman, kp_khullar, sayan, manoj }
//   labels match backend/ayanamsa.py AYANAMSA_OPTIONS:
//   lahiri: "N.C. Lahiri (Chitrapaksha)",
//   kp_new: "K.P. New (Krishnamurti VP291)",
//   kp_old: "K.P. Old (Krishnamurti)",
//   raman:  "B.V. Raman",
//   kp_khullar: "K.P. Khullar (True Chitrapaksha)",
//   sayan:  "Sayana (Tropical)",
//   manoj:  "Manoj (Lahiri ICRC)"
```

---

## 7. Core Algorithms

### 7.1 Bisection Search (`src/calculations/bisection.ts`)

The fundamental engine for all angular boundary searches.

```typescript
/**
 * Find the JD when angleFn(jd) crosses targetDeg within [lo, hi].
 * Uses binary search with ~40 iterations → 1e-8 JD ≈ 0.9ms precision.
 *
 * angleFn must return degrees modulo 360.
 *
 * @param lo         Lower bound JD
 * @param hi         Upper bound JD
 * @param targetDeg  Target angle (0-360)
 * @param angleFn    Function that returns the angle at any JD
 * @returns          JD of crossing, or null if no crossing
 */
function findAngleTime(
  lo: number, hi: number, targetDeg: number, angleFn: AngleFn
): number | null;
```

**Algorithm:**
1. `f_lo = angleFn(lo)`, `f_hi = angleFn(hi)`
2. If `f_lo == targetDeg` → return `lo`. If `f_hi == targetDeg` → return `hi`.
3. Normalize both to `[0, 360)`.
4. Determine net sign change after accounting for 360° wrap:
   - `wraps = Math.floor((f_lo + 360 - targetDeg) / 360)`
   - `expected_wraps = Math.floor((f_hi + 360 - targetDeg) / 360)`
5. If no crossing expected, return `null`.
6. Binary search for ~40 iterations:
   - `mid = (lo + hi) / 2`
   - `f_mid = angleFn(mid)`
   - Compare `(targetDeg - f_mid)` normalized to `[-180, 180]`
   - If diff > 0 → lo = mid; if < 0 → hi = mid
7. Return `(lo + hi) / 2`

**Angle functions used:**
- `tithi(jd) = (moonSid(jd) - sunSid(jd)) % 360` — tithi boundary at 0°, 12°, 24°, ...
- `moon(jd) = moonSid(jd) % 360` — nakshatra boundary at 0°, 13.333°, 26.666°, ...
- `sun(jd) = sunSid(jd) % 360` — sun ingress at 0°, 30°, 60°, ...
- `yoga(jd) = (sunSid(jd) + moonSid(jd)) % 360` — yoga boundary at 0°, 13.333°, ...

### 7.2 Sequence Generators

All follow the same pattern — given a window `[startJd, endJd]`, find all transitions within it:

```typescript
function generateTithis(startJd: number, endJd: number, ephemeris: EphemerisService): PanchangItem[];
function generateNakshatras(startJd: number, endJd: number, ephemeris: EphemerisService): PanchangItem[];
function generateYogas(startJd: number, endJd: number, ephemeris: EphemerisService): PanchangItem[];
function generateKaranas(startJd: number, endJd: number, ephemeris: EphemerisService): PanchangItem[];
function generateMoonSigns(startJd: number, endJd: number, ephemeris: EphemerisService): MoonSign[];
function generateNakshatraPadas(startJd: number, endJd: number, ephemeris: EphemerisService): NakshatraPada[];
function generateUdayaLagna(startJd: number, endJd: number, lat: number, lon: number, ephemeris: EphemerisService): TimeWindow[];
```

**Pattern:**
1. Compute current angle at `startJd`.
2. Determine current segment index (e.g., `tithiIndex = Math.floor(angle / 12)`).
3. Calculate next boundary: `nextTarget = (segmentIndex + 1) * segmentSpan`.
4. Call `findAngleTime(startJd, endJd, nextTarget, angleFn)`.
5. If found, record segment `[startJd, boundaryJd]`, set `startJd = boundaryJd`, repeat.
6. If not found, record final segment `[startJd, endJd]`.

### 7.3 Vargas (`src/calculations/vargas.ts`)

**Uniform vargas** (D3, D4, D12, D16, D20, D24, D27, D40, D45, D60):

```
degInSign = longitude % 30
part = Math.floor(degInSign / (30 / N))   // 0-indexed
startSign = computeStartSign(signId, N, part)
divisionalSign = ((startSign - 1 + part) % 12) + 1
```

**D7 + D10 special starts** (odd signs start from the same sign,
even signs from a fixed later sign — matches backend `_add_sign(sign, 6)` / 8):

```
D7:  startSign = odd ? signId : ((signId - 1 + 6) % 12) + 1
D10: startSign = odd ? signId : ((signId - 1 + 8) % 12) + 1
```

**D11 Rudramsa** (count the rasi anti-zodiacally from Aries incl., parts run forward):

```
startSign = ((1 - signId) % 12 + 12) % 12 + 1   // e.g. Gemini(3) → Aquarius(11)
```

**D9 shortcut:**
```
divisionalSign = Math.floor(((longitude * 9) % 360) / 30) + 1
```

**D2 Hora special:**
```
Odd signs (Ar,Ge,Le,Li,Sg,Aq): part 0 → Leo(5), part 1 → Cancer(4)
Even signs (Ta,Cn,Vi,Sc,Cp,Pi): part 0 → Cancer(4), part 1 → Leo(5)
```

**D30 uneven segments:**
```
ODD_BREAKS  = [0, 5, 10, 18, 25, 30]  → signs [1,11,9,3,7]
EVEN_BREAKS = [0, 5, 12, 20, 25, 30]  → signs [2,6,12,10,8]

For each part, find which break segment the degree falls in,
then map to the corresponding sign via a lookup.
```

### 7.4 Vimshottari Dasha (`src/calculations/dasha.ts`)

**Mahadasha:**
```
nakshatraSpan = 360 / 27 = 13.333...
nIdx = Math.floor(moonLongitude / nakshatraSpan)
degInNak = moonLongitude - nIdx * nakshatraSpan
fractionElapsed = degInNak / nakshatraSpan

firstLord = NAKSHATRA_LORDS[nIdx % 9]
balanceYears = DASHA_YEARS[firstLord] * (1 - fractionElapsed)

// Year addition: 1 year = 365.25 days
birthUtc + balanceYears * 365.25 days = first end
```

**Antardasha:**
```
adYears = mdYears * DASHA_YEARS[adLord] / 120

Repeats for all 9 lords in DASHA_SEQUENCE cycle,
starting from the mahadasha lord's position.
```

**Pratyantar** follows same formula: `pdYears = adYears * DASHA_YEARS[pdLord] / 120`.

### 7.5 Tarabalam

```
offset = (currentNakIdx - birthNakIdx + 27) % 27   // 0-26
starNumber = offset + 1                              // 1-27
positionIn9Cycle = (starNumber - 1) % 9 + 1          // 1-9
good = positionIn9Cycle in {1, 2, 4, 6, 8, 9}
```

### 7.6 Chandrabalam

```
offset = (currentSignId - birthSignId + 12) % 12    // 0-11
good = offset in {0, 2, 5, 6, 9, 10}
```

### 7.7 Gowri Panchangam

Divide day (sunrise → sunset) into 8 equal segments, night (sunset → next sunrise) into 8. Walk `GOWRI_NAMES` cyclically starting from a weekday-dependent index.

```
GOWRI_NAMES = ["Soram", "Uthi", "Visham", "Amridha", "Rogam", "Labam", "Dhanam", "Sugam"]
AUSPICIOUS = {Amridha, Sugam, Labam, Dhanam, Uthi}

# First-segment index per ISO weekday (1=Mon..7=Sun); matches backend/gowri_panchang.py
GOWRI_DAY_START = {
  1: 3,  // Monday  → Amridha
  2: 4,  // Tuesday → Rogam
  3: 5,  // Wednesday → Labam
  4: 7,  // Thursday  → Sugam
  5: 2,  // Friday  → Visham
  6: 0,  // Saturday → Soram
  7: 1,  // Sunday  → Uthi
}
# Night starts 5 segments after the day start (the "5th-from-lord" rule)
GOWRI_NIGHT_START = { k: (dayStart[k] + 5) % 8 }
```

### 7.8 Hora

Same 12 hours day + 12 hours night, planetary cycle from `HORA_CYCLE`.

```
HORA_CYCLE = [Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars]
# First day-hora index per ISO weekday (day-lord = first hora); matches backend/hora.py
HORA_DAY_START = { 1: 3, 2: 6, 3: 2, 4: 5, 5: 1, 6: 4, 7: 0 }
# Night's first hora continues the same 7-planet cycle 12 positions on:
NIGHT_START = (dayStart + 12) % 7
AUSPICIOUS_HORAS = {Jupiter, Venus, Mercury, Moon}
```

### 7.9 Nalla Neram

Auspicious horas minus Rahu Kalam / Yamaganda / Gulika Kalam windows. Intersection subtraction.

### 7.10 Ashtakavarga

For each of 7 planets (Sun..Saturn), for each of 8 contributors (Sun..Saturn + Asc):
- `BAV_RULES[planet][contributor]` is an array of house numbers (1-12).
- For each `house`: `targetSign = (contributorSign - 1 + house - 1) % 12`, add +1 point.
- BAV = [12 points per sign], SAV = element-wise sum across 7 planets.

### 7.11 Aspects (Drishti)

```
OFFSET_7TH = 7  // all planets aspect the 7th house

// Special aspects per planet:
Mars   → also houses 4, 8
Jupiter → also houses 5, 9
Saturn → also houses 3, 10
Rahu   → also houses 5, 9
Ketu   → also houses 5, 9
```

Strength is scored 0-100 based on angular closeness to the exact aspect point (sign midpoint).

### 7.12 Jaimini Karakas

Sort 7 visible planets (Sun..Saturn) by `degreeInSign` descending.
- Position 1 (highest degree) = Atmakaraka (AK)
- Position 7 (lowest degree) = Darakaraka (DK)

### 7.13 Kalsarpa

```
rahuLon, ketuLon = positions
arcRK = (ketuLon - rahuLon + 360) % 360   // forward arc Rahu→Ketu
arcKR = (rahuLon - ketuLon + 360) % 360   // forward arc Ketu→Rahu

allOnArc = all 7 visible planets' longitudes lie on arc
if allOnArc(arcRK): present, forward, kind = KALSARPA_TYPES[(rahu_house-1)%12]
if allOnArc(arcKR): present, reverse, kind = same
```

### 7.14 Tyajyam

**Nakshatra Tyajyam:** `offset = (nakshatraSpan * num / denom)`. Start at `nakshatraStart + offset`, lasts 96 minutes.

**Tithi Tyajyam:** Same pattern, 96 min, offset from tithi start via ratio table.

**Vara Tyajyam:** `start = sunrise + nazhigai * 24 min` (nazhigai from `VARA_TYAJYAM_NAZHIGAI`), lasts 90 min.

**Lagna Tyajyam:** 10% defective portion of each lagna transit — beginning, middle, or end based on `_LAGNA_DEFECT_POSITION` per sign.

**Karana Tyajyam:** Full spans of Vishti, Chatushpada, Naga karanas (the inauspicious karanas).

**Gowri Tyajyam:** `{Soram, Visham, Rogam}` Gowri segments (the inauspicious ones).

**Tithi-Lagna Tyajyam:** Tyajyam windows of the Tithi-Lagna rising sign within the day.

**Tamil-Month Avoidables:** Per-Tamil-month lists of avoidable tithis / nakshatras / lagnas plus named windows; null when the current Tamil month has none.

**Amritadi Yogam:** Lookup `_AMRITADI_TABLE[nakIdx][weekday-1]` → Amrita/Siddha/Marana/Prabalarishta classification.

**Dosha Tyajyam:** Eclipse periods from `swe.sol_eclipse_when_glob` / `swe.lun_eclipse_when`, clipped to local day. Plus Guru/Shukra asthamanam (within combustion orb of Sun: 11° Jupiter, 10° Venus direct, 8° Venus retro).

---

## 8. Implementation Notes

### 8.1 No sidereal context manager needed

Node.js is single-threaded. `swisseph`'s C state (`swe_set_sid_mode`) is accessed from one thread. Set it once during init and it stays. No `RLock` equivalent needed.

### 8.2 Ephemeris path

The `swisseph` npm package bundles ephemeris data (sepl_18, semo_18, seas_18) in `node_modules/swisseph/ephe/`. The `EphemerisService.init()` method should locate this path automatically or accept a custom path.

### 8.3 Combustion rule

```
_COMBUST_ORB = 5.0  // degrees
_COMBUST_PLANETS = {Moon, Mars, Mercury, Jupiter, Venus, Saturn}

Planet is combust if |lon - sunLon| <= 5° (adjusted for 360° wrap).
Sun, Rahu, Ketu are never combust.
```

### 8.4 Whole sign houses

```
house = ((signId - ascSign + 12) % 12) + 1
```

### 8.5 Sankranti (sun ingress) detection

Used for Nirayana solar month detection. Find the JD when tropical/sidereal sun crosses a sign boundary (0°, 30°, 60°, ...) via bisection.

### 8.6 Date/time math

All date arithmetic uses native JavaScript `Date` and `Intl.DateTimeFormat` for timezone handling. Julian Day ↔ Date conversion uses swisseph.

For daylight saving: the `timezone` parameter must be an IANA timezone name (e.g., `"America/New_York"`). The library uses `Intl.DateTimeFormat` with `timeZone` option to handle DST transitions correctly. No external `tzdata` dependency needed in Node.js 20+.

**Timezone auto-resolution:** Unlike the Python backend (which uses `timezonefinder`), this JS library has no built-in coordinate→timezone lookup. The `timezone` parameter is optional — if omitted, the library defaults to `"UTC"`. Users who need auto-resolution should either:
- Pass the IANA timezone explicitly (client-side knowledge), or
- Provide a `timezone` string using a lightweight coordinate lookup library like `geo-tz`.

---

## 9. Error Handling

- All public functions throw typed errors: `PanchangError`, `ChartError`, `EphemerisError`.
- Errors carry a `code` string and `detail` message.
- Validation errors (missing/invalid params) throw immediately.
- Ephemeris errors (missing data files, calculation failures) wrap the underlying error.

```typescript
class PanchangError extends Error {
  constructor(
    code: 'INVALID_DATE' | 'INVALID_LOCATION' | 'CALCULATION_FAILED' | 'EPHEMERIS_ERROR',
    detail: string
  );
}

class ChartError extends Error {
  constructor(
    code: 'INVALID_BIRTH_INFO' | 'CALCULATION_FAILED' | 'EPHEMERIS_ERROR',
    detail: string
  );
}
```

---

## 10. Testing Strategy

### 10.1 Reference Data

Use the same reference dates as the backend test suite:
- Kelowna (latitude=49.886, longitude=-119.496): 2018-06-01 through 2018-06-10
- Ujjain (latitude=23.1765, longitude=75.7885): Various dates
- Alpharetta, US (latitude=34.07538, longitude=-84.29409): 2026-07-04

### 10.2 Test categories

| Suite | Tests | Description |
|-------|-------|-------------|
| `panchang.test.ts` | ~80 | Tithi/nakshatra/yoga/karana for reference dates, sunrise/sunset within tolerance |
| `vargas.test.ts` | ~65 | All 17 vargas (incl. D11) for sample planets, D30/D7/D10/D11 special rules, D9 navamsa formula |
| `dasha.test.ts` | ~30 | Mahadasha sequence, antardasha proportions, boundary conditions |
| `ashtakavarga.test.ts` | ~20 | BAV point counts match reference |
| `placements.test.ts` | ~30 | Exaltation/debilitation/own_sign/vargottama/gandanta/graha yuddha |
| `jaimini.test.ts` | ~15 | Karaka ranking, karakamsa structure |
| `relationships.test.ts` | ~20 | Natural/temporal/composite matrices |
| `aspects.test.ts` | ~15 | Standard + special aspects, strength scoring |
| `kalsarpa.test.ts` | ~10 | Detection, type naming, forward/reverse |
| `tyajyam.test.ts` | ~35 | All 10 tyajyam types (nakshatra/tithi/vara/amritadi/lagna/karana/gowri/dosha/tithi-lagna/tamil-month) durations |
| `gowri.test.ts` | ~10 | Segment counts, auspicious labels |
| `hora.test.ts` | ~10 | Cycle sequence, segment counts |
| `calendars.test.ts` | ~15 | Shaka/Vikram/Kali year calculations |
| **Total** | **~350** | Target: match or exceed the backend's ~309 pytest tests |

### 10.3 Tolerance

- Planetary longitudes: ±0.0001° (vs swisseph Python)
- Sunrise/sunset: ±60 seconds (refraction/atmospheric differences may exist between swisseph C implementations)
- Dasha dates: ±1 day (year length convention: 365.25 days/year)

---

## 11. Dependency Summary

| Dependency | Version | Purpose |
|------------|---------|---------|
| `swisseph` | ^2.x | Swiss Ephemeris (planetary positions, houses, rise/set) |
| (none) | - | All other calculations implemented in pure TypeScript |

**Zero runtime dependencies beyond `swisseph`.** Dev dependencies: TypeScript, Vitest, eslint, prettier.

---

## 12. File Size Estimates

| Directory | Files | Est. LOC | Notes |
|-----------|-------|----------|-------|
| `src/types.ts` | 1 | ~300 | Interface definitions |
| `src/locales/` | 3 | ~900 | 3 × ~300 lines of data |
| `src/constants/` | 6 | ~800 | Lookup tables |
| `src/ephemeris/` | 2 | ~150 | Adapter wrapper |
| `src/calculations/bisection.ts` | 1 | ~80 | Core search engine |
| `src/calculations/panchang.ts` | 1 | ~500 | Tithi/nak/yoga/karana generators |
| `src/calculations/sunrise.ts` | 1 | ~60 | Rise/set coordinates |
| `src/calculations/muhurta.ts` | 1 | ~150 | Auspicious timings |
| `src/calculations/varjyam-amrit.ts` | 1 | ~80 | Varjyam + Amrit |
| `src/calculations/siddhi-yogas.ts` | 1 | ~60 | Siddhi yoga detection |
| `src/calculations/tarabalam.ts` | 1 | ~30 | Tarabalam |
| `src/calculations/chandrabalam.ts` | 1 | ~20 | Chandrabalam |
| `src/calculations/vargas.ts` | 1 | ~250 | D1-D60 |
| `src/calculations/dasha.ts` | 1 | ~120 | Mahadasha + Antardasha |
| `src/calculations/ashtakavarga.ts` | 1 | ~100 | BAV + SAV |
| `src/calculations/placements.ts` | 1 | ~250 | Special placements |
| `src/calculations/jaimini.ts` | 1 | ~80 | Chara karakas |
| `src/calculations/relationships.ts` | 1 | ~150 | Friendship tables |
| `src/calculations/aspects.ts` | 1 | ~120 | Drishti |
| `src/calculations/kalsarpa.ts` | 1 | ~50 | Kalsarpa |
| `src/calculations/gowri.ts` | 1 | ~100 | Gowri Panchangam |
| `src/calculations/hora.ts` | 1 | ~100 | Planetary horas |
| `src/calculations/nalla-neram.ts` | 1 | ~50 | Nalla Neram |
| `src/calculations/tyajyam/` | 10 | ~600 | All tyajyam types |
| `src/calculations/calendars.ts` | 1 | ~200 | Calendar conversions |
| `src/calculations/ganda-mula-ravi-yoga.ts` | 1 | ~40 | Ganda Mula + Ravi Yoga |
| `src/api/` | 2 | ~300 | Public API orchestration |
| **Subtotal** | **~42** | **~4,900** | Core library |
| `test/` | ~15 | ~3,000 | Test suites |
| **Total** | **~57** | **~7,900** | |

---

*This spec defines the complete TypeScript library design. It targets AI agents to produce a working implementation.*
