/**
 * Offline drik parity suite: replays the committed fixtures under
 * `test/fixtures/drik/` through the public API
 * (`computeDetailedPanchang`) and asserts field-by-field equality.
 *
 * Fully offline — committed JSON only, no network, no HTML reads.
 *
 * This suite FAILS on the fields not yet fixed by later phases; that is the
 * target (each phase flips its fields green). Do NOT weaken, skip, or delete
 * assertions to make it pass. No `it.todo`, no `.skip`.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { computeDetailedPanchang } from "../src/index";
import type { PanchangResponse, TimeWindow } from "../src/index";
import {
  loadFixtures,
  localHm,
  localDay,
  parseWindow,
  minuteDelta,
} from "./drik-helpers";

/** Minute tolerance for every wall-clock comparison against drik. */
const TOL_MIN = 1;

/**
 * Normalize an expected time expression to 24h "HH:MM": a fixture localISO
 * ("2026-10-16T06:22:00"), a bare "HH:MM", or a 12h endpoint with an
 * optional ", Mon DD" day marker (markers are rolled — wall-clock only).
 */
function expectedHm(raw: string): string {
  const iso = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const hm = raw.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
  if (hm) return `${hm[1].padStart(2, "0")}:${hm[2]}`;
  const h12 = raw.match(/(\d{1,2}):(\d{2})\s*([AP])M/i);
  if (h12) {
    let h = Number(h12[1]) % 12;
    if (h12[3].toUpperCase() === "P") h += 12;
    return `${String(h).padStart(2, "0")}:${h12[2]}`;
  }
  throw new Error(`expectHm: unparseable expected time ${raw}`);
}

/** Assert an actual absolute ISO instant matches expected wall-clock time. */
function expectHm(
  actualIso: string | null,
  expectedRaw: string,
  tz: string,
  displayOffsetMin?: number | null,
): void {
  expect(actualIso).not.toBeNull();
  let actualHmStr: string;
  if (displayOffsetMin != null) {
    const d = new Date(actualIso as string);
    const shifted = new Date(d.getTime() + displayOffsetMin * 60000);
    const hh = String(shifted.getUTCHours()).padStart(2, "0");
    const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
    actualHmStr = `${hh}:${mm}`;
  } else {
    actualHmStr = localHm(actualIso as string, tz);
  }
  const delta = minuteDelta(actualHmStr, expectedHm(expectedRaw));
  expect(delta).toBeLessThanOrEqual(TOL_MIN);
}

interface SingleCheck {
  fixtureKey: string;
  get: (r: PanchangResponse) => TimeWindow | null;
}

const SINGLE_WINDOWS: SingleCheck[] = [
  {
    fixtureKey: "brahmaMuhurta",
    get: (r) => r.auspicious_timings.brahma_muhurta,
  },
  {
    fixtureKey: "pratahSandhya",
    get: (r) => r.auspicious_timings.pratah_sandhya,
  },
  { fixtureKey: "abhijit", get: (r) => r.auspicious_timings.abhijit },
  {
    fixtureKey: "vijayaMuhurta",
    get: (r) => r.auspicious_timings.vijay_muhurta,
  },
  { fixtureKey: "godhuli", get: (r) => r.auspicious_timings.godhuli_muhurta },
  {
    fixtureKey: "sayahnaSandhya",
    get: (r) => r.auspicious_timings.sayahna_sandhya,
  },
  { fixtureKey: "nishita", get: (r) => r.auspicious_timings.nishita_muhurta },
  { fixtureKey: "rahuKalam", get: (r) => r.inauspicious_timings.rahu_kalam },
  { fixtureKey: "yamaganda", get: (r) => r.inauspicious_timings.yamaganda },
  { fixtureKey: "gulikai", get: (r) => r.inauspicious_timings.gulika_kalam },
];

interface ArrayCheck {
  fixtureKey: string;
  get: (r: PanchangResponse) => TimeWindow[];
}

const ARRAY_WINDOWS: ArrayCheck[] = [
  { fixtureKey: "amritKalam", get: (r) => r.auspicious_timings.amrit_kalam },
  { fixtureKey: "varjyam", get: (r) => r.inauspicious_timings.varjyam },
  {
    fixtureKey: "durMuhurtam",
    get: (r) => r.inauspicious_timings.dur_muhurtam,
  },
];

const fixtures = loadFixtures();

describe("drik parity (offline replay of committed fixtures)", () => {
  for (const f of fixtures) {
    describe(`${f.slug} ${f.date}`, () => {
      let result: PanchangResponse;
      const tz = (f.page as any).displayTimezone ?? f.timezone;
      const displayOffsetMin: number | null = (f.page as any).drikUtcOffsetMinutes ?? null;
      const page = f.page;

      beforeAll(async () => {
        result = await computeDetailedPanchang(
          f.date,
          f.latitude,
          f.longitude,
          f.timezone,
          "en",
        );
      });

      it("strict: paksha + vara", () => {
        expect(result.panchang.paksha).toBe(page.paksha);
        expect(result.vara.sanskrit).toBe(page.vara);
      });

      it("strict: lunar month + eras", () => {
        expect(result.lunar_month.chandramasa_amanta).toBe(
          page.chandramasaAmanta,
        );
        expect(result.lunar_month.chandramasa_purnimanta).toBe(
          page.chandramasaPurnimanta,
        );
        expect(result.lunar_month.shaka_samvat).toBe(page.shakaSamvat);
        expect(result.lunar_month.vikram_samvat).toBe(page.vikramSamvat);
        expect(result.lunar_month.gujarati_samvat).toBe(page.gujaratiSamvat);
        expect(result.lunar_month.samvatsara_shaka).toBe(page.shakaName);
        expect(result.lunar_month.samvatsara_vikram).toBe(page.vikramName);
        expect(result.calendars.kali_year).toBe(page.kaliyugaYears);
      });

      it("strict: panchang limb names", () => {
        expect(result.panchang.tithi?.name).toBe(page.tithi.name);
        expect(result.panchang.nakshatra?.name).toBe(page.nakshatra.name);
        expect(result.panchang.yoga?.name).toBe(page.yoga.name);
        expect(result.panchang.karana?.name).toBe(page.karana.name);
      });

      it("tolerant: sunrise/sunset", () => {
        expectHm(result.sun_moon.sunrise, page.sunrise as string, tz, displayOffsetMin);
        expectHm(result.sun_moon.sunset, page.sunset as string, tz, displayOffsetMin);
      });

      // moonrise/moonset is a known-drift best-effort area (lunar visibility
      // conventions differ between sources). It stays an active `it` but is
      // explicitly NOT part of any release gate.
      describe("moonrise/moonset (non-gating, known-drift best-effort)", () => {
        it("tolerant: moonrise/moonset", () => {
          if (page.moonrise == null) {
            expect(result.sun_moon.moonrise).toBeNull();
          } else {
            expectHm(result.sun_moon.moonrise, page.moonrise, tz, displayOffsetMin);
          }
          if (page.moonset == null) {
            expect(result.sun_moon.moonset).toBeNull();
          } else {
            expectHm(result.sun_moon.moonset, page.moonset, tz, displayOffsetMin);
          }
        });
      });

      it("tolerant: single windows", () => {
        for (const w of SINGLE_WINDOWS) {
          const raw = page.windows[w.fixtureKey];
          const actual = w.get(result);
          if (raw == null) {
            expect(actual).toBeNull();
            continue;
          }
          expect(actual).not.toBeNull();
          const halves = (raw as string).split(/\s+to\s+/);
          expectHm(actual!.start, halves[0] as string, tz);
          expectHm(actual!.end, halves[1] as string, tz);
        }
      });

      it("tolerant: array windows (ordered by start)", () => {
        for (const w of ARRAY_WINDOWS) {
          const raws = (page.windows[w.fixtureKey] ?? []) as string[];
          const actual = w.get(result);
          expect(actual.length).toBe(raws.length);
          const orderKey = (iso: string): string =>
            `${localDay(iso, tz)}T${localHm(iso, tz)}`;
          const expOrdered = raws
            .map((raw) => ({ raw, ...parseWindow(raw, tz, f.date) }))
            .sort((a, b) =>
              orderKey(a.startUtc) < orderKey(b.startUtc) ? -1 : 1,
            );
          const actOrdered = [...actual].sort((a, b) =>
            orderKey(a.start) < orderKey(b.start) ? -1 : 1,
          );
          for (let i = 0; i < expOrdered.length; i += 1) {
            const halves = (expOrdered[i] as { raw: string }).raw.split(
              /\s+to\s+/,
            );
            expectHm(
              (actOrdered[i] as TimeWindow).start,
              halves[0] as string,
              tz,
            );
            expectHm(
              (actOrdered[i] as TimeWindow).end,
              halves[1] as string,
              tz,
            );
          }
        }
      });
    });
  }
});
