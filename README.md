# vedic-panchanga

A complete Vedic Panchanga and Kundali (birth chart) calculator for Node.js and browsers, written in TypeScript. Uses the Swiss Ephemeris via [`@swisseph/browser`](https://www.npmjs.com/package/@swisseph/browser) (WebAssembly) for astronomical calculations and pure TypeScript for all astrological logic.

## Features

- **Full Drik Panchang**: Tithi, Nakshatra, Yoga, Karana, Vara, Moon sign, Sun sign
- **Auspicious timings**: Brahma Muhurta, Abhijit, Vijay, Godhuli, Nishita, Amrit Kalam, Sarvartha/Amrita Siddhi Yoga
- **Inauspicious timings**: Rahu Kalam, Yamaganda, Gulika, Dur Muhurtam, Bhadra, Varjyam
- **Gowri Panchangam** (8+8 segments) and **Planetary Hora** (12+12)
- **Nalla Neram** (auspicious hours after subtracting inauspicious windows)
- **Tyajyam**: all 10 types (Nakshatra, Tithi, Vara, Amritadi, Lagna, Karana, Gowri, Dosha, Tithi-Lagna, Tamil Month)
- **Calendars**: Shaka, Vikram, Kali, Gujarati, National Civil, Nirayana solar, Lunar month
- **Ritu/Ayana**, Chandra Vasa, Disha Shool, Rahu Vasa
- **Birth Chart (Kundali)**: All 17 divisional charts (D1–D60), including D11 Rudramsa
- **Vimshottari Dasha**: Mahadasha + Antardasha + Pratyantar
- **Ashtakavarga**: BAV + SAV for all 7 planets
- **Special placements**: Exaltation, debilitation, own sign, Moolatrikona, Vargottama, Digbala, Pushkara, Mrityu Bhaga, Gandanta, Neecha Bhanga, Parivartana, Graha Yuddha
- **Jaimini Chara Karakas** + Karakamsa/Swamsa
- **Planetary friendships** (natural, temporal, composite)
- **Graha Drishti** (aspects with strength)
- **Kalsarpa Yoga** detection
- **Locales**: English (`en`), Hindi/Devanagari (`hi`), Tamil (`ta`)

## Requirements

- Node.js 20+ (Node only; browsers are also supported)

## Installation

```bash
npm install vedic-panchanga
```

The astronomical engine ships as a WebAssembly module inside `@swisseph/browser`; no native C++ build step is required. In browsers the engine is loaded automatically; in Node.js a small `fetch` shim is installed on first use to serve the bundled `.wasm`.

## Browser usage

The package is compiled to CommonJS with a dynamic `import()` of the ESM-only
`@swisseph/browser` package, so it also works in bundlers that support
dynamic imports (Vite, webpack, Rollup …). WASM loading follows the standard
`@swisseph/browser` path — no extra configuration needed.

## Quick Start

### Panchang (Daily Almanac)

```typescript
import { computeDetailedPanchang } from 'vedic-panchanga';

const panchang = await computeDetailedPanchang(
  '2026-07-04',       // date (YYYY-MM-DD), defaults to today
  34.075,             // latitude
  -84.294,            // longitude
  'America/New_York', // IANA timezone (defaults to 'UTC')
  'en',               // locale: 'en' | 'hi' | 'ta'
);

console.log(panchang.vara.english);           // "Saturday"
console.log(panchang.panchang.tithi?.name);   // e.g. "Ashtami"
console.log(panchang.sun_moon.sunrise);       // ISO datetime string
console.log(panchang.auspicious_timings.abhijit);
// { start: "2026-07-04T17:23:00.000Z", end: "2026-07-04T18:11:00.000Z" }
```

### Birth Chart (Kundali)

```typescript
import { computeChart } from 'vedic-panchanga';

const chart = await computeChart(
  {
    date:      '1990-03-15',
    time:      '08:30',          // 24-hour local time
    latitude:  28.6139,
    longitude: 77.2090,
    timezone:  'Asia/Kolkata',
    ayanamsa:  'lahiri',         // default
  },
  'en',  // locale
);

console.log(chart.ascendant.sign);             // "Aries"
console.log(chart.planets_data[0].name);       // "Sun"
console.log(chart.dasha[0].lord);              // Current Mahadasha lord
console.log(chart.d9_chart.asc_sign);          // D9 ascendant sign id (1-12)
console.log(chart.kalsarpa.present);           // true/false
console.log(chart.ashtakavarga.sav);           // [12 SAV totals per sign]
```

### Hindi / Tamil output

```typescript
const panchang = await computeDetailedPanchang(
  '2026-07-04', 13.083, 80.270, 'Asia/Kolkata', 'ta'
);
console.log(panchang.vara.sanskrit);           // "சனிவாரம்"
console.log(panchang.panchang.nakshatra?.name); // Tamil nakshatra name
```

## API Reference

### `computeDetailedPanchang(date?, latitude, longitude, timezone?, locale?)`

Returns a `Promise<PanchangResponse>`. All time strings are UTC ISO-8601.

| Parameter   | Type     | Default     | Description                         |
|-------------|----------|-------------|-------------------------------------|
| `date`      | `string` | today       | `YYYY-MM-DD`                        |
| `latitude`  | `number` | `0`         | Geographic latitude (−90 to 90)     |
| `longitude` | `number` | `0`         | Geographic longitude (−180 to 180)  |
| `timezone`  | `string` | `'UTC'`     | IANA timezone identifier            |
| `locale`    | `Locale` | `'en'`      | `'en'`, `'hi'`, or `'ta'`           |

Throws `PanchangError` with codes: `INVALID_DATE`, `INVALID_LOCATION`, `CALCULATION_FAILED`, `EPHEMERIS_ERROR`.

### `computeChart(birthInfo, locale?)`

Returns a `Promise<ChartResponse>`.

```typescript
interface BirthInfo {
  date:       string;      // YYYY-MM-DD
  time:       string;      // HH:MM (24-hour, local time)
  latitude:   number;
  longitude:  number;
  timezone?:  string;      // IANA, defaults to 'UTC'
  ayanamsa?:  AyanamsaId;  // defaults to 'lahiri'
}
```

**Supported ayanamsas**: `lahiri`, `kp_new`, `kp_old`, `raman`, `kp_khullar`, `sayan`, `manoj`

Throws `ChartError` with codes: `INVALID_BIRTH_INFO`, `CALCULATION_FAILED`, `EPHEMERIS_ERROR`.

## Configuration

### Ephemeris engine

The engine is `@swisseph/browser` (WebAssembly). `init()` is async and should be
awaited once before calling the calculation functions (the public `compute*`
functions auto-initialize):

```typescript
import { EphemerisService } from 'vedic-panchanga';

const ephe = EphemerisService.getInstance();
await ephe.init({ ayanamsa: 'lahiri' }); // default
```

If you never call `init()` yourself, `computeDetailedPanchang()` / `computeChart()`
initialize the engine (with the default `lahiri` ayanamsa) on first use.

### Timezone

Unlike the Python backend, this library has **no built-in coordinate-to-timezone lookup**. Pass the IANA timezone string explicitly. If you need automatic resolution, use a package like [`geo-tz`](https://www.npmjs.com/package/geo-tz):

```typescript
import { find } from 'geo-tz';
const [timezone] = find(lat, lon);
```

## Locale system

All three locales are bundled and resolved at runtime:

```typescript
import { getLocaleTable, resolveName } from 'vedic-panchanga';

const table = getLocaleTable('ta');
console.log(table.nakshatras[0]); // "அஸ்வினி"

const name = resolveName(0, 'nakshatras', 'hi');
console.log(name); // "अश्विनी"
```

## Architecture

```
src/
├── index.ts               # Public barrel export
├── types.ts               # All TypeScript interfaces + error classes
├── locales/               # en, hi, ta locale tables
├── constants/             # Lookup tables (BAV rules, dashas, muhurta tables, etc.)
├── ephemeris/             # Swiss Ephemeris adapter (@swisseph/browser WASM wrapper)
├── calculations/          # Pure calculation modules
│   ├── bisection.ts       # Angular boundary search engine
│   ├── panchang.ts        # Tithi/nakshatra/yoga/karana index + sequence generators
│   ├── sunrise.ts         # Rise/set times + Udaya Lagna
│   ├── muhurta.ts         # Auspicious/inauspicious timing windows
│   ├── vargas.ts          # D1–D60 divisional charts
│   ├── dasha.ts           # Vimshottari dasha
│   ├── ashtakavarga.ts    # BAV + SAV
│   ├── placements.ts      # Special planetary placements
│   ├── jaimini.ts         # Chara karakas
│   ├── relationships.ts   # Planetary friendships
│   ├── aspects.ts         # Graha drishti
│   ├── kalsarpa.ts        # Kalsarpa yoga
│   ├── gowri.ts           # Gowri Panchangam
│   ├── hora.ts            # Planetary hora
│   ├── nalla-neram.ts     # Nalla Neram
│   ├── calendars.ts       # Multi-calendar conversions
│   ├── tyajyam/           # 10 tyajyam types
│   └── ganda-mula-ravi-yoga.ts
└── api/
    ├── get-panchang.ts    # computeDetailedPanchang() orchestration
    └── calculate.ts       # computeChart() orchestration
```

## Development

```bash
npm run build        # Compile TypeScript → dist/
npm test             # Run Vitest test suite
npm run lint         # ESLint
npm run format       # Prettier
npm run test:watch   # Watch mode
```

## License

MIT, aside from the bundled Swiss Ephemeris. `@swisseph/browser` (and the Swiss Ephemeris `swisseph.wasm` sidecar) is distributed under the [AGPL-3.0 license](https://www.gnu.org/licenses/agpl-3.0.html) by Astrodienst. If you use this package in a server or network service, the Swiss Ephemeris AGPL terms may apply to your distribution.
