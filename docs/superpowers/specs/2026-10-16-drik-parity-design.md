# Design: DrikPanchang Parity for vpv-panchangam

Date: 2026-10-16
Status: Draft, awaiting approval
Scope: panchang computation only (not kundali/chart calculations)

## Intent and why

A REA-controlled browser investigation of drikpanchang.com (the de-facto
reference site for Hindu almanac times) compared its output against
vpv-panchangam for Suwanee, GA, USA on 2026-10-16 (34°03′05″N, 84°04′16″W,
UTC−4, Lahiri ayanamsa). DrikPanchang computes server-side with a proprietary
engine; its values are the acceptance target.

Result: the astronomical core already matches to the minute (tithi, nakshatra,
karana exact; yoga ±1 min; sunrise exact; Rahu Kalam/Yamaganda/Gulika/Dur
Muhurtam/Abhijit/Nishita within 1 min). The gaps are: systematically wrong
calendar-era counters, a few mis-indexed or differently-defined muhurta
windows, and 5–6 min drift in moonrise/moonset.

**Decision (user, 2026-10-16): fix everything, and adopt DrikPanchang's
conventions as the library defaults wherever the schools differ.** There is no
opt-in flag; drik behavior is the behavior.

**User decisions (2026-10-16):**
- Fixtures: implementation may fetch drikpanchang.com once, politely (~30
  pages, spaced); commit only extracted JSON values, never their raw HTML.
- Moonrise/moonset: best-effort improvement, **no release gate**; document
  the residual drift achieved.
- Tamil calendar: **full parity** against drik's Tamil panchang surface
  (second capture pass), not just internal consistency with the corrected
  Shaka rule.

## Reference datapoint (observed, drikpanchang.com, Suwanee GA, 2026-10-16 EDT)

```
Sunrise 07:42 AM   Sunset 07:01 PM   Moonrise 01:34 PM   Moonset 10:58 PM
Tithi: Shashthi → Saptami at 08:24 PM
Nakshatra: Mula → Purva Ashadha at 12:17 AM (Oct 17)
Yoga: Shobhana → Atiganda at 12:36 PM
Karana: Taitila at 08:24 PM
Brahma Muhurta 06:01–06:52 AM     Pratah Sandhya 06:26–07:42 AM
Abhijit 12:59–01:44 PM            Vijaya Muhurta 03:15–04:00 PM
Godhuli 07:01–07:26 PM            Sayahna Sandhya 07:01–08:17 PM
Amrit Kalam 05:05–06:53 PM        Nishita 12:57–01:47 AM (Oct 17)
Rahu Kalam 11:57 AM–01:22 PM      Yamaganda 04:11–05:36 PM
Gulika 09:07–10:32 AM             Dur Muhurtam 09:58–10:43 AM
Varjyam 10:29 PM–12:17 AM (Oct 17)
Vikram Samvat 2083 (Siddharthi)   Shaka Samvat 1948 (Parabhava)
Gujarati Samvat 2082 (Pingala)    Kaliyuga 5127 years
Chandramasa: Ashwina (amanta) / Ashwina (purnimanta)
```

Our output for the same inputs: everything in the first block matches ≤1 min
**except** Moonrise 01:28 PM / Moonset 11:03 PM (5–6 min drift); and these
mismatches:

| Field | Drik | Ours | Root cause (found in source) |
|---|---|---|---|
| Brahma Muhurta | 06:01–06:52 AM | 04:30–06:06 AM | `muhurta.ts:73` hardcodes 96-min window (2×48 min) instead of the last two night-muhurtas (night/15 each = ~50.7 min here) |
| Pratah Sandhya | 06:26–07:42 AM (pre-sunrise) | 07:42–08:27 AM | `muhurta.ts:87` uses day-muhurta index 1 (after sunrise); drik = [sunrise − 1.5×(night/15), sunrise] |
| Sayahna Sandhya | 07:01–08:17 PM | 06:15–07:00 PM | `muhurta.ts:136` uses night-muhurta 1; drik = [sunset, sunset + 1.5×(night/15)] |
| Vijaya Muhurta | 03:15–04:00 PM (day muhurta #11) | 05:30–06:15 PM (day muhurta #15) | `muhurta.ts:116` index 14; drik's window = day-muhurta index 10 (0-based) of the 15-muhurta day |
| Godhuli | 07:01–07:26 PM (sunset→+25) | 06:36–07:24 PM (sunset±24) | `muhurta.ts:124` centers window on sunset; drik starts at sunset; length ≈ (night/15)/2 ≈ 25.4 min — verify by fixtures |
| Amrit Kalam | 05:05–06:53 PM (one 108-min window) | two short windows | `muhurta.ts:237` uses fixed +26.67-ghatika offset from varjyam; drik's relation differs — derive from fixtures |
| Varjyam | 10:29 PM–12:17 AM (ends at Mula end, 108 min) | 11:10–11:37 PM + 03:15–03:27 AM | `muhurta.ts:219` uses `VARJYAM_GHATIKAS` table with fixed duration; drik's window for Mula ends exactly at nakshatra end and lasts 1/15 of nakshatra span (~108 min) — re-derive table/duration from fixtures |
| Kali year | 5127 | 5128 | `calendars.ts:85` `floor(ahargana/365.25)+1` — no Chaitra Shukla 1 boundary; verify epoch/rounding against fixtures |
| Shaka Samvat | 1948 | 1949 | `calendars.ts:91` boundary is Mesha ingress with ±77/78 rule; drik's year changes at Chaitra Shukla 1 → Oct 2026 = CE−78, our rule gives CE−77 |
| Vikram Samvat | 2083 | 2084 | `calendars.ts:94` = Shaka+135; follows from Shaka fix |
| Gujarati Samvat | 2082 | 2083 | `calendars.ts:97` = Vikram−1 always; Gujarati year actually rolls at Kartik Shukla 1 (around Diwali) — needs its own boundary |
| Purnimanta month | Ashwina | Kartika | `calendars.ts:114` derives purnimanta from sun sign (+1 month); correct rule: purnimanta = amanta name during Shukla paksha, next month name during Krishna paksha |
| Samvatsara names | Siddharthi / Parabhava | Raudra / Plavanga | 60-year cycle suffix follows from the year being +1; fixing years should fix names (verify suffix offset constants with fixtures) |
| Moonrise/Moonset | 01:34 PM / 10:58 PM | 01:28 PM / 11:03 PM | lunar rise/set likely geocentric; drik appears topocentric. Fix: topocentric Moon + standard rise/set refraction (see sunrise.ts riseTrans usage) |

## Goals

1. Core panchang elements (tithi, nakshatra, yoga, karana, paksha, var) match
   drik: names exact, boundary times within ±1 min on the fixture set.
2. All era counters exact vs drik on the fixture set: Kali year, Shaka,
   Vikram, Gujarati samvats, samvatsara names, amanta AND purnimanta months.
3. All displayed muhurta windows use drik's definitions: Brahma Muhurta,
   Pratah/Sayahna Sandhya, Abhijit, Vijaya, Godhuli, Nishita, Amrit Kalam,
   Varjyam, Rahu Kalam, Yamaganda, Gulika, Dur Muhurtam — within ±1 min.
4. Moonrise/moonset: best-effort. Fix hypothesis is topocentric Moon for
   rise/set; drik's exact algorithm is unknown, so no tolerance gates the
   release. Target ≤2 min, timebox the tuning, and document the residual
   drift achieved on the fixture set. Sunrise/sunset stay gated at ±1 min.
5. Tamil calendar parity: `tamil_calendar.tamil_month`, `tamil_year`, and
   `nalla_neram` match drik's Tamil panchang surface on the fixture set
   (second capture pass over drik's tamil-panchangam pages, same dates,
   Tamil Nadu locations: Chennai, Coimbatore, Madurai).
6. A committed, offline fixture harness: parsed drik reference values for a
   date×location matrix (main + Tamil), with a comparison test that enforces
   the tolerances above.

## Non-goals

- No change to kundali/chart computations (`computeChart`, divisional charts,
  dashas, ashtakavarga) — drik parity is about panchang outputs only.
- No attempt to reverse-engineer or replicate drik's server engine internals,
  UI, ads, localization, or festival/event pages.
- No runtime network access; fixtures are parsed once and committed.
- No new ayanamsa options; Lahiri stays the default (both sides use it).
- No API shape change: same `PanchangResponse` fields, same types. Values
  change; consumers' code does not.
- Not matching drik on fields we could not capture (e.g., their "Pravishte/
  Gate" counter, Mantri Mandala) — out of scope unless trivially derivable.

## Anti-goals

- Do not regress the existing mathematical-consistency tests (e.g., tithi
  index vs angular separation, varga formulas) or the Swiss Ephemeris oracle
  tests in `test/browser-ephemeris.test.ts`.
- Do not chase second-level precision: ≤1 min agreement is the target, not
  bit-identical seconds (drik only displays minutes).
- Do not silently change rounding behavior of unrelated fields.

## Constraints

- TypeScript, pure-TS logic + `@swisseph/browser` WASM; Node ≥20 and browsers.
- Public API shape stays stable (`computeDetailedPanchang` signature and
  `PanchangResponse` structure unchanged).
- Version bump to 0.5.0 (published values change — semver-minor pre-1.0 is
  the project's breaking-change vehicle).

## Test fixture strategy (the how)

- Capture rule (user-approved): implementation fetches drikpanchang.com once,
  politely (~30 pages, several seconds apart, identifying UA); commit only
  extracted JSON values under `test/fixtures/drik/` — never raw HTML. Include
  a rerunnable capture script; tests run offline against JSON only. Record
  capture date in fixtures.
- Location matrix (minimum): New Delhi IN, Chennai IN, Suwanee GA US, London
  UK (DST edge), Sydney AU (southern hemisphere).
- Tamil capture pass (user-approved scope): drik's tamil-panchangam surface
  for Chennai, Coimbatore, Madurai over the same dates; extract Tamil month/
  year and Nalla Neram into `test/fixtures/drik/tamil/`.
- Date matrix (minimum): one date per month of 2026–2027, PLUS boundary dates:
  Chaitra Shukla 1 (Shaka/Vikram new year), Gujarati new year (Kartik Shukla
  1, around Diwali), a date in Jan–Feb (pre-Chaitra, to pin the CE−79 case),
  Ashwina Purnima (purnimanta rollover), Tamil new year (Chithirai 1) and
  Aadi 1 (Tamil month boundaries), and two dates near lunar standstill
  extremes (moonrise/set stress).
- Tolerances: element names exact; times ±1 min; moonrise/moonset best-effort
  (no gate); era counters, month names, Tamil month/year exact.
- A small tolerance report test (not just pass/fail) that prints max observed
  drift per field, so drift trends are visible.

## Settled calls (builder-check items resolved by the author)

- Cross-midnight window membership (varjyam, amrit kalam, dur_muhurtam,
  nishita arrays on a civil-date response): a window appears in the day's
  array iff it intersects [sunrise, next sunrise) — matching what drik's
  day-panchang page displays, including windows labeled ", Oct 17".
  Fixture tests enforce this membership.
- Internal consistency of dependents: `computeTamilCalendar` (which hardcodes
  `gregYear − 78`) and `nationalCivilDate`/`nationalNirayanaDate` (which use
  `shakaYear + 78`) must follow the corrected Shaka boundary, and Tamil
  boundaries come from the Tamil capture pass.

## What's left to the builder

- Re-derive the exact Varjyam/Amrit Kalam algorithm to match drik: start with
  the classic per-nakshatra varjyam ghatika table already in
  `src/constants/muhurta.ts` (`VARJYAM_GHATIKAS`), hypothesize duration =
  nakshatra_span/15 and amrit offset from fixtures, adjust table values only
  where fixtures prove otherwise.
- Confirm Godhuli length formula (candidate: (night/15)/2 starting at sunset)
  from fixtures.
- Confirm the correct Shaka/Vikram/Gujarati/Kali boundary rules and any
  off-by-one in the samvatsara suffix offsets
  (`(shaka+11)%60`, `(vikram+9)%60`) against fixtures.
- Implement topocentric lunar rise/set and tune refraction parameters against
  the fixture set to reach ±2 min.
- Implement Tamil calendar parity against drik's tamil-panchangam surface:
  derive Tamil month/year boundaries (Chithirai new year, Aadi, etc.) and
  Nalla Neram conventions from the Tamil fixtures; `computeTamilCalendar` in
  `src/calculations/tamil.ts` loses its hardcoded `gregYear − 78`.
- Decide internal rounding: keep JD/ISO second precision internally; ensure
  minute-level display rounding matches drik (round-half-up at minute).
- Update existing tests that encode the old conventions (brahma muhurta
  window, sandhya direction, samvat formulas) to the drik conventions.
- Timebox the topocentric moonrise/moonset tuning; record achieved residual
  drift in the repo (e.g., in the tolerance report output).
