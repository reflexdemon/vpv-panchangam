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

  describe("Shaka/Vikram/Kali follow Chaitra Shukla Pratipada", () => {
    // drik fixture ground truth for new-delhi. Eras are location-independent,
    // so New Delhi stands in for every fixture location.
    const cases: Array<[string, number, number, number]> = [
      ["2026-01-15", 1947, 2082, 5126],
      ["2026-03-18", 1947, 2082, 5126],
      ["2026-03-19", 1948, 2083, 5127],
      ["2026-04-14", 1948, 2083, 5127],
      ["2026-10-16", 1948, 2083, 5127],
      ["2026-11-09", 1948, 2083, 5127],
      // Before that year's Chaitra Shukla 1 (2027-03-19): still the prior year.
      ["2027-02-01", 1948, 2083, 5127],
    ];

    for (const [date, shaka, vikram, kali] of cases) {
      it(`${date} → Shaka ${shaka}, Vikram ${vikram}, Kali ${kali}`, async () => {
        const p = await computeDetailedPanchang(
          date,
          NEW_DELHI.lat,
          NEW_DELHI.lon,
          NEW_DELHI.tz,
          "en",
        );
        expect(p.lunar_month.shaka_samvat).toBe(shaka);
        expect(p.lunar_month.vikram_samvat).toBe(vikram);
        expect(p.calendars.kali_year).toBe(kali);
      });
    }

    it("samvatsara names follow the corrected years on 2026-10-16", async () => {
      const p = await computeDetailedPanchang(
        "2026-10-16",
        NEW_DELHI.lat,
        NEW_DELHI.lon,
        NEW_DELHI.tz,
        "en",
      );
      expect(p.lunar_month.samvatsara_shaka).toBe("Parabhava");
      expect(p.lunar_month.samvatsara_vikram).toBe("Siddharthi");
    });
  });
});
