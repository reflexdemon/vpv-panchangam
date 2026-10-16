import { describe, it, expect, beforeAll } from "vitest";
import { EphemerisService } from "../src/ephemeris";
import {
  chaitraShukla1Jd,
  kartikShukla1Jd,
} from "../src/calculations/calendars";

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
});
