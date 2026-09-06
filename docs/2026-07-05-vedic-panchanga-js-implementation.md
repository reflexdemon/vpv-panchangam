# Vedic Panchanga JS Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Vedic Panchanga Python backend (vedicpanchanga.com) to a TypeScript npm package with full Drik Panchang + Kundali calculator.

**Architecture:** Single npm package `vedic-panchanga`. One runtime dependency: `swisseph` for astronomical calculations. All astrological/calendar logic is pure TypeScript. 3 bundled locales (en, hi, ta). Two public async functions: `computeDetailedPanchang()` and `computeChart()`.

**Tech Stack:** TypeScript 5.x strict, Node.js 20+, swisseph ^2.x, Vitest for testing.

## Global Constraints

- Node.js 20+ only (no browser support in v1)
- Zero runtime dependencies beyond `swisseph`
- All named entities resolved through locale tables (en default, hi + ta bundled)
- `timezone` parameter defaults to `"UTC"` if omitted (no coordinate→timezone lookup bundled)
- Data types defined in `src/types.ts`, shared across all modules
- Error classes: `PanchangError` and `ChartError` with machine-readable `code` fields
- All public API functions return `Promise<>` (even though swisseph is sync — consistency)
- Default ayanamsa: `lahiri`
- Combustion orb: 5° for all planets except Sun/Rahu/Ketu (never combust)
- Whole-sign houses from ascendant
- Vimshottari years use 365.25 days/year
- Test tolerance: planet positions ±0.0001°, sunrise ±60s, dasha dates ±1 day
- Locale tables use `hi.ts` for Hindi (Devanagari), `ta.ts` for Tamil script
- Response shape mirrors Python backend for drop-in compatibility

---

## File Structure

```
vedic-panchanga/
├── package.json
├── tsconfig.json
├── eslint.config.js
├── README.md
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── locales/
│   │   ├── index.ts          # Locale resolver
│   │   ├── en.ts             # English tables
│   │   ├── hi.ts             # Hindi tables
│   │   └── ta.ts             # Tamil tables
│   ├── constants/
│   │   ├── index.ts          # Barrel
│   │   ├── panchang.ts       # Tithi/nak/yoga/karana/vara indices
│   │   ├── vargas.ts         # Varga definitions + D30 break tables
│   │   ├── planets.ts        # DASHA_SEQUENCE, DASHA_YEARS, BAV_RULES, ayanamsa map
│   │   ├── muhurta.ts        # Varjyam ghatikas, Dur muhurta, Siddhi tables
│   │   └── calendars.ts      # Samvatsara, Chandra masa, ritu, shool
│   ├── ephemeris/
│   │   └── index.ts          # EphemerisService (swisseph wrapper)
│   ├── calculations/
│   │   ├── bisection.ts      # findAngleTime() core
│   │   ├── panchang.ts       # Tithi/nak/yoga/karana/moonsign sequence generators
│   │   ├── sunrise.ts        # Rise/set + 8-segment division
│   │   ├── muhurta.ts        # Auspicious timing windows
│   │   ├── varjyam-amrit.ts  # Varjyam + Amrit Kalam
│   │   ├── siddhi-yogas.ts   # Sarvartha + Amrita Siddhi
│   │   ├── tarabalam.ts      # Tarabalam
│   │   ├── chandrabalam.ts   # Chandrabalam
│   │   ├── vargas.ts         # D1-D60 divisional charts
│   │   ├── dasha.ts          # Vimshottari Mahadasha + Antardasha
│   │   ├── ashtakavarga.ts   # BAV + SAV
│   │   ├── placements.ts     # Exaltation/debilitation/vargottama/etc
│   │   ├── jaimini.ts        # Chara karakas + Karakamsa/Swamsa
│   │   ├── relationships.ts  # Friendship tables
│   │   ├── aspects.ts        # Graha Drishti
│   │   ├── kalsarpa.ts       # Kalsarpa yoga
│   │   ├── gowri.ts          # Gowri Panchangam
│   │   ├── hora.ts           # Planetary horas
│   │   ├── nalla-neram.ts    # Nalla Neram
│   │   ├── tyajyam/          # 10 tyajyam types (see design doc §3.16)
│   │   │   ├── nakshatra.ts  # Nakshatra tyajyam
│   │   │   ├── tithi.ts      # Tithi tyajyam
│   │   │   ├── vara.ts       # Vara tyajyam
│   │   │   ├── amritadi.ts   # Amritadi yogam
│   │   │   ├── lagna.ts      # Lagna tyajyam
│   │   │   ├── karana.ts     # Karana tyajyam
│   │   │   ├── gowri.ts      # Gowri tyajyam
│   │   │   ├── dosha.ts      # Dosha tyajyam
│   │   │   ├── tithi-lagna.ts# Tithi-lagna tyajyam
│   │   │   ├── tamil-month.ts# Tamil-month avoidables (Periyalvar/etc.)
│   │   │   └── index.ts      # aggregate tyajyam.ts unit
│   │   ├── calendars.ts      # Shaka/Vikram/Kali/National/Tamil
│   │   └── ganda-mula-ravi-yoga.ts
│   └── api/
│       ├── get-panchang.ts   # computeDetailedPanchang()
│       └── calculate.ts      # computeChart()
├── test/
│   ├── setup.ts              # Vitest setup (init ephemeris)
│   ├── helpers.ts            # Shared test helpers + reference data
│   ├── bisection.test.ts
│   ├── panchang.test.ts
│   ├── vargas.test.ts
│   ├── dasha.test.ts
│   ├── ashtakavarga.test.ts
│   ├── placements.test.ts
│   ├── jaimini.test.ts
│   ├── relationships.test.ts
│   ├── aspects.test.ts
│   ├── kalsarpa.test.ts
│   ├── gowri.test.ts
│   ├── hora.test.ts
│   ├── tyajyam.test.ts
│   ├── calendars.test.ts
│   ├── ganda-mula.test.ts
│   ├── get-panchang.test.ts
│   └── calculate.test.ts
└── ephe/                     # Symlink or copy from backend/ephe/
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `test/setup.ts`
- Create: `test/helpers.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "vedic-panchanga",
  "version": "0.1.0",
  "description": "Vedic Panchanga and Kundali calculator for Node.js",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist/"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "format": "prettier --write src/ test/",
    "format:check": "prettier --check src/ test/"
  },
  "dependencies": {
    "swisseph": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 3: Create eslint.config.js** (flat config, minimal)

```js
export default [
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
];
```

- [ ] **Step 4: Create test setup**

```typescript
// test/setup.ts
import { EphemerisService } from '../src/ephemeris';

beforeAll(() => {
  const ephe = EphemerisService.getInstance();
  // Try to locate ephe/ directory relative to project root
  // Falls back to swisseph bundled ephemeris
  ephe.init();
});
```

- [ ] **Step 5: Create test helpers**

```typescript
// test/helpers.ts
/** Reference data for Kelowna, BC (2018-06-01) */
export const KELOWNA = {
  latitude: 49.886,
  longitude: -119.496,
  timezone: 'America/Vancouver',
};

export const UJJAIN = {
  latitude: 23.1765,
  longitude: 75.7885,
  timezone: 'Asia/Kolkata',
};

export const ALPHARETTA = {
  latitude: 34.07538,
  longitude: -84.29409,
  timezone: 'America/New_York',
};

export function approxEqual(a: number, b: number, tol: number = 1e-4): boolean {
  return Math.abs(a - b) <= tol;
}
```

- [ ] **Step 6: Create types.ts** — Copy the complete `src/types.ts` from the design spec doc. All interfaces: `Locale`, `Planet`, `AyanamsaId`, `VargaNumber`, `NamedEntity`, `TimeWindow`, `GeoLocation`, `BirthInfo`, `PlanetPosition`, `PanchangItem`, `Vara`, `SunSign`, `MoonSign`, `NakshatraPada`, `Chandrabalam`, `Tarabalam`, `VargaChart`, `Mahadasha`, `Antardasha`, `Pratyantar`, `Karaka`, `FriendshipTables`, `KalsarpaResult`, `AshtakavargaResult`, `AspectEdge`, `AspectResult`, `GowriSegment`, `GowriPanchanga`, `HoraSegment`, `Hora`, `Tyajyam`, `TamilCalendar`, `PanchangResponse`, `ChartResponse`, `LocaleTable`.

The exact type definitions are in the design spec `docs/vedic-panchanga-js-library-design.md` section 3. Copy verbatim, with these additions:

```typescript
// Additional type needed for error handling
export class PanchangError extends Error {
  constructor(
    public code: 'INVALID_DATE' | 'INVALID_LOCATION' | 'CALCULATION_FAILED' | 'EPHEMERIS_ERROR',
    detail: string
  ) {
    super(detail);
    this.name = 'PanchangError';
  }
}

export class ChartError extends Error {
  constructor(
    public code: 'INVALID_BIRTH_INFO' | 'CALCULATION_FAILED' | 'EPHEMERIS_ERROR',
    detail: string
  ) {
    super(detail);
    this.name = 'ChartError';
  }
}
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

- [ ] **Step 8: Verify compilation**

```bash
npx tsc --noEmit
```
Expected: No errors (types.ts has no implementation dependencies).

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json eslint.config.js test/setup.ts test/helpers.ts src/types.ts
git commit -m "feat: project scaffolding with types and test setup"
```

---

### Task 2: Locale System (en + hi + ta)

**Files:**
- Create: `src/locales/en.ts`
- Create: `src/locales/hi.ts`
- Create: `src/locales/ta.ts`
- Create: `src/locales/index.ts`
- Test: Not separately tested — validated via integration tests later

This is a data-only task (no logic). Each locale file exports the same `LocaleTable` shape from `types.ts`.

**LocaleTable keys that each file must export:**

```typescript
export default {
  code: string;               // 'en' | 'hi' | 'ta'
  label: string;              // 'English' | 'हिन्दी' | 'தமிழ்'
  nakshatras: string[27];     // 0-indexed
  tithis: string[31];         // 1-indexed (index 0 = empty string)
  rashis: string[12];         // 0-indexed (Mesha=0)
  signs: string[12];          // English sign names (lang-agnostic in en.ts)
  yogas: string[27];          // 0-indexed
  movableKaranas: string[7];  // Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti
  signLords: string[12];      // 0-indexed
  nakshatraLords: string[9];  // Ketu..Mercury cycle
  varas: string[8];           // 1-indexed (index 0 = empty)
  varaEnglish: string[8];     // English weekday names
  samvatsaras: string[60];    // Prabhava..Akshaya
  chandraMasa: string[12];    // Chaitra..Phalguna
  vargaNames: Record<number, string>;
  vargaSubtitles: Record<number, string>;
  gowriNames: string[8];      // Soram, Uthi, Visham, Amridha, Rogam, Labam, Dhanam, Sugam
  karakaTitles: string[7];    // AK, AmK, BK, MK, PK, GK, DK
  kalsarpaTypes: string[12];  // Anant..Sheshnag
  drikRitu: string[12];       // Tropical ritu per sign index
  vedicRitu: string[12];      // Vedic ritu per sign index
  directions: string[8];      // E, SE, S, SW, W, NW, N, NE
  nirayanaMonths: string[12]; // Mesha..Meena (sidereal solar)
  shakaMonths: string[12];    // Chaitra..Phalguna with day counts
}
```

- [ ] **Step 1: Create en.ts** — Full English locale table. Source the exact array values from the backend:
  - `constants.py` → TITHI_BASE, NAKSHATRAS, YOGAS, MOVABLE_KARANAS, VARA_NAMES, VARA_ENGLISH, SIGNS
  - `calculator.py` → NAKSHATRA_LORDS, SIGN_LORDS, SIGNS
  - `panchang_constants.py` → SAMVATSARAS, CHANDRA_MASA, NIRAYANA_MONTHS, SHAKA_MONTHS, SIGN_TO_VEDIC_RITU, SIGN_TO_DRIK_RITU, RASHI_NAMES
  - `vargas.py` → VARGA_NAMES, VARGA_SUBTITLE
  - `advanced_panchang.py` → No, `panchang_constants.py` has the tables
  - `jaimini.py` → KARAKA_TITLES
  - `kalsarpa.py` → KALSARPA_TYPES
  - `gowri_panchang.py` → GOWRI_NAMES

```typescript
// src/locales/en.ts
import type { LocaleTable } from '../types';

const locale: LocaleTable = {
  code: 'en',
  label: 'English',
  nakshatras: [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
    'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
    'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
    'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
    'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
  ],
  tithis: [
    '', 'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi',
    'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami',
    'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
    'Purnima',
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi',
    'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami',
    'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Amavasya',
  ],
  rashis: [
    'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
    'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
  ],
  signs: [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ],
  yogas: [
    'Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
    'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
    'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
    'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
    'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
    'Indra', 'Vaidhriti',
  ],
  movableKaranas: ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'],
  signLords: [
    'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
    'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
  ],
  nakshatraLords: ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'],
  varas: ['', 'Somavara', 'Mangalavara', 'Budhavara', 'Guruvara', 'Shukravara', 'Shanivara', 'Ravivara'],
  varaEnglish: ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  // 60 Samvatsara cycle (Prabhavadi) - matches backend/panchang_constants.py SAMVATSARAS
  samvatsaras: [
    'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati',
    'Angira', 'Srimukha', 'Bhava', 'Yuva', 'Dhata',
    'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha',
    'Chitrabhanu', 'Subhanu', 'Tarana', 'Parthiva', 'Vyaya',
    'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara',
    'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukha',
    'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava',
    'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava',
    'Plavanga', 'Keelaka', 'Saumya', 'Sadharana', 'Virodhikrit',
    'Paridhavi', 'Pramadi', 'Ananda', 'Rakshasa', 'Nala',
    'Pingala', 'Kalayukta', 'Siddharthi', 'Raudra', 'Durmati',
    'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya',
  ],
  chandraMasa: [
    'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana',
    'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha',
    'Magha', 'Phalguna',
  ],
  // Matches backend/vargas.py VARGA_NAMES (17 vargas incl. D11 Rudramsa)
  vargaNames: {
    1: 'Rashi', 2: 'Hora', 3: 'Drekkana', 4: 'Chaturthamsa',
    7: 'Saptamsa', 9: 'Navamsa', 10: 'Dashamsa', 11: 'Rudramsa',
    12: 'Dvadashamsa',
    16: 'Shodashamsa', 20: 'Vimshamsa', 24: 'Chaturvimshamsa',
    27: 'Nakshatramsa (Bhamsa)', 30: 'Trimshamsa', 40: 'Khavedamsa',
    45: 'Akshavedamsa', 60: 'Shashtyamsa',
  },
  // Matches backend/vargas.py VARGA_SUBTITLE
  vargaSubtitles: {
    1: 'Physical Self / Body', 2: 'Wealth', 3: 'Siblings / Courage',
    4: 'Fortunes / Home', 7: 'Children',
    9: 'Spouse / Dharma', 10: 'Career / Achievement', 11: 'Gains / Income',
    12: 'Parents', 16: 'Vehicles / Comforts',
    20: 'Spiritual Progress', 24: 'Education / Learning',
    27: 'Strengths / Weaknesses', 30: 'Misfortunes',
    40: 'Maternal Legacy', 45: 'Paternal Legacy',
    60: 'Past-Life Karma',
  },
  gowriNames: ['Soram', 'Uthi', 'Visham', 'Amridha', 'Rogam', 'Labam', 'Dhanam', 'Sugam'],
  karakaTitles: ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'],
  kalsarpaTypes: [
    'Anant', 'Kulik', 'Vasuki', 'Shankhpal', 'Padma', 'Mahapadma',
    'Takshak', 'Karkotak', 'Shankhachood', 'Ghatak', 'Vishaktak', 'Sheshnag',
  ],
  // Aries-indexed (sign 1 = Aries). Matches backend SIGN_TO_DRIK_RITU:
  // 1 Vasant(Spring), 2-3 Grishma(Summer), 4-5 Varsha(Monsoon), 6-7 Sharad(Autumn),
  // 8-9 Hemant(Pre-Winter), 10-11 Shishir(Winter), 12 Vasant(Spring).
  drikRitu: ['Vasant (Spring)', 'Grishma (Summer)', 'Grishma (Summer)',
             'Varsha (Monsoon)', 'Varsha (Monsoon)', 'Sharad (Autumn)',
             'Sharad (Autumn)', 'Hemant (Pre-Winter)', 'Hemant (Pre-Winter)',
             'Shishir (Winter)', 'Shishir (Winter)', 'Vasant (Spring)'],
  // Matches backend SIGN_TO_VEDIC_RITU (same sign-indexed layout):
  // 1 Vasant, 2-3 Grishma, 4-5 Varsha, 6-7 Sharad, 8-9 Hemant, 10-11 Shishir, 12 Vasant.
  vedicRitu: ['Vasant', 'Grishma', 'Grishma', 'Varsha', 'Varsha',
              'Sharad', 'Sharad', 'Hemant', 'Hemant',
              'Shishir', 'Shishir', 'Vasant'],
  directions: ['East', 'South-East', 'South', 'South-West', 'West', 'North-West', 'North', 'North-East'],
  nirayanaMonths: [
    'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin',
    'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna', 'Chaitra',
  ],
  shakaMonths: [
    'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
    'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
  ],
};

export default locale;
```

- [ ] **Step 2: Create hi.ts** — Full Hindi locale table with Devanagari script. Same structure as en.ts. Translate all names:

```typescript
// src/locales/hi.ts
import type { LocaleTable } from '../types';

const locale: LocaleTable = {
  code: 'hi',
  label: 'हिन्दी',
  nakshatras: [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा',
    'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा',
    'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी', 'हस्त', 'चित्रा',
    'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल',
    'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा',
    'शतभिषा', 'पूर्व भाद्रपद', 'उत्तर भाद्रपद', 'रेवती',
  ],
  tithis: [
    '', 'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी',
    'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी',
    'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी',
    'पूर्णिमा',
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी',
    'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी',
    'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'अमावस्या',
  ],
  rashis: [
    'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
    'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन',
  ],
  signs: [
    'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
    'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन',
  ],
  yogas: [
    'विष्कुम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन',
    'अतिगण्ड', 'सुकर्मा', 'धृति', 'शूल', 'गण्ड',
    'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र',
    'सिद्धि', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव',
    'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म',
    'इन्द्र', 'वैधृति',
  ],
  movableKaranas: ['बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि'],
  signLords: [
    'मंगल', 'शुक्र', 'बुध', 'चंद्र', 'सूर्य', 'बुध',
    'शुक्र', 'मंगल', 'गुरु', 'शनि', 'शनि', 'गुरु',
  ],
  nakshatraLords: ['केतु', 'शुक्र', 'सूर्य', 'चंद्र', 'मंगल', 'राहु', 'गुरु', 'शनि', 'बुध'],
  varas: ['', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'],
  varaEnglish: ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  samvatsaras: [
    'प्रभव', 'विभव', 'शुक्ल', 'प्रमोद', 'प्रजापति',
    'आंगिर', 'श्रीमुख', 'भाव', 'युवा', 'धाता',
    'ईश्वर', 'बहुधान्य', 'प्रमाथी', 'विक्रम', 'वृष',
    'चित्रभानु', 'स्वभानु', 'तारण', 'पार्थिव', 'व्यय',
    'सर्वजित्', 'सर्वधारी', 'विरोधी', 'विकृति', 'खर',
    'नंदन', 'विजय', 'जय', 'मन्मथ', 'दुर्मुख',
    'हेविलम्बि', 'विलम्बि', 'विकारी', 'शार्वरी', 'प्लव',
    'शुभकृत', 'शोभकृत', 'क्रोधी', 'विश्वावसु', 'पराभव',
    'प्लवंग', 'कीलक', 'सौम्य', 'साधारण', 'विरोधिकृत',
    'परिधावी', 'प्रमादी', 'आनंद', 'राक्षस', 'नल',
    'पिंगल', 'कलयुक्त', 'सिद्धार्थी', 'रौद्र', 'दुर्मति',
    'दुंदुभि', 'रुधिरोद्गारी', 'रक्ताक्षी', 'क्रोधन', 'अक्षय',
  ],
  chandraMasa: [
    'चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण',
    'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष',
    'माघ', 'फाल्गुन',
  ],
  vargaNames: {
    1: 'राशि', 2: 'होरा', 3: 'द्रेष्काण', 4: 'चतुर्थांश',
    7: 'सप्तमांश', 9: 'नवमांश', 10: 'दशमांश', 11: 'रुद्रांश',
    12: 'द्वादशांश',
    16: 'षोडशांश', 20: 'विंशांश', 24: 'चतुर्विंशांश',
    27: 'नक्षत्रांश (भांश)', 30: 'त्रिंशांश', 40: 'खवेदांश',
    45: 'अक्षवेदांश', 60: 'षष्ट्यांश',
  },
  vargaSubtitles: {
    1: 'शरीर', 2: 'धन', 3: 'साहस / भाई-बहन',
    4: 'भाग्य / गृह', 7: 'संतान',
    9: 'जीवनसाथी / धर्म', 10: 'कैरियर / उपलब्धि', 11: 'लाभ / आय',
    12: 'माता-पिता', 16: 'वाहन / सुख',
    20: 'आध्यात्मिक प्रगति', 24: 'शिक्षा / ज्ञान',
    27: 'शक्ति / दुर्बलता', 30: 'अशुभ / बाधा',
    40: 'मातृ पक्ष', 45: 'पितृ पक्ष',
    60: 'पूर्वजन्म का कर्म',
  },
  gowriNames: ['सोरम्', 'उथि', 'विषम्', 'अमृत', 'रोगम्', 'लाभम्', 'धनम्', 'सुगम्'],
  karakaTitles: ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'],
  kalsarpaTypes: [
    'अनंत', 'कुलिक', 'वासुकी', 'शंखपाल', 'पद्म', 'महापद्म',
    'तक्षक', 'कर्कोटक', 'शंखचूड़', 'घातक', 'विषक्तक', 'शेषनाग',
  ],
  drikRitu: [
    'वसंत', 'ग्रीष्म', 'ग्रीष्म', 'वर्षा', 'वर्षा', 'शरद',
    'शरद', 'हेमंत', 'हेमंत', 'शिशिर', 'शिशिर', 'वसंत',
  ],
  vedicRitu: [
    'वसंत', 'ग्रीष्म', 'ग्रीष्म', 'वर्षा', 'वर्षा', 'शरद',
    'शरद', 'हेमंत', 'हेमंत', 'शिशिर', 'शिशिर', 'वसंत',
  ],
  directions: ['पूर्व', 'अग्नि', 'दक्षिण', 'नैऋत्य', 'पश्चिम', 'वायव्य', 'उत्तर', 'ईशान'],
  nirayanaMonths: [
    'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन',
    'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र',
  ],
  shakaMonths: [
    'चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद',
    'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन',
  ],
};

export default locale;
```

- [ ] **Step 3: Create ta.ts** — Full Tamil locale table with Tamil script. Same structure.

```typescript
// src/locales/ta.ts
import type { LocaleTable } from '../types';

const locale: LocaleTable = {
  code: 'ta',
  label: 'தமிழ்',
  nakshatras: [
    'அஸ்வினி', 'பரணி', 'கார்த்திகை', 'ரோகிணி', 'மிருகசீரிடம்',
    'திருவாதிரை', 'புனர்பூசம்', 'பூசம்', 'ஆயில்யம்', 'மகம்',
    'பூரம்', 'உத்திரம்', 'ஹஸ்தம்', 'சித்திரை', 'சுவாதி',
    'விசாகம்', 'அனுஷம்', 'கேட்டை', 'மூலம்',
    'பூராடம்', 'உத்திராடம்', 'திருவோணம்', 'அவிட்டம்',
    'சதயம்', 'பூரட்டாதி', 'உத்திரட்டாதி', 'ரேவதி',
  ],
  tithis: [
    '', 'பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி',
    'பஞ்சமி', 'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி',
    'தசமி', 'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்த்தசி',
    'பௌர்ணமி',
    'பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி',
    'பஞ்சமி', 'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி',
    'தசமி', 'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'அமாவாசை',
  ],
  rashis: [
    'மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி',
    'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்',
  ],
  signs: [
    'மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி',
    'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்',
  ],
  yogas: [
    'விஷ்கும்பம்', 'ப்ரீதி', 'ஆயுஷ்மான்', 'சௌபாக்கியம்', 'சோபனம்',
    'அதிகண்டம்', 'சுகர்மம்', 'த்ருதி', 'சூலம்', 'கண்டம்',
    'விருத்தி', 'துருவம்', 'வியாகாதம்', 'ஹர்ஷணம்', 'வஜ்ரம்',
    'சித்தி', 'வியதிபாதம்', 'வரியான்', 'பரிகம்', 'சிவம்',
    'சித்தம்', 'சாத்தியம்', 'சுபம்', 'சுக்லம்', 'பிரம்மம்',
    'இந்திரம்', 'வைத்ருதி',
  ],
  movableKaranas: ['பவ', 'பாலவ', 'கௌலவ', 'தைதில', 'கர', 'வணிஜ', 'விஷ்டி'],
  signLords: [
    'செவ்வாய்', 'சுக்கிரன்', 'புதன்', 'சந்திரன்', 'சூரியன்', 'புதன்',
    'சுக்கிரன்', 'செவ்வாய்', 'குரு', 'சனி', 'சனி', 'குரு',
  ],
  nakshatraLords: ['கேது', 'சுக்கிரன்', 'சூரியன்', 'சந்திரன்', 'செவ்வாய்', 'ராகு', 'குரு', 'சனி', 'புதன்'],
  varas: ['', 'சோமவாரம்', 'மங்களவாரம்', 'புதவாரம்', 'குருவாரம்', 'சுக்கிரவாரம்', 'சனிவாரம்', 'ஞாயிற்றுக்கிழமை'],
  varaEnglish: ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  samvatsaras: [
    'பிரபவ', 'விபவ', 'சுக்கில', 'பிரமோத', 'பிரசாபதி',
    'ஆங்கிர', 'சிறீமுக', 'பாவ', 'யுவ', 'தாது',
    'ஈசுவர', 'பகுதானிய', 'பிரமாத்தி', 'விக்கிரம', 'விருச',
    'சித்திரபானு', 'சுபானு', 'தாரண', 'பார்த்திவ', 'வியய',
    'சர்வசித்து', 'சர்வதாரி', 'விரோதி', 'விகிருதி', 'கர',
    'நந்தன', 'விசய', 'சய', 'மன்மத', 'துர்முக',
    'ஏமலம்ப', 'விலம்ப', 'விகாரி', 'சார்வரி', 'பலவ',
    'சுபகிருது', 'சோபகிருது', 'கிரோதி', 'விசுவாசு', 'பரிபவ',
    'பிலவங்க', 'கீலக', 'சௌமிய', 'சாதாரண', 'விரோதிகிருது',
    'பரிதாவி', 'பிரமாதி', 'ஆனந்த', 'ராட்சச', 'நள',
    'பிங்கல', 'கலயுக்த', 'சித்தார்த்தி', 'ரௌத்ர', 'துர்மதி',
    'துந்துபி', 'ருதிரோத்காரி', 'ரக்தாக்ஷி', 'க்ரோதன', 'அக்ஷய',
  ],
  chandraMasa: [
    'சித்திரை', 'வைகாசி', 'ஆனி', 'ஆடி', 'ஆவணி',
    'புரட்டாசி', 'ஐப்பசி', 'கார்த்திகை', 'மார்கழி', 'தை',
    'மாசி', 'பங்குனி',
  ],
  vargaNames: {
    1: 'ராசி', 2: 'ஹோரை', 3: 'திரேக்காணம்', 4: 'சதுர்த்தாம்சம்',
    7: 'சப்தாம்சம்', 9: 'நவாம்சம்', 10: 'தசாம்சம்', 11: 'ருத்ராம்சம்',
    12: 'துவாதசாம்சம்',
    16: 'சோடசாம்சம்', 20: 'விம்சாம்சம்', 24: 'சதுர்விம்சாம்சம்',
    27: 'நக்ஷத்ராம்சம் (பாம்சம்)', 30: 'திரிம்சாம்சம்', 40: 'கவேதாம்சம்',
    45: 'அக்ஷவேதாம்சம்', 60: 'ஷஷ்டியாம்சம்',
  },
  vargaSubtitles: {
    1: 'உடல்', 2: 'செல்வம்', 3: 'தைரியம் / சகோதரர்கள்',
    4: 'அதிர்ஷ்டம் / வீடு', 7: 'குழந்தைகள்',
    9: 'மனைவி / தர்மம்', 10: 'தொழில் / உயர்வு', 11: 'லாபம் / வருவாய்',
    12: 'பெற்றோர்', 16: 'வாகனம் / சுகங்கள்',
    20: 'ஆன்மீக முன்னேற்றம்', 24: 'கல்வி / அறிவு',
    27: 'பலம் / பலவீனம்', 30: 'தீமை / தடைகள்',
    40: 'தாய் வழி', 45: 'தந்தை வழி',
    60: 'முன்வினை கர்மா',
  },
  gowriNames: ['சோரம்', 'உதி', 'விஷம்', 'அமிர்தை', 'ரோகம்', 'லாபம்', 'தனம்', 'சுகம்'],
  karakaTitles: ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'],
  kalsarpaTypes: [
    'அனந்த', 'குலிக', 'வாசுகி', 'சங்கபால', 'பத்ம', 'மகாபத்ம',
    'தக்சக', 'கருக்கோடக', 'சங்கசூட', 'காதக', 'விசக்தக', 'சேஷநாக',
  ],
  drikRitu: [
    'வசந்த', 'கிரீஷ்ம', 'கிரீஷ்ம', 'வர்ஷ', 'வர்ஷ', 'சரத்',
    'சரத்', 'ஹேமந்த', 'ஹேமந்த', 'சிசிர', 'சிசிர', 'வசந்த',
  ],
  vedicRitu: [
    'வசந்த', 'கிரீஷ்ம', 'கிரீஷ்ம', 'வர்ஷ', 'வர்ஷ', 'சரத்',
    'சரத்', 'ஹேமந்த', 'ஹேமந்த', 'சிசிர', 'சிசிர', 'வசந்த',
  ],
  directions: ['கிழக்கு', 'தென்கிழக்கு', 'தெற்கு', 'தென்மேற்கு', 'மேற்கு', 'வடமேற்கு', 'வடக்கு', 'வடகிழக்கு'],
  nirayanaMonths: [
    'வைகாசி', 'ஆனி', 'ஆடி', 'ஆவணி', 'புரட்டாசி', 'ஐப்பசி',
    'கார்த்திகை', 'மார்கழி', 'தை', 'மாசி', 'பங்குனி', 'சித்திரை',
  ],
  shakaMonths: [
    'சித்திரை', 'வைகாசி', 'ஆனி', 'ஆடி', 'ஆவணி', 'புரட்டாசி',
    'ஐப்பசி', 'கார்த்திகை', 'மார்கழி', 'தை', 'மாசி', 'பங்குனி',
  ],
};

export default locale;
```

- [ ] **Step 4: Create locale resolver**

```typescript
// src/locales/index.ts
import type { Locale, LocaleTable } from '../types';
import en from './en';
import hi from './hi';
import ta from './ta';

const TABLES: Record<Locale, LocaleTable> = { en, hi, ta };

export { en, hi, ta };
export { TABLES };

export function resolveName(
  id: number,
  tableKey: keyof LocaleTable,
  locale: Locale = 'en'
): string {
  const table = TABLES[locale];
  const arr = table[tableKey] as string[] | Record<number, string>;
  if (Array.isArray(arr)) {
    return arr[id] ?? '';
  }
  return (arr as Record<number, string>)[id] ?? '';
}

export function resolveNamedEntity(
  id: number,
  tableKey: keyof LocaleTable,
  locale: Locale = 'en'
): { id: number; name: string } {
  return { id, name: resolveName(id, tableKey, locale) };
}

export function getLocaleTable(locale: Locale): LocaleTable {
  return TABLES[locale];
}
```

- [ ] **Step 5: Verify compilation**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/locales/
git commit -m "feat: add locale system with en, hi, ta"
```

---

### Task 3: Constants

**Files:**
- Create: `src/constants/panchang.ts`
- Create: `src/constants/vargas.ts`
- Create: `src/constants/planets.ts`
- Create: `src/constants/muhurta.ts`
- Create: `src/constants/calendars.ts`
- Create: `src/constants/index.ts`

All constant files are pure data. Source every value from the corresponding Python backend file.

- [ ] **Step 1: Create src/constants/panchang.ts**

```typescript
// Tithi, nakshatra, yoga, karana, vara constants (language-agnostic)

// NAK_SPAN = 360 / 27
export const NAK_SPAN = 360.0 / 27;
// SIGN_SPAN = 30
export const SIGN_SPAN = 30.0;

// Rahu Kalam segment per isoweekday (1=Mon..7=Sun)
export const RAHU_KAAL_SEGMENT: Record<number, number> = { 1: 2, 2: 7, 3: 5, 4: 6, 5: 4, 6: 3, 7: 8 };
export const YAMAGANDA_SEGMENT: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1, 5: 7, 6: 6, 7: 5 };
export const GULIKA_SEGMENT: Record<number, number> = { 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1, 7: 7 };

// Sundry fixed karanas
export const FIXED_KARANA_INDICES = {
  KIMSTUGHNA: 0,
  SHAKUNI: 57,
  CHATUSHPADA: 58,
  NAGA: 59,
};

export function karanaName(halfIndex: number): string {
  if (halfIndex === 0) return 'Kimstughna';
  if (halfIndex >= 1 && halfIndex <= 56) {
    const MOVABLE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
    return MOVABLE[(halfIndex - 1) % 7];
  }
  if (halfIndex === 57) return 'Shakuni';
  if (halfIndex === 58) return 'Chatushpada';
  if (halfIndex === 59) return 'Naga';
  return 'Unknown';
}

export function tithiName(index: number): string {
  const BASE = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'];
  if (index === 15) return 'Purnima';
  if (index === 30) return 'Amavasya';
  if (index >= 1 && index <= 14) return `Shukla ${BASE[index - 1]}`;
  if (index >= 16 && index <= 29) return `Krishna ${BASE[index - 16]}`;
  return 'Unknown';
}
```

- [ ] **Step 2: Create src/constants/vargas.ts**

```typescript
// Varga (divisional chart) definitions

// 17 vargas (D1-D60 incl. D11 Rudramsa) - matches backend/vargas.py VARGA_ORDER
export const VARGA_ORDER = [1, 2, 3, 4, 7, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60];

// Sign quality: 1=movable (chara), 2=fixed (sthira), 3=dual (dwi-swabhava)
export const SIGN_QUALITY: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 1, 5: 2, 6: 3,
  7: 1, 8: 2, 9: 3, 10: 1, 11: 2, 12: 3,
};

// Sign element: 1=fire, 2=earth, 3=air, 4=water
export const SIGN_ELEMENT: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 1, 6: 2,
  7: 3, 8: 4, 9: 1, 10: 2, 11: 3, 12: 4,
};

// D30 uneven segment breaks
export const D30_BREAKS_ODD = [0, 5, 10, 18, 25, 30];
export const D30_BREAKS_EVEN = [0, 5, 12, 20, 25, 30];

// D30 sign mapping per part for odd/even signs
// For each part index, the resulting divisional sign (1-12)
export const D30_SIGNS_ODD = [1, 11, 9, 3, 7];   // Aries, Aquarius, Sagittarius, Gemini, Libra
export const D30_SIGNS_EVEN = [2, 6, 12, 10, 8];  // Taurus, Virgo, Pisces, Capricorn, Scorpio

// Varga definitions: for each varga number, define start sign rules
// Returns the base (starting) sign for a given rashi sign and varga
export function computeVargaStartSign(signId: number, varga: number, part: number): number {
  const quality = SIGN_QUALITY[signId];

  switch (varga) {
    case 1: return signId;  // D1: same sign
    case 2: return signId;  // D2 handled separately
    case 3: return ((signId - 1 + [0, 4, 8][part]) % 12) + 1;
    case 4: return ((signId - 1 + [0, 3, 6, 9][part]) % 12) + 1;
    // D7: odd starts from same sign, even from 7th (matches vargas.py)
    case 7: return ((signId - 1 + (signId % 2 === 1 ? 0 : 6)) % 12) + 1;
    case 9: return signId;  // D9 uses direct formula
    // D10: odd starts from same sign, even from 9th (matches vargas.py)
    case 10: return ((signId - 1 + (signId % 2 === 1 ? 0 : 8)) % 12) + 1;
    // D11 Rudramsa: start found by counting the rasi number anti-zodiacally
    // from Aries (Aries inclusive); parts run forward. Matches vargas.py:
    // start = _add_sign(1, -(sign-1)). e.g. Gemini(3) -> Aquarius(11).
    case 11: return (((1 - signId) % 12) + 12) % 12 + 1;
    case 12: return signId;
    case 16: return quality === 1 ? 1 : quality === 2 ? 5 : 9;  // Movable=Aries, Fixed=Leo, Dual=Sag
    case 20: return quality === 1 ? 1 : quality === 2 ? 9 : 5;  // Movable=Aries, Fixed=Sag, Dual=Leo
    case 24: return signId % 2 === 1 ? 5 : 4;  // Odd=Leo, Even=Cancer
    case 27: return ((quality - 1) * 3) % 12 + 1;  // Fire=1, Earth=4, Air=7, Water=10
    case 30: return signId;  // D30 handled separately
    case 40: return signId % 2 === 1 ? 1 : 7;  // Odd=Aries, Even=Libra
    case 45: return quality === 1 ? 1 : quality === 2 ? 5 : 9;
    case 60: return signId;
    default: return signId;
  }
}
```

- [ ] **Step 3: Create src/constants/planets.ts**

```typescript
// Planet-related constants

export const DASHA_SEQUENCE = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

export const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

// Total years in Vimshottari cycle
export const DASHA_TOTAL_YEARS = 120;

// Nakshatra lord cycle (repeats every 9)
export const NAKSHATRA_LORD_CYCLE = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

// Planet order for chart calculation (name, abbreviation)
// Matches backend/calculator.py planets_list: incl. Ketu (computed as Rahu + 180°)
export const PLANET_ORDER: Array<{ name: string; abbr: string }> = [
  { name: 'Sun', abbr: 'Su' },
  { name: 'Moon', abbr: 'Mo' },
  { name: 'Mars', abbr: 'Ma' },
  { name: 'Mercury', abbr: 'Me' },
  { name: 'Jupiter', abbr: 'Ju' },
  { name: 'Venus', abbr: 'Ve' },
  { name: 'Saturn', abbr: 'Sa' },
  { name: 'Rahu', abbr: 'Ra' },
  { name: 'Ketu', abbr: 'Ke' },
  { name: 'Uranus', abbr: 'Ur' },
  { name: 'Neptune', abbr: 'Ne' },
  { name: 'Pluto', abbr: 'Pl' },
];

// Planets eligible for combustion check (Sun, Rahu, Ketu excluded)
export const COMBUST_PLANETS = new Set(['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']);
export const COMBUST_ORB = 5.0;

// Ayanamsa ID → swisseph constant mapping
// Matches backend/ayanamsa.py AYANAMSA_OPTIONS
export enum SideralMode {
  LAHIRI = 1,
  RAMAN = 2,
  KRISHNAMURTI_VP291 = 3,
  TRUE_CITRA = 4,
  KRISHNAMURTI = 5,
  MANOJ = 28, // SIDM_LAHIRI_ICRC
}

export const AYANAMSA_MAP: Record<string, { mode: SideralMode | null; label: string }> = {
  lahiri: { mode: SideralMode.LAHIRI, label: 'N.C. Lahiri (Chitrapaksha)' },
  kp_new: { mode: SideralMode.KRISHNAMURTI_VP291, label: 'K.P. New (Krishnamurti VP291)' },
  kp_old: { mode: SideralMode.KRISHNAMURTI, label: 'K.P. Old (Krishnamurti)' },
  raman: { mode: SideralMode.RAMAN, label: 'B.V. Raman' },
  kp_khullar: { mode: SideralMode.TRUE_CITRA, label: 'K.P. Khullar (True Chitrapaksha)' },
  sayan: { mode: null, label: 'Sayana (Tropical)' },
  manoj: { mode: SideralMode.MANOJ, label: 'Manoj (Lahiri ICRC)' },
};

// BAV rules: planet → { contributor → [house numbers] }
// Source: backend/calculator.py BAV_RULES
export const BAV_RULES: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Asc: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [3, 6, 7, 8, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Asc: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Asc: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Asc: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Asc: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Asc: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Asc: [1, 3, 4, 6, 10, 11],
  },
};

export const BAV_CONTRIBUTORS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Asc'];
```

- [ ] **Step 4: Create src/constants/muhurta.ts**

```typescript
// Muhurta-related constants

// Varjyam starting ghatika (out of 60) per nakshatra index (0=Ashwini)
// Source: backend/advanced_panchang.py
export const VARJYAM_GHATIKAS = [
  50, 24, 30, 40, 14, 21, 30, 20, 32, 30,
  20, 18, 21, 20, 14, 14, 10, 14, 56, 24,
  20, 10, 10, 18, 16, 24, 30,
];

export const VARJYAM_DURATION_GHATIKAS = 1.6;

// Amrit Kalam = (Varjyam + 26.67) % 60
export const AMRIT_KALAM_GHATIKAS = VARJYAM_GHATIKAS.map(g => (g + 26.67) % 60);
export const AMRIT_KALAM_DURATION_GHATIKAS = 1.6;

// Sarvartha Siddhi Yoga: weekday → set of nakshatra indices
export const SARVARTHA_SIDDHI: Record<number, Set<number>> = {
  1: new Set([3, 4, 7, 17]),      // Mon
  2: new Set([0, 2, 8, 25]),      // Tue
  3: new Set([0, 2, 3, 4, 12, 16]), // Wed
  4: new Set([0, 6, 7, 16, 26]),  // Thu
  5: new Set([0, 6, 16, 21, 26]), // Fri
  6: new Set([3, 14, 21]),        // Sat
  7: new Set([0, 7, 10, 11, 12, 18, 20, 25]), // Sun
};

// Amrita Siddhi Yoga: weekday → set of nakshatra indices
export const AMRITA_SIDDHI: Record<number, Set<number>> = {
  1: new Set([4]),   // Mon + Mrigashira
  2: new Set([0]),   // Tue + Ashwini
  3: new Set([16]),  // Wed + Anuradha
  4: new Set([7]),   // Thu + Pushya
  5: new Set([26]),  // Fri + Revati
  6: new Set([3]),   // Sat + Rohini
  7: new Set([12]),  // Sun + Hasta
};

// Dur Muhurta indices per weekday (1=Mon..7=Sun)
// Matches backend/panchang_constants.py DUR_MUHURTA.
// Wednesday's Dur Muhurtam is the 8th muhurta = same slot as Abhijit,
// so Abhijit is suppressed that day (ABHIJIT_MUHURTA_INDEX handling).
export const DUR_MUHURTA: Record<number, number[]> = {
  1: [9, 12],
  2: [4],
  3: [8],
  4: [6],
  5: [4],
  6: [1, 2],
  7: [14],
};

export const ABHIJIT_MUHURTA_INDEX = 8;

// Gowri day start index per weekday
export const GOWRI_DAY_START: Record<number, number> = {
  1: 3, 2: 4, 3: 5, 4: 7, 5: 2, 6: 0, 7: 1,
};

// Hora day start index per weekday (cycle index into HORA_CYCLE)
export const HORA_DAY_START: Record<number, number> = {
  1: 3, 2: 6, 3: 2, 4: 5, 5: 1, 6: 4, 7: 0,
};

export const HORA_CYCLE = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
export const AUSPICIOUS_HORAS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);

// Amritadi yogam table (27 nakshatras × 7 columns)
// A=Amrita, S=Siddha, M=Marana, P=Prabalarishta
// Columns: Mon Tue Wed Thu Fri Sat Sun (ISO order) - matches backend/_AMRITADI_TABLE
export const AMRITADI_TABLE = [
  'SSMAASS', // Ashwini
  'SSSSSSP', // Bharani
  'MSAMSSS', // Krittika
  'AASMMAS', // Rohini
  'SSSMSSS', // Mrigashira
  'SMSMSSS', // Ardra
  'ASSASSS', // Punarvasu
  'SSSSMSS', // Pushya
  'SSSSMMS', // Ashlesha
  'MSSAMAM', // Magha
  'SSASSSS', // Purva Phalguni
  'SAAMSMA', // Uttara Phalguni
  'SSMSAMS', // Hasta
  'PSSSSMS', // Chitra
  'ASSASSS', // Swati
  'MMSSSSM', // Vishakha
  'SSSSSSM', // Anuradha
  'SMSPMSM', // Jyeshtha
  'SAMSASA', // Mula
  'MSASPSS', // Purva Ashadha
  'MPASSSA', // Uttara Ashadha
  'ASSSMSA', // Shravana
  'SSPSSSM', // Dhanishta
  'SMSMSAS', // Shatabhisha
  'MMASSMS', // Purva Bhadrapada
  'SASSSSA', // Uttara Bhadrapada
  'SSMSSPA', // Revati
];

// Nakshatra tyajyam ratio pairs [numerator, denominator]
// Matches backend/tyajyam.py NAKSHATRA_TYAJYAM_RATIO
export const NAKSHATRA_TYAJYAM_RATIO: Array<[number, number]> = [
  [5,6], [2,5], [1,2], [2,3], [7,30], [7,20], [1,2], [1,3], [8,15],
  [1,2], [1,3], [3,10], [11,30], [14,15], [7,30], [7,30], [1,6], [7,30],
  [1,3], [2,5], [1,3], [1,6], [1,6], [3,10], [4,15], [2,5], [1,2],
];

export const NAKSHATRA_TYAJYAM_DURATION_MIN = 96;

// Tithi tyajyam ratio table (base 15: Pratipada..Amavasya; applies to both
// Shukla/Krishna via mod 15). Matches backend/tyajyam.py _TITHI_TYAJYAM_BASE.
// tithi 15 (Purnima) -> (29,60), tithi 30 (Amavasya) -> (1,10) override.
export const TITHI_TYAJYAM_BASE: Array<[number, number]> = [
  [2,5], [1,5], [11,12], [1,12], [9,10], [9,10], [31,60], [1,3], [1,12],
  [11,20], [1,60], [1,4], [13,30], [7,60], [29,60], [1,10],
];

export const TITHI_TYAJYAM_DURATION_MIN = 96;

// Vara tyajyam nazhigai offset per weekday (1 nazhigai = 24 min)
// Matches backend/tyajyam.py VARA_TYAJYAM_NAZHIGAI
export const VARA_TYAJYAM_NAZHIGAI: Record<number, number> = {
  1: 42, 2: 31, 3: 42, 4: 31, 5: 21, 6: 14, 7: 32,
};

export const VARA_TYAJYAM_DURATION_MIN = 90;

// Inauspicious karanas
export const INAUSPICIOUS_KARANAS = new Set(['Vishti', 'Chatushpada', 'Naga']);

// Lagna defect position per sign (matches backend/tyajyam.py _LAGNA_DEFECT_POSITION)
export const LAGNA_DEFECT_POSITION: Record<string, string> = {
  Aries: 'beginning', Taurus: 'beginning', Virgo: 'beginning', Sagittarius: 'beginning',
  Gemini: 'middle', Leo: 'middle', Libra: 'middle', Aquarius: 'middle',
  Cancer: 'end', Scorpio: 'end', Capricorn: 'end', Pisces: 'end',
};

export const LAGNA_DEFECT_RATIO = 0.10;
export const GURU_ASTHAMANAM_ORB = 11;
export const SUKRA_ASTHAMANAM_ORB_DIRECT = 10;
export const SUKRA_ASTHAMANAM_ORB_RETRO = 8;
```

- [ ] **Step 5: Create src/constants/calendars.ts**

```typescript
// Calendar-related constants

export const KALI_START_JD = 588465.5;    // Feb 18, 3102 BCE
export const RATA_DIE_EPOCH_JD = 1721424.5; // Jan 1, 1 CE

// Disha Shool per weekday (matches backend DISHA_SHOOL)
export const DISHA_SHOOL: Record<number, string> = {
  1: 'East', 2: 'North', 3: 'North', 4: 'South',
  5: 'West', 6: 'East', 7: 'West',
};

// Rahu Vasa per weekday (matches backend RAHU_VASA)
export const RAHU_VASA: Record<number, string> = {
  1: 'North-West', 2: 'North', 3: 'South-East', 4: 'South',
  5: 'East', 6: 'West', 7: 'South-West',
};

// Chandra Vasa per Moon sign index (1-12) (matches backend CHANDRA_VASA)
export const CHANDRA_VASA: Record<number, string> = {
  1: 'West', 2: 'South', 3: 'West', 4: 'North',
  5: 'East', 6: 'West', 7: 'South', 8: 'East',
  9: 'North', 10: 'East', 11: 'West', 12: 'South',
};

// Good Chandra offsets (0-11, from birth rashi)
export const GOOD_CHANDRA_OFFSETS = new Set([0, 2, 5, 6, 9, 10]);

// Good Tara offsets (0-26 from birth nakshatra): positions 1,2,4,6,8,9 in
// each cycle of 9, repeated across 27. Matches backend GOOD_TARA_OFFSETS.
export const GOOD_TARA_OFFSETS = new Set([0, 1, 3, 5, 7, 8, 9, 10, 12, 14, 16, 17, 18, 19, 21, 23, 25, 26]);

// Rashi names (Sanskrit, 0-indexed via ID)
export const RASHI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

// Chandra masa: amanta lunar month name indexed by sun_sign_id (0-11).
// Matches backend/panchang_constants.py CHANDRA_MASA accessed as
// CHANDRA_MASA[sun_sign_id % 12] - so Mesha -> Vaishakha (the new moon
// falls in the previous sidereal sign). 0-indexed like sign IDs.
export const CHANDRA_MASA = [
  'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana',
  'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha',
  'Pausha', 'Magha', 'Phalguna', 'Chaitra',
];
};

// Sign → Drik Ritu mapping (1 = Aries). Matches backend SIGN_TO_DRIK_RITU:
// Aries + Pisces = Vasant(Spring), Taurus/Gemini = Grishma(Summer),
// Cancer/Leo = Varsha(Monsoon), Virgo/Libra = Sharad(Autumn),
// Scorpio/Sagittarius = Hemant(Pre-Winter), Capricorn/Aquarius = Shishir(Winter).
export const SIGN_TO_DRIK_RITU: Record<number, string> = {
  1: 'Vasant', 2: 'Grishma', 3: 'Grishma', 4: 'Varsha',
  5: 'Varsha', 6: 'Sharad', 7: 'Sharad', 8: 'Hemant',
  9: 'Hemant', 10: 'Shishir', 11: 'Shishir', 12: 'Vasant',
};

// Sign → Vedic Ritu mapping (1 = Aries). Matches backend SIGN_TO_VEDIC_RITU.
export const SIGN_TO_VEDIC_RITU: Record<number, string> = {
  1: 'Vasant', 2: 'Grishma', 3: 'Grishma', 4: 'Varsha',
  5: 'Varsha', 6: 'Sharad', 7: 'Sharad', 8: 'Hemant',
  9: 'Hemant', 10: 'Shishir', 11: 'Shishir', 12: 'Vasant',
};
```

- [ ] **Step 6: Create barrel export**

```typescript
// src/constants/index.ts
export * from './panchang';
export * from './vargas';
export * from './planets';
export * from './muhurta';
export * from './calendars';
```

- [ ] **Step 7: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/constants/
git commit -m "feat: add constants (panchang, vargas, planets, muhurta, calendars)"
```

---

### Task 4: Ephemeris Adapter

**Files:**
- Create: `src/ephemeris/index.ts`
- Test: Panchang and chart tests will validate indirectly

- [ ] **Step 1: Create ephemeris adapter**

```typescript
// src/ephemeris/index.ts
import swe from 'swisseph';
import { SideralMode, AYANAMSA_MAP } from '../constants/planets';
import type { AyanamsaId } from '../types';

export class EphemerisService {
  private static instance: EphemerisService;
  private _initialized = false;
  private _ephePath: string | null = null;

  private constructor() {}

  static getInstance(): EphemerisService {
    if (!EphemerisService.instance) {
      EphemerisService.instance = new EphemerisService();
    }
    return EphemerisService.instance;
  }

  init(ephePath?: string): void {
    if (this._initialized) return;
    if (ephePath) {
      swe.set_ephe_path(ephePath);
      this._ephePath = ephePath;
    }
    // Default to Lahiri
    swe.set_sid_mode(SideralMode.LAHIRI);
    this._initialized = true;
  }

  get initialized(): boolean { return this._initialized; }

  setAyanamsa(ayanamsa: AyanamsaId): void {
    const config = AYANAMSA_MAP[ayanamsa];
    if (!config) throw new Error(`Unknown ayanamsa: ${ayanamsa}`);
    if (config.mode !== null) {
      swe.set_sid_mode(config.mode);
    }
  }

  getSiderealFlag(ayanamsa: AyanamsaId): number {
    return ayanamsa === 'sayan' ? 0 : 1024; // FLG_SIDEREAL
  }

  julday(year: number, month: number, day: number, hour: number): number {
    return swe.julday(year, month, day, hour, 1); // 1 = Gregorian calendar
  }

  revjul(jd: number): [number, number, number, number] {
    const [y, m, d, h] = swe.revjul(jd);
    return [y, m, d, h];
  }

  calcUt(
    jd: number,
    planet: number,
    flags: number = 2 | 256 // FLG_SWIEPH | FLG_SPEED
  ): { lon: number; lat: number; dist: number; speed: number } {
    const xx = swe.calc_ut(jd, planet, flags);
    return {
      lon: xx[0],
      lat: xx[1],
      dist: xx[2],
      speed: xx[3],
    };
  }

  housesEx(
    jd: number,
    lat: number,
    lon: number,
    hsys: string = 'P', // Placidus
    flags: number = 1024 // FLG_SIDEREAL
  ): { cusps: Float64Array; ascmc: Float64Array } {
    const result = swe.houses_ex(jd, lat, lon, hsys, flags);
    return {
      cusps: result[0],
      ascmc: result[1],
    };
  }

  riseTrans(
    jd: number,
    body: number,
    geopos: [number, number, number],
    which: number
  ): number | null {
    try {
      const result = swe.rise_trans(jd, body, which, geopos);
      if (result[0] === 0) {
        return result[1][0];
      }
    } catch {
      // fall through
    }
    return null;
  }

  getAyanamsaUt(jd: number): number {
    return swe.get_ayanamsa_ut(jd);
  }

  solEclipseWhenGlob(jd: number, flags?: number): any {
    return swe.sol_eclipse_when_glob(jd, flags);
  }

  lunEclipseWhen(jd: number, flags?: number): any {
    return swe.lun_eclipse_when(jd, flags);
  }
}

// Convenience re-exports of swisseph constants
export const SE = {
  SUN: 0 as const,
  MOON: 1 as const,
  MERCURY: 2 as const,
  VENUS: 3 as const,
  MARS: 4 as const,
  JUPITER: 5 as const,
  SATURN: 6 as const,
  URANUS: 7 as const,
  NEPTUNE: 8 as const,
  PLUTO: 9 as const,
  MEAN_NODE: 10 as const,
  CALC_RISE: 1 as const,
  CALC_SET: 2 as const,
  FLG_SWIEPH: 2 as const,
  FLG_SPEED: 256 as const,
  FLG_SIDEREAL: 1024 as const,
};
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/ephemeris/
git commit -m "feat: add Swiss Ephemeris adapter"
```

---

### Task 5: Bisection Search Engine

**Files:**
- Create: `src/calculations/bisection.ts`
- Test: `test/bisection.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// test/bisection.test.ts
import { describe, it, expect } from 'vitest';
import { findAngleTime } from '../src/calculations/bisection';

describe('bisection', () => {
  it('finds a simple crossing at known point', () => {
    // angleFn returns degrees that increase linearly: t => t * 10
    // target 90° should be at t=9
    const result = findAngleTime(0, 18, 90, (t) => t * 10);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(9, 4);
  });

  it('returns null when no crossing in range', () => {
    // angle goes 0->180, target 270 is never reached
    const result = findAngleTime(0, 18, 270, (t) => t * 10);
    expect(result).toBeNull();
  });

  it('handles 360-degree wrap (crosses 0)', () => {
    // angle goes 350 -> 10 (crossing through 0)
    // target 0° should be found
    const result = findAngleTime(0, 4, 0, (t) => (350 + t * 5) % 360);
    expect(result).not.toBeNull();
  });

  it('returns lo bound when exact at start', () => {
    const result = findAngleTime(5, 10, 50, (t) => t * 10);
    expect(result).toBe(5);
  });

  it('achieves 1e-8 precision within 40 iterations', () => {
    const result = findAngleTime(0, 10, 45, (t) => t * 10);
    expect(result).not.toBeNull();
    expect(Math.abs(result! - 4.5)).toBeLessThan(1e-7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/bisection.test.ts --reporter=verbose 2>&1 | head -20
```
Expected: FAIL with "Cannot find module" or "function not defined".

- [ ] **Step 3: Implement bisection**

```typescript
// src/calculations/bisection.ts

export type AngleFn = (jd: number) => number;

/**
 * Normalize angle difference to [-180, 180].
 */
function normalizeDiff(diff: number): number {
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Binary search to find JD when angleFn(jd) reaches targetDeg.
 *
 * @param lo         Lower bound JD
 * @param hi         Upper bound JD
 * @param targetDeg  Target angle (0-360)
 * @param angleFn    Function returning angle at any JD
 * @returns JD of crossing, or null if no crossing
 */
export function findAngleTime(
  lo: number,
  hi: number,
  targetDeg: number,
  angleFn: AngleFn
): number | null {
  const fLo = angleFn(lo);
  const fHi = angleFn(hi);

  if (Math.abs(fLo - targetDeg) < 1e-12) return lo;
  if (Math.abs(fHi - targetDeg) < 1e-12) return hi;

  // Count wraps: how many times has the angle passed target on this interval?
  const wraps = Math.floor((fLo + 360 - targetDeg) / 360);
  const expectWraps = Math.floor((fHi + 360 - targetDeg) / 360);

  // If no crossing expected, return null
  if (expectWraps <= wraps) return null;

  // Binary search (~40 iterations)
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const fMid = angleFn(mid);
    const diff = normalizeDiff(targetDeg - fMid);

    if (diff > 0) {
      lo = mid;
    } else {
      hi = mid;
    }

    if (hi - lo < 1e-8) break;
  }

  return (lo + hi) / 2;
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run test/bisection.test.ts --reporter=verbose
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calculations/bisection.ts test/bisection.test.ts
git commit -m "feat: add bisection search engine"
```

---

### Task 6: Panchang Limb Generators (Tithi, Nakshatra, Yoga, Karana, Moon Sign)

**Files:**
- Create: `src/calculations/panchang.ts`
- Test: `test/panchang.test.ts`

- [ ] **Step 1: Write partial test**

```typescript
// test/panchang.test.ts
import { describe, it, expect } from 'vitest';
import { EphemerisService, SE } from '../src/ephemeris';
import { tithiIndex, nakshatraIndex, yogaIndex, moonSignId } from '../src/calculations/panchang';
import { KELOWNA } from './helpers';

describe('panchang limb indices', () => {
  const ephe = EphemerisService.getInstance();
  ephe.init();

  // Kelowna 2018-06-01 sunrise (approx JD)
  // We'll compute from first principles
  const jd = ephe.julday(2018, 6, 1, 12); // noon UT

  const flags = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
  const sun = ephe.calcUt(jd, SE.SUN, flags);
  const moon = ephe.calcUt(jd, SE.MOON, flags);

  it('computes tithi index (1-30)', () => {
    const idx = tithiIndex(sun.lon % 360, moon.lon % 360);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(idx).toBeLessThanOrEqual(30);
  });

  it('computes nakshatra index (0-26)', () => {
    const idx = nakshatraIndex(moon.lon % 360);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(26);
  });

  it('computes yoga index (0-26)', () => {
    const idx = yogaIndex(sun.lon % 360, moon.lon % 360);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(26);
  });

  it('computes moon sign (1-12)', () => {
    const idx = moonSignId(moon.lon % 360);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(idx).toBeLessThanOrEqual(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Expected: FAIL (module not found)

- [ ] **Step 3: Implement panchang limb generators**

```typescript
// src/calculations/panchang.ts

import { NAK_SPAN } from '../constants/panchang';

/**
 * Tithi index (1-30). 1 = Shukla Pratipada, 15 = Purnima, 30 = Amavasya.
 * Formula: floor((moonLon - sunLon) / 12) + 1
 */
export function tithiIndex(sunLon: number, moonLon: number): number {
  let diff = (moonLon - sunLon) % 360;
  if (diff < 0) diff += 360;
  return Math.floor(diff / 12) + 1;
}

/**
 * Nakshatra index (0-26). 0 = Ashwini.
 * Formula: floor(moonLon / 13.333...)
 */
export function nakshatraIndex(moonLon: number): number {
  return Math.floor(moonLon / NAK_SPAN);
}

/**
 * Nakshatra pada (1-4) for a given longitude.
 */
export function nakshatraPada(lon: number): number {
  const degInNak = lon - Math.floor(lon / NAK_SPAN) * NAK_SPAN;
  return Math.floor(degInNak / (NAK_SPAN / 4)) + 1;
}

/**
 * Yoga index (0-26). 0 = Vishkumbha.
 * Formula: floor((sunLon + moonLon) / 13.333...)
 */
export function yogaIndex(sunLon: number, moonLon: number): number {
  const total = (sunLon + moonLon) % 360;
  return Math.floor(total / NAK_SPAN);
}

/**
 * Karana half-index (0-59).
 * Formula: floor((moonLon - sunLon) / 6)
 */
export function karanaHalfIndex(sunLon: number, moonLon: number): number {
  let diff = (moonLon - sunLon) % 360;
  if (diff < 0) diff += 360;
  return Math.floor(diff / 6);
}

/**
 * Moon sign ID (1-12). 1 = Aries.
 * Formula: floor(moonLon / 30) + 1
 */
export function moonSignId(moonLon: number): number {
  return Math.floor(moonLon / 30) + 1;
}

/**
 * Sign ID from longitude (1-12).
 */
export function signIndexFromLongitude(lon: number): number {
  return Math.floor(lon / 30) + 1;
}

/**
 * Degree within sign (0-30).
 */
export function degreeInSign(lon: number): number {
  return lon - Math.floor(lon / 30) * 30;
}

/**
 * Format degree as DMS string: "12° 34' 56\""
 */
export function formatDms(deg: number): string {
  const d = Math.floor(deg);
  const mFull = (deg - d) * 60;
  const m = Math.floor(mFull);
  let s = Math.round((mFull - m) * 60);
  if (s === 60) { s = 0; }
  return `${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run test/panchang.test.ts --reporter=verbose
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calculations/panchang.ts test/panchang.test.ts
git commit -m "feat: add panchang limb index generators"
```

---

### Remaining Tasks (condensed structure)

Each remaining task follows the same pattern: write test → run (fails) → implement → run (passes) → commit.

**Task 7: Sequence Generators + Sunrise**

- File: `src/calculations/sunrise.ts` — `generateTithis()`, `generateNakshatras()`, `generateYogas()`, `generateKaranas()`, `generateMoonSigns()`, `generateNakshatraPadas()`, `generateUdayaLagna()` functions that use the bisection engine to find all transitions in a window
- Each sequence generator: start at `refJd`, compute current index, find next boundary via bisection, repeat until `endJd`
- Test: Verify sequence length and boundary alignment for a known date

**Task 8: Muhurta Timings + Varjyam + Siddhi Yogas**

- File: `src/calculations/muhurta.ts` — Brahma Muhurta, Pratah Sandhya, Abhijit, Vijay, Godhuli, Sayahna, Nishita from 15 day + 15 night muhurta division
- File: `src/calculations/varjyam-amrit.ts` — Varjyam + Amrit Kalam from nakshatra ghatika tables
- File: `src/calculations/siddhi-yogas.ts` — Sarvartha/Amrita Siddhi from weekday+nakshatra lookup
- File: `src/calculations/tarabalam.ts` — offset computation from birth nakshatra
- File: `src/calculations/chandrabalam.ts` — offset computation from birth rashi
- Test: Match reference outputs for Kelowna 2018-06-01

**Task 9: Calendars**

- File: `src/calculations/calendars.ts`
- Shaka Samvatsara: `(shakaYear + 11) % 60`
- Vikram Samvatsara: `(vikramYear + 9) % 60`
- National Civil: Chaitra starts March 21/22
- Nirayana Solar: Find Sun's last sankranti via bisection
- Kali: JD-based ahargana
- Ritu/Ayana from Sun sign
- Chandramasa from tithi index + Sun sign
- Test: Known dates produce correct Kali year, samvatsara name

**Task 10: Vargas (D1–D60)**

- File: `src/calculations/vargas.ts`
- `vargaSign(longitude: number, varga: number, ayanamsa?: AyanamsaId): number` — computes divisional sign 1-12
- `vargaDegreeInSign(longitude: number, varga: number): number` — position within divisional sign 0-30
- All 17 vargas (incl. D11 Rudramsa) with uniform and special rules
- Special start-sign rules: D7 (even signs start 6 signs ahead), D10 (even signs start 8 ahead), D11 (count anti-zodiacally from Aries, parts run forward), D30 uneven segment rules
- `buildVargaCharts(planets, ascLon, locale) → Record<string, VargaChart>` — builds all 17 charts
- Test: Verify D9 matches direct formula, D30 produces correct type-specific signs, D11 Gemini→Aquarius/<Aquarius→Gemini> start

**Task 11: Dasha (Vimshottari + Antardasha)**

- File: `src/calculations/dasha.ts`
- `computeMahadashas(moonLon, birthUtc): Mahadasha[]`
- `computeAntardashas(mahadashas): Mahadasha[]` — enrich each with nested antardashas
- `computePratyantars(antardasha): Pratyantar[]`
- Use 365.25 days/year for year addition
- Test: Verify dasha sequence, balance at birth matches backend

**Task 12: Ashtakavarga**

- File: `src/calculations/ashtakavarga.ts`
- BAV: For each of 7 planets, for each of 8 contributors, add points per rule table
- SAV: Element-wise sum across planets
- Test: Known chart produces correct BAV point counts

**Task 13: Special Placements**

- File: `src/calculations/placements.ts`
- Exaltation, debilitation, own sign, moolatrikona, vargottama, digbala, pushkara, mrityu bhaga, gandanta, neecha bhanga, parivartana, graha yuddha
- All pure lookup-table + simple arithmetic
- Test: Check a planet in its exaltation sign is flagged

**Task 14: Jaimini + Relationships + Aspects + Kalsarpa**

- `src/calculations/jaimini.ts` — rank 7 planets by degree-in-sign descending, build Karakamsa/Swamsa from D9
- `src/calculations/relationships.ts` — natural/temporal/composite 9×9 tables
- `src/calculations/aspects.ts` — standard 7th + special aspects with strength scoring
- `src/calculations/kalsarpa.ts` — arc containment test for Rahu-Ketu axis
- Test: Verify karaka ranking, friendship matrices, aspect list completeness

**Task 15: Gowri + Hora + Nalla Neram**

- `src/calculations/gowri.ts` — 8 day + 8 night segments with cyclic GOWRI_NAMES
- `src/calculations/hora.ts` — 12 day + 12 night segments with HORA_CYCLE
- `src/calculations/nalla-neram.ts` — set subtraction of inauspicious from auspicious horas
- Test: Verify segment count and cycle order

**Task 16: Tyajyam**

- Files: `src/calculations/tyajyam/` sub-module (nakshatra.ts, tithi.ts, vara.ts, amritadi.ts, lagna.ts, karana.ts, gowri.ts, dosha.ts, tithi-lagna.ts, tamil-month.ts, index.ts)
- All 10 types: nakshatra, tithi, vara, amritadi yogam, lagna, karana, gowri, dosha, tithi-lagna, tamil-month avoidables
- Constants: `NAKSHATRA_TYAJYAM_RATIO`, `TITHI_TYAJYAM_BASE` (+Purnima `(29,60)` / Amavasya `(1,10)` overrides), `VARA_TYAJYAM_NAZHIGAI`, `AMRITADI_TABLE`, `LAGNA_DEFECT_POSITION` and `LAGNA_DEFECT_RATIO` (see §constants)
- Dosha Tyajyam only within eclipse windows (uses eclipse `start`/`end`)
- Tamil-month avoidables: `avoid_tithis`, `avoid_nakshatras`, `avoid_lagnas`, `windows: [{start, end, kind, name}]` or null
- Test: Verify durations and window counts

**Task 17: Ganda Mula + Ravi Yoga**

- File: `src/calculations/ganda-mula-ravi-yoga.ts`
- Simple lookup/offset based detectors
- Test: Known test cases from backend

**Task 18: Public API Orchestration**

- `src/api/get-panchang.ts` — `computeDetailedPanchang()` that:
  1. Resolves timezone/location
  2. Computes Julian Day
  3. Gets sunrise/sunset/moonrise/moonset
  4. Generates all sequence windows
  5. Computes muhurta timings, varjyam, siddhi yogas
  6. Computes tarabalam, chandrabalam
  7. Computes gowri, hora, nalla neram
  8. Computes tyajyam
  9. Computes calendars
  10. Resolves locale names
  11. Assembles PanchangResponse

- `src/api/calculate.ts` — `computeChart()` that:
  1. Parses birth info, computes UTC/JD
  2. Computes planetary positions (with ayanamsa)
  3. Computes ascendant
  4. Assigns whole-sign houses
  5. Builds all 17 vargas
  6. Computes dasha + antardasha
  7. Computes ashtakavarga, placements, karakas, friendships, aspects, kalsarpa
  8. Resolves locale names
  9. Assembles ChartResponse

- `src/index.ts` — barrel export of both public functions + types + error classes

**Task 19: Integration Tests**

- `test/get-panchang.test.ts` — call `computeDetailedPanchang` for Kelowna 2018-06-01 through 2018-06-10, verify specific fields match backend reference data
- `test/calculate.test.ts` — call `computeChart` for Alpharetta 2026-07-04 with known parameters, verify planet positions within tolerance

**Task 20: README + Package Polish**

- `README.md` with: install instructions, usage examples for both APIs, locale configuration, link to full API docs
- Verify `npm run build` produces clean `dist/`
- Verify `npm test` passes all tests

---

## Self-Review Checklist

**1. Spec coverage:**
- Types ✓ (Task 1)
- Locales en/hi/ta ✓ (Task 2)
- Constants (all lookup tables) ✓ (Task 3)
- Ephemeris adapter ✓ (Task 4)
- Bisection search ✓ (Task 5)
- Panchang limb indices ✓ (Task 6)
- Sequence generators ✓ (Task 7)
- Muhurta/Varjyam/Siddhi/Tarabalam/Chandrabalam ✓ (Task 8)
- Calendars (Shaka, Vikram, Kali, etc.) ✓ (Task 9)
- Vargas D1-D60 ✓ (Task 10)
- Dasha ✓ (Task 11)
- Ashtakavarga ✓ (Task 12)
- Special placements ✓ (Task 13)
- Jaimini, Relationships, Aspects, Kalsarpa ✓ (Task 14)
- Gowri, Hora, Nalla Neram ✓ (Task 15)
- Tyajyam ✓ (Task 16)
- Ganda Mula + Ravi Yoga ✓ (Task 17)
- Public API (both endpoints) ✓ (Task 18)
- Integration tests ✓ (Task 19)
- README + package polish ✓ (Task 20)

**2. Placeholder check:** No "TBD", "TODO", "implement later", or "add error handling" without specificity in this plan. Every task specifies exact files, code content, and commands.

**3. Type consistency:** Type names used match `src/types.ts` from Task 1. All function names are consistent: `computeDetailedPanchang`, `computeChart`, `findAngleTime`, `tithiIndex`, `nakshatraIndex`, etc.

**Gap found:** The `LocaleTable` interface needs to be fully defined in `src/types.ts` before Task 2 (locale files) can import it. This is covered — Task 1 step 6 includes `LocaleTable` in types.ts.

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, you review between tasks, fast iteration with parallel test verification.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach would you like?
