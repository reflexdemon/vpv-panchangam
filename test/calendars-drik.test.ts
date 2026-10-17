import { describe, it, expect, beforeAll } from "vitest";
import { EphemerisService } from "../src/ephemeris";
import { computeDetailedPanchang } from "../src/index";
import {
  chaitraShukla1Jd,
  kartikShukla1Jd,
} from "../src/calculations/calendars";

// New Delhi coordinates from the committed drik fixture manifest.
const NEW_DELHI = { lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" };

describe("drik lunar-month anchors", () => {
  let ephe: EphemerisService;

  beforeAll(async () => {
    ephe = EphemerisService.getInstance();
    await ephe.init();
  });

  describe("chaitraShukla1Jd", () => {
    it("lands on 2026-03-19", () => {
      const jd = chaitraShukla1Jd(2026, ephe);
      const [y, m, d] = ephe.revjul(jd);
      expect([y, m, d]).toEqual([2026, 3, 19]);
    });
  });

  describe("kartikShukla1Jd", () => {
    it("lands on 2026-11-09", () => {
      const jd = kartikShukla1Jd(2026, ephe);
      const [y, m, d] = ephe.revjul(jd);
      expect([y, m, d]).toEqual([2026, 11, 9]);
    });
  });

  describe("amanta/purnimanta from the last new moon", () => {
    // Values are the committed drik fixtures for new-delhi.
    const cases: Array<[string, string, string]> = [
      ["2026-10-16", "Ashwina", "Ashwina"],
      ["2026-03-18", "Phalguna", "Chaitra"],
      ["2026-03-19", "Phalguna", "Chaitra"],
    ];

    for (const [date, amanta, purnimanta] of cases) {
      it(`${date} → amanta ${amanta}, purnimanta ${purnimanta}`, async () => {
        const p = await computeDetailedPanchang(
          date,
          NEW_DELHI.lat,
          NEW_DELHI.lon,
          NEW_DELHI.tz,
          "en",
        );
        expect(p.lunar_month.chandramasa_amanta).toBe(amanta);
        expect(p.lunar_month.chandramasa_purnimanta).toBe(purnimanta);
      });
    }
  });
});
