# DrikPanchang Parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `vpv-panchangam` reproduce DrikPanchang's day-panchang values (calendar eras, lunar month, muhurta/sandhya windows, varjyam/amrit kalam, moonrise/moonset, Tamil calendar) as the library's default behavior, verified against committed offline fixtures captured from drikpanchang.com.

**Architecture:** Two workstreams. (1) A small capture tool fetches a fixed matrix of drik day-panchang pages once, parses the server-rendered DOM into typed JSON, and commits only the JSON under `test/fixtures/drik/`. A parity test suite replays that JSON through the public API and asserts field-by-field equality, so the suite runs fully offline. (2) Targeted fixes in `src/calculations/calendars.ts`, `src/calculations/muhurta.ts`, `src/constants/muhurta.ts`, `src/api/get-panchang.ts`, and `src/ephemeris/browser.ts`, each landed test-first and gated by the parity suite.

**Tech Stack:** TypeScript, Vitest 2, Node 18+ global `fetch` (capture only), Swiss Ephemeris WASM (`src/ephemeris/browser.ts`), Lahiri ayanamsa.

---

## Background: what is wrong today

Reference comparison for `2026-10-16`, Suwanee GA (34.0514 N, −84.0711 W, `America/New_York`, EDT, Lahiri). Our current values are from `dist/index.js` (run `node /private/var/folders/18/1kxryyzs0hv1lkg16rxwdp8c0000gn/T/opencode/compare.js`).

| Field | Ours | Drik | Cause |
|---|---|---|---|
| Shaka Samvat | 1949 (Plavanga) | 1948 (Parabhava) | Shaka boundary is Chaitra Shukla 1, not Mesha ingress |
| Vikram Samvat | 2084 (Raudra) | 2083 (Siddharthi) | follows Shaka |
| Gujarati Samvat | 2083 | 2082 | follows Vikram; rolls at Kartik Shukla 1, not Vikram−1 always |
| Kaliyuga | 5128 | 5127 | should be Shaka + 3179 |
| Chandramasa (purnimanta) | Kartika | Ashwina | during Shukla, purnimanta == amanta |
| Brahma Muhurta | 04:30–06:06 | 06:01–06:52 | should be last two *night* muhurtas |
| Pratah Sandhya | 07:42–08:27 | 06:26–07:42 | should be `[sunrise − 1.5·nightMuh, sunrise]` |
| Sayahna Sandhya | 18:15–19:00 | 19:01–20:17 | should be `[sunset, sunset + 1.5·nightMuh]` |
| Vijaya Muhurta | 17:30–18:15 | 15:15–16:00 | should be day muhurta #11 |
| Godhuli | 18:36–19:24 | 19:01–19:26 | should be `[sunset, sunset + nightMuh/2]` |
| Varjyam | 23:10–23:37 + 03:15–03:27 | 22:29–00:17 (Oct 17) | duration/offset/membership wrong |
| Amrit Kalam | 13:58–14:24 + 06:33–06:45 | 17:05–18:53 | offset wrong |
| Moonrise | 13:28 | 13:34 | moonrise definition (5–6 min) |
| Moonset | 23:03 | 22:58 | moonset definition (5–6 min) |
| Sunrise / Sunset | 07:42 / 19:00 | 07:42 / 19:01 | ≤1 min — within tolerance |
| Tithi / Nakshatra / Karana / Yoga / Abhijit / Rahu / Yamaganda / Gulika / Dur Muhurtam | — | — | already within ≤1 min |

### Facts established during investigation (do not re-derive)

- **drik URL contract:** `https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=<id>&date=DD/MM/YYYY`. The site is server-rendered. Plain `curl` gets `403`; a browser `User-Agent` works.
- **Muhurta formulas (confirmed on two locations — Suwanee GA and New Delhi, 2026-10-16).** Let `D = sunset − sunrise`, `dayMuh = D/15`; let `N = nextSunrise − sunset`, `nightMuh = N/15`; `wins = muhurtaWindows(sunrise, sunset, nextSunrise)` is 1-indexed (`wins[1..15]` day, `wins[16..30]` night):
  - Brahma Muhurta = `[sunset + 13·nightMuh, sunset + 15·nightMuh]` = `wins[29][0] .. wins[30][1]`.
  - Pratah Sandhya = `[sunrise − 1.5·nightMuh, sunrise]`.
  - Sayahna Sandhya = `[sunset, sunset + 1.5·nightMuh]`.
  - Vijaya Muhurta = `wins[11]` (day muhurta #11).
  - Godhuli = `[sunset, sunset + nightMuh/2]`.
  - Abhijit = `wins[8]`, Nishita = `wins[23]`, Rahu/Yamaganda/Gulika/Dur Muhurtam = existing tables → **already correct, do not touch**.
- **Samvat boundaries (confirmed by fetching drik 2026-03-18 vs 2026-03-19):** The Shaka/Vikram/Kali year increments on **Chaitra Shukla Pratipada**. On 2026-03-18 drik shows Vikram 2082 / Shaka 1947 / Kaliyuga 5126 / samvatsara `Kalayukta`; on 2026-03-19 it shows Vikram 2083 / Shaka 1948 / Kaliyuga 5127 / `Siddharthi` — even though at sunrise on 03-19 the tithi is still `Amavasya` (ends 06:52 AM). So the boundary is the **new moon (amavasya end) that precedes the Mesha sankranti**, and the year flips on the day that contains it.
- **Samvatsara name formulas are already correct:** `names[(shakaYear+11)%60]` → `Parabhava` for 1948 ✓; `names[(vikramYear+9)%60]` → `Siddharthi` for 2083 ✓, `Kalayukta` for 2082 ✓. Fixing the year numbers fixes the names. No offset change.
- **Gujarati:** rolls at **Kartik Shukla 1** (≈ Diwali). On 2026-03-18, 2026-03-19, 2026-10-16 drik all show Gujarati 2082 while Vikram is 2082→2083. So Gujarati = Vikram − 1 during `[Chaitra Shukla 1, Kartik Shukla 1)`, else Vikram.
- **Kali year = Shaka + 3179** (1948 + 3179 = 5127 ✓; 1947 + 3179 = 5126 ✓). `kali_ahargana_days` already matches (1872864) — leave it.
- **Amanta lunar month must be derived from the new moon, not the current sun sign.** On 2026-03-18 (Krishna paksha) drik shows amanta **Phalguna**; our sun-sign rule (sun in sidereal Meena → `CHANDRA_MASA_BY_SUNSIGN[11]`) yields **Chaitra** — wrong. Rule that fits all sampled dates: `amantaIdx = (sidereal sign of Sun at the last new moon) % 12` over `["Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin","Kartika","Margashirsha","Pausha","Magha","Phalguna"]` (0 = Chaitra; Meena = 12 → 0). On 2026-10-16 the last new moon is 2026-10-11, Sun in Kanya → `Ashwin` ✓.
- **Purnimanta rule:** during Shukla paksha `purnimanta = amanta`; during Krishna paksha `purnimanta = amanta + 1 month`. Fit: 2026-10-16 Shukla, amanta Ashwin → purnimanta Ashwin ✓ (ours gave Kartika). 2026-03-18 Krishna, amanta Phalguna → purnimanta Chaitra ✓ (drik).
- **Varjyam / Amrit (partially established — must be fitted from the sweep).** Amrit Kalam is **nakshatra-anchored and identical across locations** (Delhi and Kelowna both show `21:05–22:53 UT` on 2026-10-16). Duration is `span/15 ∈ ~1.75 h` (Mula: 108 min). Varjyam windows are listed per-location only because each location shows the global windows that fall inside its `[sunrise, nextSunrise)` day; the underlying instants are global. For Mula, **one** window ends exactly at the nakshatra end (Suwanee `22:29–00:17 EDT` = `02:29–04:17 UT` = `nakEnd − span/15 .. nakEnd`), which equals `nakStart + 56/60·span` — i.e. the existing `VARJYAM_GHATIKAS[18] = 56` with `duration = span/15`. drik lists **additional** windows per day, so the exact rule is fitted in Phase 4 rather than assumed.
- **Moonrise/moonset:** `calculateAltitude` in `src/ephemeris/browser.ts` already applies a lunar parallax correction and uses `ALT0_MOON = −0.5667 − 0.2583 = −0.825°`. The committed `dist/` may predate that change; Task 4.1 rebuilds and re-measures before changing anything.
- **Timezone:** the library takes an IANA tz string and never resolves coordinates → tz. All result times are UTC ISO-8601; drik's page shows local wall-clock times. Fixtures store local times + the fixture's IANA tz so tests can compare on the same clock.

---

## Scope

**In scope:** calendar eras (Shaka/Vikram/Kali/Gujarati + samvatsara names), amanta/purnimanta lunar month, the five muhurta/sandhya windows, varjyam + amrit kalam windows, moonrise/moonset (best effort, no release gate), Tamil calendar parity.

**Out of scope / non-goals:** kundali/chart output, ayanamsa changes, drik UI/festival pages, any public API shape change (field names and types stay identical), `national_nirayana_date` (niche; revisit only if trivially fixed by the Shaka change). Do **not** commit raw drik HTML — only parsed JSON.

**Anti-goals:** no new dependencies; no network access in `npm test`; no opt-in flag (drik behavior is the default).

---

## File map

- Create `scripts/capture-drik-fixtures.mjs` — politeness-spaced fetcher + parser; writes JSON to `test/fixtures/drik/pages/`.
- Create `test/fixtures/drik/manifest.json` — the location/date matrix + capture metadata.
- Create `test/fixtures/drik/pages/<slug>.json` — one committed, parsed reference per page.
- Create `test/drik-parity.test.ts` — replays fixtures through `computeDetailedPanchang`, asserts per-field equality.
- Create `test/drik-helpers.ts` — tz-aware time parsing/formatting + comparison helpers used by the suite.
- Modify `src/constants/calendars.ts` — add amanta month list derived from `CHANDRA_MASA_BY_SUNSIGN`.
- Modify `src/calculations/calendars.ts` — new-moon helper, amanta/purnimanta, year boundaries, Gujarati, Kali; `computeTamilCalendar` accepts corrected `shakaYear`.
- Modify `src/constants/muhurta.ts` — varjyam/amrit durations + amrit offset.
- Modify `src/calculations/muhurta.ts` — brahma/pratah/sayahna/vijaya/godhuli; varjyam/amrit bodies.
- Modify `src/api/get-panchang.ts` — updated call signatures; window-membership filter; Tamil call.
- Modify `src/ephemeris/browser.ts` — only if Task 4.1 shows residual moonrise/moonset drift.
- Modify `package.json` version → `0.5.0`.
- Modify `test/muhurta-gowri-hora.test.ts` — update tests that encode the old brahma/varjyam conventions.
- Modify `README.md` — note drik-convention defaults + the fixture workflow.

---

# Phase 0 — Offline fixtures + parity harness

> Gate for every later task. Phase 0 ships only tooling + committed JSON + a suite whose assertions start as `it.todo`/loose and become strict as phases land.

### Task 0.1: Resolve geoname-ids and freeze the fixture manifest

**Files:**
- Create: `test/fixtures/drik/manifest.json`

- [x] Add a manifest listing the matrix. Locations must be addressed by drik geoname-id (drik has no lat/lon URL form that survived probing):

```json
{
  "capturedAt": null,
  "source": "https://www.drikpanchang.com/panchang/day-panchang.html",
  "locations": [
    { "slug": "new-delhi",  "geonameId": 1261481, "timezone": "Asia/Kolkata",      "latitude": 28.6139,  "longitude": 77.2090 },
    { "slug": "chennai",    "geonameId": 1264527, "timezone": "Asia/Kolkata",      "latitude": 13.0827,  "longitude": 80.2707 },
    { "slug": "london",     "geonameId": 2643743, "timezone": "Europe/London",     "latitude": 51.5074,  "longitude": -0.1278 },
    { "slug": "kelowna",    "geonameId": 5990579, "timezone": "America/Vancouver", "latitude": 49.8880,  "longitude": -119.4960 },
    { "slug": "suwanee-ga", "geonameId": null,    "timezone": "America/New_York","latitude": 34.0514,  "longitude": -84.0711, "TODO": "resolve geoname-id via drik search/autocomplete and assert the page title contains 'Suwanee'" }
  ],
  "dates": ["2026-01-15", "2026-03-18", "2026-03-19", "2026-04-14", "2026-10-16", "2026-11-09"]
}
```

- [x] Resolve the Suwanee geoname-id empirically: fetch `.../day-panchang.html?geoname-id=<candidate>&date=16/10/2026`, extract the `<title>`/H1, and pick the id whose page title resolves to Suwanee, Georgia. Record it in the manifest. (Candidate `4229956` returned a page whose varjyam matched New Delhi — treat it as wrong until the title proves otherwise.)
- [x] Verify each location's resolved name by asserting the page H1 contains the expected city before capture (the capture script enforces this).
- [x] Commit: `test(drik): add drik fixture capture manifest`.

### Task 0.2: Write the capture + parse script

**Files:**
- Create: `scripts/capture-drik-fixtures.mjs`

- [x] Implement the fetcher with a browser User-Agent and a politeness delay (≥1.5 s between requests), and a hard cap on requests per run. Reuse a single run to fetch everything in the matrix. Do **not** use `curl` (403).

```js
// scripts/capture-drik-fixtures.mjs  (capture tooling — never run by `npm test`)
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://www.drikpanchang.com/panchang/day-panchang.html";
const OUT = resolve("test/fixtures/drik/pages");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripTags(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
```

- [x] Implement `parseDrikPage(html, { timezone })`, returning the reference object below. Use **label → following text** extraction on the tag-stripped string, taking the *last* occurrence of the label (the nav menu repeats several labels). Times are `h:mm AM/PM` in the page's local tz; store both the raw string and `localISO` (`2026-10-16T15:47:00`).

```ts
interface DrikReference {
  slug: string; date: string; timezone: string; locationName: string;
  sunrise: string; sunset: string; moonrise: string | null; moonset: string | null;
  tithi: { name: string; endsAt: string | null; next: string | null };
  nakshatra: { name: string; endsAt: string | null; next: string | null };
  yoga: { name: string; endsAt: string | null; next: string | null };
  karana: { name: string; endsAt: string | null; next: string | null };
  paksha: string; vara: string;
  vikramSamvat: number; vikramName: string;
  shakaSamvat: number; shakaName: string;
  gujaratiSamvat: number;
  chandramasaPurnimanta: string; chandramasaAmanta: string;
  kaliyugaYears: number;
  windows: {
    brahmaMuhurta: string | null; pratahSandhya: string | null;
    abhijit: string | null; vijayaMuhurta: string | null; godhuli: string | null;
    sayahnaSandhya: string | null; amritKalam: string[]; nishita: string | null;
    rahuKalam: string | null; yamaganda: string | null; gulikai: string | null;
    varjyam: string[]; durMuhurtam: string[];
  };
  raw: Record<string, string>; // label -> raw text, for debugging/regeneration
}
```

- [x] A window string may carry a rollover date, e.g. `"10:29 PM to 12:17 AM , Oct 17"`. Normalise to `{ start: "22:29", end: "00:17+1" }` (or store the raw and parse in `test/drik-helpers.ts`). Capture **all** windows for `varjyam`, `amritKalam`, `durMuhurtam` (drik can list more than one).
- [x] Write one file per page at `test/fixtures/drik/pages/<slug>-<YYYY-MM-DD>.json` and stamp `manifest.json` `capturedAt`.
- [x] Commit: `feat(drik): add drik day-panchang capture/parse script`.

### Task 0.3: Capture and commit fixtures

**Files:**
- Create: `test/fixtures/drik/pages/*.json`, update `test/fixtures/drik/manifest.json`

- [x] Run: `node scripts/capture-drik-fixtures.mjs` (≈30 pages: 5 locations × 6 dates; ~90 s with spacing).
- [x] Sanity-check the output: for `new-delhi` / `2026-10-16` assert `shakaSamvat === 1948`, `chandramasaAmanta === "Ashwina"`, `chandramasaPurnimanta === "Ashwina"`, `kaliyugaYears === 5127`, `brahmaMuhurta === "04:42 AM to 05:32 AM"`. For `new-delhi` / `2026-03-18` assert `vikramSamvat === 2082`, and `2026-03-19` assert `2083`.
- [x] **Committed artifacts are JSON only.** Confirm no `.html` is staged (`git status`).
- [x] Commit: `test(drik): capture 2026 reference matrix from drikpanchang`.

> **Fixture budget note:** this is ~30 pages, matching the approved estimate. Phase 4 (varjyam/amrit) may need a **full nakshatra sweep** (New Delhi, 2026-10-01..10-31, 31 pages). Add it in Task 4.3 only if the fit needs it, and re-confirm with the user before expanding the capture.

### Task 0.4: Parity harness (loose, then strict)

**Files:**
- Create: `test/drik-helpers.ts`
- Create: `test/drik-parity.test.ts`

- [x] In `test/drik-helpers.ts` export `loadFixtures()` (reads `manifest.json` + pages), `localHm(isoUtc, tz)` (→ `"HH:MM"`), `localDay(isoUtc, tz)` (→ `"YYYY-MM-DD"`), `parseWindow(raw, tz, date)` (→ `{ startUtc, endUtc }`), and `minuteDelta(a, b)`.
- [x] Write the suite: for each fixture, call
  `computeDetailedPanchang(date, lat, lon, tz, "en")` and assert the fields below. Introduce a module-level `const TOL_MIN = 1` and a helper `expectHm(actualIso, expectedRaw, tz)` that compares wall-clock `HH:MM` with a `TOL_MIN` minute tolerance, rolling a `+1 day` marker when the fixture window crosses midnight.
- [x] Fields asserted strictly (exact): `panchang.paksha`, `lunar_month.chandramasa_amanta`, `lunar_month.chandramasa_purnimanta`, `lunar_month.shaka_samvat`, `lunar_month.vikram_samvat`, `lunar_month.gujarati_samvat`, `lunar_month.samvatsara_shaka`, `lunar_month.samvatsara_vikram`, `calendars.kali_year`, `panchang.tithi.name`, `panchang.nakshatra.name`, `panchang.yoga.name`, `panchang.karana.name`, `vara`.
- [x] Fields asserted with `TOL_MIN`-minute tolerance: `sun_moon.sunrise/sunset/moonrise/moonset`, all single windows, all array windows (compare as ordered sets by start time).
- [x] At this point the suite **fails** on the mismatched fields. That is the target. To keep `main` green while tasks land, gate the not-yet-fixed assertions with `it.todo` and flip each to `it` in its phase. Do not delete assertions.
- [x] Fold `moonrise`/`moonset` into a `describe` tagged with `it` but **not** part of any release gate (comment this explicitly in the file).
- [x] Commit: `test(drik): add offline drik parity harness`.

---

# Phase 1 — Calendar eras and lunar month

### Task 1.1: New-moon + sankranti helpers

**Files:**
- Modify: `src/calculations/calendars.ts`
- Test: `test/calendars-drik.test.ts` (new)

- [x] Add helpers (module-private unless a test needs them):

```ts
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
function sankrantiInMonth(year: number, month: number, signId: number, ephe: EphemerisService): number {
  const lo = dateToJd(year, month, 1, ephe) - 5;
  const hi = dateToJd(year, month, 28, ephe) + 5;
  const target = (signId - 1) * 30;
  return findAngleTime(lo, hi, target, (t) => ephe.calcUt(t, SE.SUN, SIDEREAL_FLAGS()).lon)
    ?? dateToJd(year, month, 15, ephe);
}
/** Chaitra Shukla Pratipada instant for the Shaka year that begins in Gregorian `year`. */
export function chaitraShukla1Jd(year: number, ephe: EphemerisService): number {
  const mesha = sankrantiInMonth(year, 4, 1, ephe); // Sun enters Aries in April
  return lastNewMoonBefore(mesha, ephe);
}
/** Kartik Shukla Pratipada instant (≈ Diwali) in Gregorian `year`. */
export function kartikShukla1Jd(year: number, ephe: EphemerisService): number {
  const vrischika = sankrantiInMonth(year, 11, 8, ephe); // Sun enters Scorpio in November
  return lastNewMoonBefore(vrischika, ephe);
}
```

- [x] Test (`test/calendars-drik.test.ts`): for `2026`, assert `chaitraShukla1Jd(2026)` lands on **2026-03-19** local IST (the new moon ends ~06:52 AM IST; assert the JD's Gregorian date is 2026-03-19), and `kartikShukla1Jd(2026)` lands on **2026-11-09** (Diwali/next day; assert the date, then tighten to the fixture's stated Kartik Shukla 1 once Task 0.3 has it — the `2026-11-09` fixture should show amanta Kartika and gujarati == vikram).
- [x] Run: `npx vitest run test/calendars-drik.test.ts` → expect pass.
- [x] Commit: `feat(calendars): add new-moon and sankranti helpers`.

### Task 1.2: Amanta + purnimanta from the new moon

**Files:**
- Modify: `src/constants/calendars.ts`, `src/calculations/calendars.ts`
- Test: `test/calendars-drik.test.ts`

- [x] Add to `src/constants/calendars.ts` (reuses the existing spellings, e.g. `"Ashwin"`, to avoid an API rename):

```ts
// Ordered Chaitra..Phalguna (index 0 = Chaitra). Derived from CHANDRA_MASA_BY_SUNSIGN so
// the existing string spellings ("Ashwin") are preserved.
export const AMANTA_MONTHS = [
  CHANDRA_MASA_BY_SUNSIGN[11], // Chaitra
  ...CHANDRA_MASA_BY_SUNSIGN.slice(0, 11), // Vaishakha .. Phalguna
];
```

- [x] In `computeCalendars`, replace lines 111–114 with:

```ts
// Amanta lunar month = the month begun by the last new moon, named by the Sun's
// sidereal sign at that new moon (Meena → Chaitra). Purnimanta = amanta during
// Shukla paksha, next month during Krishna paksha.
const lastNm = lastNewMoonBefore(jd, ephe);
const sunSignAtNm = signIdFromLon(ephe.calcUt(lastNm, SE.SUN, SIDEREAL_FLAGS()).lon); // 1..12
const amantaIdx = sunSignAtNm % 12;
const chandramasaAmanta = AMANTA_MONTHS[amantaIdx];
const chandramasaPurnimanta =
  tithiIdx <= 15 ? chandramasaAmanta : AMANTA_MONTHS[(amantaIdx + 1) % 12];
```

- [x] Import `AMANTA_MONTHS`. Leave `nirayana_solar_month` (sun-sign based) unchanged.
- [x] Test: `2026-10-16` New Delhi → amanta `Ashwin`, purnimanta `Ashwin`; `2026-03-18` → amanta `Phalguna`, purnimanta `Chaitra`; `2026-03-19` → amanta `Chaitra`, purnimanta `Chaitra`.
- [x] Run: `npx vitest run test/calendars-drik.test.ts test/panchang.test.ts` → expect pass (fix any existing test that pinned the old purnimanta).
- [x] Flip the amanta/purnimanta `it.todo`s in `test/drik-parity.test.ts` to `it`.
- [x] Commit: `fix(calendars): derive amanta/purnimanta from the new moon (drik parity)`.

### Task 1.3: Shaka boundary, Vikram, Kali

**Files:**
- Modify: `src/calculations/calendars.ts`
- Test: `test/calendars-drik.test.ts`

- [x] Replace lines 87–94 (the `afterMeshaIngress` block and `kaliYear`) with:

```ts
const [gregYear] = ephe.revjul(jd);
// Shaka year increments on Chaitra Shukla Pratipada (new moon before Mesha sankranti).
const chaitraThis = chaitraShukla1Jd(gregYear, ephe);
const shakaYear = jd >= chaitraThis ? gregYear - 78 : gregYear - 79;
// Vikram Samvat = Shaka + 135
const vikramYear = shakaYear + 135;
// Kali year = Shaka + 3179
const kaliYear = shakaYear + 3179;
```

- [x] Remove the now-dead `kaliYear = Math.floor(kaliAhargana/365.25)+1` line; keep `kaliAhargana`.
- [x] Test: `2026-10-16` → shaka 1948 / vikram 2083 / kali 5127; `2026-03-18` → 1947 / 2082 / 5126; `2026-03-19` → 1948 / 2083 / 5127; `2026-01-15` → 1947 / 2082 / 5126; `2027-02-01` → 1948 / 2083 / 5127. Assert `samvatsara_shaka === "Parabhava"` and `samvatsara_vikram === "Siddharthi"` for the Oct date.
- [x] Run: `npx vitest run test/calendars-drik.test.ts test/panchang.test.ts`.
- [x] Flip the Shaka/Vikram/Kali/samvatsara `it.todo`s.
- [x] Commit: `fix(calendars): Shaka/Vikram/Kali boundaries follow Chaitra Shukla Pratipada`.

### Task 1.4: Gujarati boundary

**Files:**
- Modify: `src/calculations/calendars.ts`
- Test: `test/calendars-drik.test.ts`

- [x] Replace line 97 with:

```ts
// Gujarati Samvat = Vikram − 1 between Chaitra Shukla 1 and Kartik Shukla 1; else Vikram.
const chaitraPrev = chaitraShukla1Jd(gregYear - 1, ephe);
const kartikThis = kartikShukla1Jd(gregYear, ephe);
const kartikPrev = kartikShukla1Jd(gregYear - 1, ephe);
const lastChaitra = jd >= chaitraThis ? chaitraThis : chaitraPrev;
const lastKartik = jd >= kartikThis ? kartikThis : kartikPrev;
const gujaratiYear = lastChaitra > lastKartik ? vikramYear - 1 : vikramYear;
```

- [x] Test: `2026-10-16` → 2082; `2026-03-18` and `2026-03-19` → 2082; `2026-11-09` → 2083; `2026-02-01` → 2082; `2027-01-15` → 2083.
- [x] Run + flip Gujarati `it.todo`. Commit: `fix(calendars): Gujarati Samvat rolls at Kartik Shukla Pratipada`.

### Task 1.5: `national_civil_date` uses the solar national Saka year

**Files:**
- Modify: `src/calculations/calendars.ts`, `src/api/get-panchang.ts`
- Test: `test/calendars-drik.test.ts`

- [x] **Corrected 2026-10-17 (fixture evidence).** The original assumption — that the national
      civil date should consume Task 1.3's *lunar* `shakaYear` — is wrong. drik's `National Civil
      Date` is the **solar** Indian National Calendar: it rolls at Chaitra 1 (Mar 22, or Mar 21 in
      leap years), not at the lunar Chaitra Shukla Pratipada. The fixtures prove it: 2026-03-19 →
      `Phalguna 28, 1947 Shaka` (the lunar shaka is already 1948 that day); 2026-03-18 →
      `Phalguna 27, 1947`. Feeding the lunar year to `computeNationalCivilDate` mislabels Mar 19–21
      (1948 vs 1947) and returns the `Phalguna 30` fallback for Mar 22 → early Apr in late-boundary
      years (2027's lunar boundary is 2027-04-06 23:51 UT).
- [x] Derive the national year independently and pass it to both `computeNationalCivilDate` calls:
      `const nationalShakaYear = gregMonth > 3 || (gregMonth === 3 && gregDay >= (isGregorianLeap(gregYear) ? 21 : 22)) ? gregYear - 78 : gregYear - 79;`
      Return it as `nationalCivilDate.shakaYear` / `nationalNirayanaDate.shakaYear`. Keep the lunar
      `shakaYear` for every lunar field.
- [x] `src/api/get-panchang.ts:524–533` reports `shaka_year: calInfo.shakaYear` (lunar) for both
      national dates; report each struct's own `shakaYear` instead.
- [x] Leave the `national_nirayana_date` month logic unchanged (out of scope); `_nirayana` is unused,
      so both national dates coincide today — add a comment noting that known open delta.
- [x] Assert against the captured ground truth (`raw["National Civil Date"]`) for all six dates on
      New Delhi, plus `2027-03-22` → Chaitra 1, 1949 and `2027-04-05` → Chaitra 15, 1949 (the
      late-boundary year that currently hits the fallback). Also fix the stale comment in
      `test/calendars-drik.test.ts` that calls the 2027 boundary "2027-03-19" (it is 2027-04-06).
- [x] Commit: `fix(calendars): national civil date uses the solar Saka year`.

---

# Phase 1B — Limb name/value parity (found by the Phase 0 harness)

*Added 2026-10-17 after a per-field inventory over all 30 fixtures (the grouped
`it()` blocks in the parity suite mask partial progress). These mismatches are
required by this plan's own verification criteria — criterion 2 names
`paksha`, tithi/nakshatra/yoga/karana names and `vara`; criterion 3 names
sunrise/sunset — but the original plan had no tasks for them. User ruling
(2026-10-17): "Fix everything to match drik" (adopt drik's transliterations).*

### Task 1.6: Fix the locale tithi tables (Krishna Chaturdashi / Amavasya)

**Files:**
- Modify: `src/locales/en.ts`, `src/locales/hi.ts`, `src/locales/ta.ts`
- Modify: `test/calendars-drik.test.ts` (or the parity suite's limb-name test)

- [x] Root cause: `get-panchang.ts` looks up `table.tithis[i]` with the **1-based**
      tithi index (1..30), but each locale's `tithis` array has only **30** entries
      (indices 0..29): index 0 is `""`, index 15 is "Purnima", index 29 is
      "Amavasya". So tithi #29 is wrongly named "Amavasya" and tithi #30 falls back
      to the literal `"Tithi 30"`. The array is **missing the Krishna-Chaturdashi
      entry** at position 29.
- [x] Append the missing entry so the array has **31** entries with index 30 =
      "Amavasya": `en` "Chaturdashi", `hi` "चतुर्दशी", `ta` "சதுர்த்தசி". Do not
      touch the `Ashwini` nakshatra or any other locale key.
- [x] Verify against the fixtures: `panchang.tithi.name` on 2026-03-18 must be
      "Chaturdashi" (not "Amavasya"), and on 2026-03-19 / 2026-11-09 must be
      "Amavasya" (not "Tithi 30"). `npm test` stays green.
- [x] Commit: `fix(locales): add the missing Krishna Chaturdashi tithi name`.

### Task 1.7: Derive `paksha` from the sunrise tithi

**Files:**
- Modify: `src/api/get-panchang.ts` (~line 262)
- Modify: `src/calculations/calendars.ts` (~line 186)

- [x] `get-panchang.ts` still computes `paksha` from `tithiIndex(sunLon, moonLon)`
      where `sunLon`/`moonLon` are evaluated at **noon** (line ~149–156). Derive it
      from the tithi at **sunrise** instead: `tithiNow` (= `tithiSeq[0]`, the tithi
      active at `winStart` = sunrise). Shukla for index ≤ 15, else Krishna.
- [x] `calendars.ts` `computeCalendars` (~line 186) repeats the same bug: it uses
      the noon `tithiIdx` for `lunar_month.paksha`, even though line ~174 already
      computes the sunrise tithi index. Use the sunrise index for `paksha`.
- [x] `panchang.paksha` and `lunar_month.paksha` must agree. Verify on the fixture
      Amavasya days (2026-03-19, 2026-11-09) that both read "Krishna Paksha".
- [x] Leave `pravishte_day` / `tithi.pravishte` on the noon index (not asserted).
- [x] Commit: `fix(panchang): derive paksha from the sunrise tithi`.

### Task 1.8: Adopt drik's spellings for vara and karana

**Files:**
- Modify: `src/locales/en.ts` (`varas`), `src/constants/panchang.ts`
      (`karanaName`, `MOVABLE_KARANA_NAMES`, fixed-karana branches),
      `src/constants/muhurta.ts` (`INAUSPICIOUS_KARANAS`)
- Add/extend assertions in `test/calendars-drik.test.ts`

- [x] `vara.sanskrit`: change all seven weekday names from the `-vara` ending to
      drik's `-wara` ending (Soma/Budha/Guru/Shukra/Mangala occur in the fixtures;
      apply the same rule to Shani/Ravi and note it as inferred). Leave `vara.english`
      and the `hi`/`ta` arrays alone.
- [x] `karana.name`: `Gara` → `Garaja`, `Naga` → `Nagava`, `Kimstughna` →
      `Kinstughna` in `karanaName` and `MOVABLE_KARANA_NAMES`; update
      `INAUSPICIOUS_KARANAS` in `src/constants/muhurta.ts` to `"Nagava"`.
- [x] Do not change the karana **index** arithmetic — only the display names.
- [x] Commit: `refactor(panchang): use drik spellings for vara and karana names`.

### Task 1.9: Reconcile the drik Kelowna 2026-11-09 display anomaly (NO library change)

**Files:**
- Modify: `test/fixtures/drik/pages/kelowna-2026-11-09.json` and/or
      `test/drik-helpers.ts` / `test/drik-parity.test.ts`
- Modify: `docs/superpowers/specs/2026-10-16-drik-parity-design.md` + `README.md`

- [ ] Evidence (verified 2026-10-17): drik's `kelowna-2026-11-09` page renders its
      wall clocks in **PDT (UTC−7)** although Kelowna is **PST (UTC−8)** on that
      date — drik's own `Madhyahna` (12:41) and `Ratimana` (14h40m) are consistent
      only under −7. The library's absolute instants are **correct** (sunrise
      15:01:02Z; independent authority sunrise-sunset.org gives 14:59:29Z, solar
      noon 19:41Z vs the library's 19:41:30Z). Across all 30 fixtures this is the
      **only** offset anomaly (suwanee-ga 11-09 correctly uses −300, london 11-09
      correctly uses 0).
- [ ] Therefore do **not** change `src/`. Reconcile the harness instead: let a
      fixture declare the UTC offset drik actually used for its wall clocks, and
      compare that page in that offset (falling back to the IANA `timezone`). Add
      the offset to the affected fixture with a short comment, or, if a per-page
      offset field is judged too heavy for one page, exclude that single assertion
      with an explicit comment. Either way the parity suite must be green when
      enabled in Phase 6.
- [ ] Document the anomaly in the design doc and README (drik-side defect, not ours).
- [ ] Commit: `test(drik): reconcile the Kelowna 2026-11-09 PDT display anomaly`.

**Known latent limitation (record, do not fix here):** `computeSolarTimes` searches
from `jdNoon − 0.5` = **0h UT** of the date. For locations far east of Greenwich
(roughly UTC+12 and beyond) local sunrise can precede 0h UT, so the search would
return the *next* local day's sunrise. No fixture exercises this; leave the
behaviour unchanged and note it in the ledger.

---

# Phase 2 — Muhurta / sandhya windows

### Task 2.1: Brahma Muhurta = last two night muhurtas

**Files:**
- Modify: `src/calculations/muhurta.ts` (lines 60–77), `src/api/get-panchang.ts` (line 266)
- Test: `test/muhurta-gowri-hora.test.ts`

- [ ] Change the signature and body:

```ts
/** Brahma Muhurta: the 14th and 15th (last two) night muhurtas before sunrise. */
export function brahmaMuhurta(
  sunsetJd: number,
  nextSunriseJd: number,
  ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (nextSunriseJd - sunsetJd) / 15;
  return jdToWin(sunsetJd + 13 * nightMuh, sunsetJd + 15 * nightMuh, ephe);
}
```

- [ ] Update the caller: `const brahma = brahmaMuhurta(sunsetJd, nextSunriseJd, ephe);`
- [ ] Rewrite the `describe("brahmaMuhurta")` tests (current lines 91–113 assume a fixed 96 min): assert `end ≈ nextSunrise − nightMuh`, `start ≈ nextSunrise − 2·nightMuh`, and `start/end` each within 1 min of drik's `04:42–05:32 AM` IST for New Delhi 2026-10-16.
- [ ] Run: `npx vitest run test/muhurta-gowri-hora.test.ts` → pass.
- [ ] Commit: `fix(muhurta): brahma muhurta = last two night muhurtas (drik parity)`.

### Task 2.2: Pratah + Sayahna Sandhya

**Files:**
- Modify: `src/calculations/muhurta.ts` (`pratahSandhya`, `sayahnaSandhya`)

- [ ] Replace `pratahSandhya` body (it currently returns `wins[1]`, the first day muhurta):

```ts
/** Pratah Sandhya: the 1.5 night-muhurtas immediately before sunrise. */
export function pratahSandhya(
  sunriseJd: number, sunsetJd: number, nextSunriseJd: number, ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (nextSunriseJd - sunsetJd) / 15;
  return jdToWin(sunriseJd - 1.5 * nightMuh, sunriseJd, ephe);
}
```

- [ ] Replace `sayahnaSandhya` body (line 128–137: currently returns `wins[15]`, the last day muhurta, ~18:15–19:00):

```ts
/** Sayahna Sandhya: the 1.5 night-muhurtas immediately after sunset. */
export function sayahnaSandhya(
  sunriseJd: number, sunsetJd: number, nextSunriseJd: number, ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (nextSunriseJd - sunsetJd) / 15;
  return jdToWin(sunsetJd, sunsetJd + 1.5 * nightMuh, ephe);
}
```

- [ ] Test on the Kelowna 2018-06-01 fixture (existing `beforeAll`) that both windows have the expected length (`1.5 × night/15`) and sit adjacent to sunrise/sunset; add drik reference assertions for New Delhi 2026-10-16 (`05:07–06:22 AM`, `17:51–19:06`).
- [ ] Run + Commit: `fix(muhurta): pratah/sayahna sandhya use night-muhurta spans`.

### Task 2.3: Vijaya Muhurta and Godhuli

**Files:**
- Modify: `src/calculations/muhurta.ts` (`vijayMuhurta`, `godhuliMuhurta`), `src/api/get-panchang.ts` (line 276)

- [ ] `vijayMuhurta` (line 108–117): change `wins[14]` → `wins[11]` (day muhurta #11) and update its comment. Target: `14:01–14:47 PM` IST New Delhi and `15:15–16:00 PM` Suwanee on 2026-10-16.
- [ ] `godhuliMuhurta` (line 119–126): it currently returns `[sunset − 24 min, sunset + 24 min]`. Change the signature to `(sunsetJd, nextSunriseJd, ephe)` and the body to:

```ts
/** Godhuli: the half night-muhurta after sunset. */
export function godhuliMuhurta(
  sunsetJd: number, nextSunriseJd: number, ephe: EphemerisService,
): TimeWindow {
  const nightMuh = (nextSunriseJd - sunsetJd) / 15;
  return jdToWin(sunsetJd, sunsetJd + nightMuh / 2, ephe);
}
```

- [ ] Update caller: `const godhuli = godhuliMuhurta(sunsetJd, nextSunriseJd, ephe);`
- [ ] Fix any test in `test/muhurta-gowri-hora.test.ts` that calls `godhuliMuhurta(sunsetJd, ephe)`.
- [ ] Run + Commit: `fix(muhurta): vijaya = day muhurta 11, godhuli = half night-muhurta`.

### Task 2.4: Confirm the untouched tables

**Files:**
- Test: `test/drik-parity.test.ts`

- [ ] Flip `abhijit`, `nishita`, `rahu_kalam`, `yamaganda`, `gulika`, `dur_muhurtam` assertions from `it.todo` to `it` (they already pass within 1 min).
- [ ] Commit: `test(drik): lock abhijit/nishita/rahu/yamaganda/gulika/dur muhurtam parity`.

---

# Phase 3 — Varjyam and Amrit Kalam

> Established: amrit is global-nakshatra-anchored; duration scales with the nakshatra span (`span/15`); the existing `VARJYAM_GHATIKAS` offset table already reproduces drik's Mula window that ends at the nakshatra end. The exact set/model is fitted here against fixtures, not assumed.

### Task 3.1: Duration = span/15 (table offsets unchanged for now)

**Files:**
- Modify: `src/constants/muhurta.ts`

- [ ] Set both durations to 4 ghatikas (= `span/15`, since the code treats the nakshatra span as 60 ghatikas):

```ts
export const VARJYAM_DURATION_GHATIKAS = 4; // = span/15 (nakshatra span modeled as 60 ghatikas)
export const AMRIT_KALAM_DURATION_GHATIKAS = 4;
```

- [ ] Commit: `fix(muhurta): varjyam/amrit duration = nakshatra span/15`.

### Task 3.2: Window membership filter

**Files:**
- Modify: `src/api/get-panchang.ts` (lines 280–298)

- [ ] Only keep a window when it intersects the panchang day `[sunriseJd, nextSunriseJd)` (a window may legitimately cross midnight). Do not clip — drik prints the full window with a `, Oct 17` label.

```ts
const inDay = (w: { start: string; end: string }) =>
  new Date(w.start).getTime() < new Date(nextSunriseIso!).getTime() &&
  new Date(w.end).getTime() > new Date(sunriseIso!).getTime();
// push varjyam/amrit windows through inDay(...)
```

- [ ] Commit: `fix(panchang): varjyam/amrit windows limited to the sunrise-to-sunrise day`.

### Task 3.3: Fit the varjyam/amrit offsets against fixtures

**Files:**
- Modify: `src/constants/muhurta.ts`, `src/calculations/muhurta.ts` (`varjyamWindow`, `amritKalamWindow`)
- Test: `test/drik-varjyam.test.ts` (new)

- [ ] Write a fitting test that, for the captured fixtures, compares the ordered set of our varjyam/amrit windows to drik's and prints the per-nakshatra offset error. Use `test/drik-helpers.ts`; run `npx vitest run test/drik-varjyam.test.ts --reporter=verbose`.
- [ ] Confirm the Mula anchor: with the offset table unchanged, our Mula varjyam must equal `nakStart + 56/60·span → 22:29–00:17` Suwanee (matches drik). If it does not, first fix the `nakStartJd` wiring in `get-panchang.ts` (lines 286/293 use `nak.starts_at ?? nak.ends_at`; a `null` `starts_at` silently anchors to the end — that is a real bug; pass the true nakshatra start).
- [ ] Derive the amrit offset from the fixtures: for Mula on 2026-10-16 the value is `44/60` (= `varjyam offset − 12`). Determine whether `amritOffset = (varjyamOffset − 12 + 60) % 60` holds across all sampled nakshatras. If it does, set `AMRIT_OFFSET_GHATIKAS = 48` (i.e. `−12 mod 60`). If it does **not**, replace the derived-constant approach with a per-nakshatra `AMRIT_GHATIKAS` table filled from the fixtures.
- [ ] If the sampled dates do not cover all 27 nakshatras, request user approval to add the 2026-10-01..10-31 New Delhi sweep (Task 0.3 note), then re-run capture.
- [ ] Flip the varjyam/amrit parity assertions to `it`. Commit: `fix(muhurta): fit varjyam/amrit offsets to drik fixtures`.

---

# Phase 4 — Moonrise / Moonset (best effort, no release gate)

### Task 4.1: Rebuild and re-measure before changing anything

**Files:**
- (no source change yet)

- [ ] `npm run build` then `node /private/var/folders/18/1kxryyzs0hv1lkg16rxwdp8c0000gn/T/opencode/compare.js`.
- [ ] If `moonrise`/`moonset` are now within 1 min of drik (`13:34`/`22:58` Suwanee EDT), the committed `dist/` was stale — record this in the commit message and skip Task 4.2.
- [ ] Commit (if a rebuild changes `dist/`): `build: rebuild dist so moonrise/moonset include the parallax fix`.

### Task 4.2: Only if residual drift remains

**Files:**
- Modify: `src/ephemeris/browser.ts` (`ALT0_MOON`, line 62)

- [ ] Drik's Suwanee day has midpoint-symmetric drift vs ours (ours rises early and sets late → our effective horizon is lower). Try `ALT0_MOON = -0.5667` (Moon's centre + refraction, no semidiameter) and re-measure against the fixtures. Pick the value minimizing |Δ| across all fixture locations/dates. Document the convention chosen in a comment.
- [ ] Test: assert moonrise/moonset within 2 min for the captured fixtures; mark the `describe` non-gating in the file.
- [ ] Commit: `fix(ephemeris): tune moonrise/moonset horizon to drik convention`.

### Task 4.3: Document residual drift

- [ ] Add a `README.md` note (and a comment in `sunrise.ts`) recording the chosen convention and any remaining per-location drift, explicitly stating it is not release-gated.
- [ ] Commit: `docs: note moonrise/moonset convention and residual drift`.

---

# Phase 5 — Tamil calendar parity

### Task 5.1: Correct the Tamil year boundary

**Files:**
- Modify: `src/calculations/calendars.ts` (`computeTamilCalendar`, line 302), `src/api/get-panchang.ts` (call at line 376)
- Test: `test/drik-tamil.test.ts` (new)

- [ ] `computeTamilCalendar` currently hardcodes `const shakaYear = gregYear - 78;` (line 302). Add a `shakaYear: number` parameter and use it; drop `gregYear` if unused.
- [ ] Update the caller to pass `calInfo.shakaYear`.
- [ ] From the fixtures establish **which boundary** drik uses for the Tamil year name: the Shaka samvatsara rolls at Chaitra Shukla 1 (Mar 19 in 2026), but the Tamil year (Chithirai 1) rolls at Mesha sankranti (~Apr 14). Capture drik's `/tamil/tamil-panchangam.html?geoname-id=<chennai>&date=...` for 2026-03-18, 2026-03-19, 2026-04-13, 2026-04-15 and record which name flips on which day; encode the observed boundary. Extend the capture script with a `--tamil` mode and commit the extra JSON.
- [ ] Test: `tamil_year` name and `tamil_month` name match drik for the Tamil fixtures; `tamil_date` matches (within the same civil day).
- [ ] Commit: `fix(tamil): correct year boundary and month parity against drik`.

### Task 5.2: Nalla Neram parity

**Files:**
- Modify: `src/calculations/nalla-neram.ts` (only if fixtures disagree)

- [ ] Compare `nalla_neram` from the public API to drik's Tamil page for at least the Chennai fixtures. If it diverges, fix the hora selection to match (the Tamil page lists Nalla Neram as hora windows). Commit only if a change is needed: `fix(tamil): match nalla neram to drik`.

---

# Phase 6 — Version, docs, verification

### Task 6.1: Bump version and document

**Files:**
- Modify: `package.json` (`"version": "0.5.0"`), `README.md`

- [ ] Bump to `0.5.0` (published values change — Shaka/Vikram/Gujarati/Kali years, purnimanta, five muhurta windows, varjyam/amrit).
- [ ] Add a README "DrikPanchang parity" section: what conventions are now default, the fixture capture workflow (`node scripts/capture-drik-fixtures.mjs`), that tests are offline, and the moonrise/moonset caveat.
- [ ] Commit: `chore: release 0.5.0 with drik-convention defaults`.

### Task 6.2: Full verification sweep

**Files:**
- Test: `test/drik-parity.test.ts`

- [ ] Flip **all** remaining `it.todo` to `it`.
- [ ] Run: `npm run build && npm test` → all suites pass.
- [ ] Run the full parity suite with `--reporter=verbose` and confirm zero failures across every fixture (report the max absolute minute delta per field).
- [ ] `git status` — confirm only source/tests/fixtures/README/package.json changed; no HTML.
- [ ] Commit: `test(drik): enable full parity suite (0.5.0)`.

### Task 6.3: Cross-check the reference day one more time

- [ ] Rebuild `dist/` and run the comparison for `2026-10-16` Suwanee GA; paste the field-by-field table into the final report and confirm every row in the "Background" table above now matches drik within 1 min (moonrise/moonset within 2 min).
- [ ] Commit: `chore: rebuild dist for 0.5.0`.

---

## Verification criteria (definition of done)

1. `npm test` passes with **no network access** (fixtures are committed JSON).
2. For every committed fixture, the public API matches drik exactly on: `paksha`, amanta + purnimanta month, Shaka/Vikram/Gujarati samvat, their samvatsara names, Kali year, tithi/nakshatra/yoga/karana names, vara.
3. Within 1 minute: sunrise, sunset, tithi/nakshatra/yoga/karana end times, abhijit, nishita, rahu/yamaganda/gulika, dur muhurtam, and (post-Phase 2–3) brahma, pratah sandhya, sayahna sandhya, vijaya, godhuli, varjyam, amrit kalam.
4. Within 2 minutes: moonrise, moonset (non-gating).
5. Tamil calendar matches drik on the Tamil fixtures.
6. No public API field renamed or removed; `package.json` at `0.5.0`.

## Open items the executor must resolve empirically

- Suwanee GA geoname-id (Task 0.1).
- Exact Kartik Shukla 1 date and whether drik's Gujarati display ever disagrees by a day (Task 1.4).
- Whether the amrit offset is a constant `−12` or a per-nakshatra table (Task 3.3).
- Whether the mutual Tamil year boundary is Chaitra Shukla 1 or Chithirai 1/Mesha sankranti (Task 5.1), and whether drik's Tamil surface uses a separate Tamil year-name list.
- Whether a full nakshatra sweep is required for the varjyam/amrit fit (Task 3.3).
- Exact moonrise/moonset convention (Task 4.2).
