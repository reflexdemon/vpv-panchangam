import { describe, it, expect, beforeAll } from "vitest";
import { EphemerisService } from "../src/ephemeris";
import { computeDetailedPanchang } from "../src/index";
import {
  chaitraShukla1Jd,
  kartikShukla1Jd,
} from "../src/calculations/calendars";

// New Delhi coordinates from the committed drik fixture manifest.
const NEW_DELHI = { lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" };
// London coordinates — used for the location-dependent Gujarati boundary day.
const LONDON = { lat: 51.5074, lon: -0.1278, tz: "Europe/London" };

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
      // Before that year's Chaitra Shukla 1 (2027-04-06 23:51 UT): still the prior year.
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

  describe("Gujarati Samvat rolls at Kartik Shukla Pratipada", () => {
    // drik fixtures. 2026-11-09 is the new-year boundary day and is
    // location-dependent (see the split test below). Verified against the
    // committed fixture pages.
    const cases: Array<[string, number]> = [
      ["2026-01-15", 2082],
      ["2026-02-01", 2082],
      ["2026-03-18", 2082],
      ["2026-03-19", 2082],
      ["2026-04-14", 2082],
      ["2026-10-16", 2082],
      ["2026-11-09", 2082],
      ["2027-01-15", 2083],
    ];

    for (const [date, gujarati] of cases) {
      it(`${date} → Gujarati ${gujarati}`, async () => {
        const p = await computeDetailedPanchang(
          date,
          NEW_DELHI.lat,
          NEW_DELHI.lon,
          NEW_DELHI.tz,
          "en",
        );
        expect(p.lunar_month.gujarati_samvat).toBe(gujarati);
      });
    }

    it("splits by location on 2026-11-09 (sunrise vs the 07:02 UT new moon)", async () => {
      const london = await computeDetailedPanchang(
        "2026-11-09",
        LONDON.lat,
        LONDON.lon,
        LONDON.tz,
        "en",
      );
      expect(london.lunar_month.gujarati_samvat).toBe(2083);
    });
  });

  describe("national civil date uses the solar national Saka year", () => {
    // Ground truth: drik `raw["National Civil Date"]` for New Delhi (identical
    // for every capture location). The national calendar is solar: Chaitra 1 =
    // Mar 22 (Mar 21 in leap years), independent of the lunar Shaka year.
    const cases: Array<[string, string, number, number]> = [
      ["2026-01-15", "Pausha", 25, 1947],
      ["2026-03-18", "Phalguna", 27, 1947],
      ["2026-03-19", "Phalguna", 28, 1947],
      ["2026-04-14", "Chaitra", 24, 1948],
      ["2026-10-16", "Ashwina", 24, 1948],
      ["2026-11-09", "Kartika", 18, 1948],
      // Derived from the national calendar (no fixture): Chaitra 1 = 2027-03-22.
      ["2027-03-22", "Chaitra", 1, 1949],
      ["2027-04-05", "Chaitra", 15, 1949],
    ];

    const national = async (date: string) =>
      (
        await computeDetailedPanchang(
          date,
          NEW_DELHI.lat,
          NEW_DELHI.lon,
          NEW_DELHI.tz,
          "en",
        )
      ).calendars.national_civil_date;

    for (const [date, month, day, shakaYear] of cases) {
      it(`${date} → ${month} ${day}, ${shakaYear}`, async () => {
        expect(await national(date)).toEqual({
          month,
          day,
          shaka_year: shakaYear,
        });
      });
    }

    it("flips the national Saka year on Mar 22 (Mar 21 in leap years)", async () => {
      const flips: Array<[string, number]> = [
        ["2026-03-21", 1947],
        ["2026-03-22", 1948],
        ["2027-03-21", 1948],
        ["2027-03-22", 1949],
        ["2028-03-20", 1949],
        ["2028-03-21", 1950],
      ];
      for (const [date, shakaYear] of flips) {
        expect((await national(date)).shaka_year).toBe(shakaYear);
      }
    });

    it("samples every month of 2026 and 2027 without a month/year glitch", async () => {
      const months = [
        "Pausha",
        "Magha",
        "Phalguna",
        "Chaitra",
        "Vaishakha",
        "Jyaistha",
        "Asadha",
        "Sravana",
        "Bhadra",
        "Ashwina",
        "Kartika",
        "Agrahayana",
      ];
      for (const year of [2026, 2027]) {
        for (let m = 1; m <= 12; m++) {
          const date = `${year}-${String(m).padStart(2, "0")}-15`;
          const n = await national(date);
          const shakaYear = m <= 3 ? year - 79 : year - 78;
          expect([date, n.month, n.shaka_year]).toEqual([
            date,
            months[m - 1],
            shakaYear,
          ]);
          expect(n.day).toBeGreaterThanOrEqual(1);
          expect(n.day).toBeLessThanOrEqual(31);
        }
      }
    });

    it("advances one national day at a time through Phalguna 30 into Chaitra", async () => {
      // Daily sweep over the solar new year. The old lunar-year input made the
      // month derivation run past the year end, so the `Phalguna 30` fallback
      // repeated for every out-of-range day instead of advancing.
      for (const year of [2026, 2027]) {
        const expected: Array<[string, string, number, number]> = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(Date.UTC(year, 2, 15 + i))
            .toISOString()
            .slice(0, 10);
          expected.push([date, "Phalguna", 24 + i, year - 79]);
        }
        for (let i = 0; i < 20; i++) {
          const date = new Date(Date.UTC(year, 2, 22 + i))
            .toISOString()
            .slice(0, 10);
          expected.push([date, "Chaitra", 1 + i, year - 78]);
        }
        for (const [date, month, day, shakaYear] of expected) {
          expect([date, await national(date)]).toEqual([
            date,
            { month, day, shaka_year: shakaYear },
          ]);
        }
      }
    });
  });

  describe("paksha derived from sunrise tithi", () => {
    for (const date of ["2026-03-18", "2026-03-19", "2026-11-09"]) {
      it(`${date} panchang.paksha and lunar_month.paksha agree as Krishna Paksha`, async () => {
        const p = await computeDetailedPanchang(
          date,
          NEW_DELHI.lat,
          NEW_DELHI.lon,
          NEW_DELHI.tz,
          "en",
        );
        expect(p.panchang.paksha).toBe("Krishna Paksha");
        expect(p.lunar_month.paksha).toBe("Krishna Paksha");
      });
    }
  });
});
