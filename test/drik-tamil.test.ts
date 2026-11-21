/**
 * Offline drik Tamil parity suite: replays the committed Tamil-panchangam
 * fixtures under `test/fixtures/drik/tamil/` through the public API
 * (`computeDetailedPanchang`) and asserts the Tamil calendar surface matches
 * the values published on DrikPanchang's Tamil pages
 * (https://www.drikpanchang.com/tamil/tamil-month-panchangam.html).
 *
 * Fully offline — committed JSON only, no network, no HTML reads.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { computeDetailedPanchang } from "../src/index";
import type { PanchangResponse } from "../src/index";
import { loadTamilFixtures } from "./drik-helpers";
import type { DrikTamilPage } from "./drik-helpers";

const fixtures = loadTamilFixtures();

describe("drik tamil parity (offline replay of committed tamil fixtures)", () => {
  for (const f of fixtures) {
    describe(`${f.slug} ${f.date}`, () => {
      let result: PanchangResponse;

      beforeAll(async () => {
        result = await computeDetailedPanchang(
          f.date,
          f.latitude,
          f.longitude,
          f.timezone,
          "en",
        );
      });

      it("strict: tamil month + tamil date", () => {
        expect(result.tamil_calendar?.tamil_month.en).toBe(f.tamil_month.en);
        expect(result.tamil_calendar?.tamil_month.ta).toBe(f.tamil_month.ta);
        expect(result.tamil_calendar?.tamil_month.id).toBe(f.tamil_month.id);
        expect(result.tamil_calendar?.tamil_date).toBe(f.tamil_date);
      });

      it("strict: tamil year", () => {
        expect(result.tamil_calendar?.tamil_year.name_en).toBe(
          f.tamil_year.name_en,
        );
        expect(result.tamil_calendar?.tamil_year.name_ta).toBe(
          f.tamil_year.name_ta,
        );
        expect(result.tamil_calendar?.tamil_year.id).toBe(f.tamil_year.id);
        expect(result.tamil_calendar?.tamil_year.gregorian_start_year).toBe(
          f.tamil_year.gregorian_start_year,
        );
      });

      it("strict: lunar month + shaka/vikram/kali eras", () => {
        expect(result.lunar_month.chandramasa_amanta).toBe(
          f.lunar_month_amanta,
        );
        expect(result.lunar_month.chandramasa_purnimanta).toBe(
          f.lunar_month_purnimanta,
        );
        expect(result.lunar_month.shaka_samvat).toBe(f.shaka_samvat);
        expect(result.lunar_month.samvatsara_shaka).toBe(f.shaka_name);
        expect(result.calendars.kali_year).toBe(f.kaliyuga_years);
      });

      it("strict: week day (english + tamil)", () => {
        expect(result.tamil_calendar?.week_day.en).toBe(f.week_day.en);
        expect(result.tamil_calendar?.week_day.ta).toBe(f.week_day.ta);
      });
    });
  }
});
