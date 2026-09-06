import { describe, it, expect, beforeAll } from "vitest";
import { EphemerisService, SE } from "../src/ephemeris";
import {
  tithiIndex,
  nakshatraIndex,
  yogaIndex,
  moonSignId,
  karanaHalfIndex,
  nakshatraPada,
  signIdFromLon,
  degreeInSign,
  formatDms,
} from "../src/calculations/panchang";

describe("panchang limb indices", () => {
  let ephe: EphemerisService;
  let jd: number;
  let sunLon: number;
  let moonLon: number;

  beforeAll(() => {
    ephe = EphemerisService.getInstance();
    ephe.init();
    // 2018-06-01 12:00 UT
    jd = ephe.julday(2018, 6, 1, 12);
    const flags = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
    sunLon = ephe.calcUt(jd, SE.SUN, flags).lon;
    moonLon = ephe.calcUt(jd, SE.MOON, flags).lon;
  });

  it("computes tithi index in range 1-30", () => {
    const idx = tithiIndex(sunLon, moonLon);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(idx).toBeLessThanOrEqual(30);
  });

  it("computes nakshatra index in range 0-26", () => {
    const idx = nakshatraIndex(moonLon);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(26);
  });

  it("computes yoga index in range 0-26", () => {
    const idx = yogaIndex(sunLon, moonLon);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(26);
  });

  it("computes moon sign id in range 1-12", () => {
    const idx = moonSignId(moonLon);
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(idx).toBeLessThanOrEqual(12);
  });

  it("computes karana half-index in range 0-59", () => {
    const idx = karanaHalfIndex(sunLon, moonLon);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(59);
  });

  it("computes nakshatra pada in range 1-4", () => {
    const pada = nakshatraPada(moonLon);
    expect(pada).toBeGreaterThanOrEqual(1);
    expect(pada).toBeLessThanOrEqual(4);
  });

  it("signIdFromLon returns 1-12", () => {
    expect(signIdFromLon(0)).toBe(1);
    expect(signIdFromLon(30)).toBe(2);
    expect(signIdFromLon(359.9)).toBe(12);
  });

  it("degreeInSign returns 0-30", () => {
    const deg = degreeInSign(moonLon);
    expect(deg).toBeGreaterThanOrEqual(0);
    expect(deg).toBeLessThan(30);
  });

  it("formatDms produces correct format", () => {
    const s = formatDms(12.5819444);
    expect(s).toMatch(/^\d{2}° \d{2}' \d{2}"$/);
    // 12° 34' 55"  (12 + 34/60 + 55/3600 ≈ 12.582)
    expect(s.startsWith("12°")).toBe(true);
  });

  it("tithi is consistent: Purnima at 180° separation", () => {
    // Create artificial sun=0, moon=180 → tithi index = floor(180/12)+1 = 16 (Purnima)
    expect(tithiIndex(0, 180)).toBe(16);
    // Amavasya: diff = 348° → floor(348/12)+1 = 30
    expect(tithiIndex(0, 348)).toBe(30);
    // Shukla Pratipada: diff = 6° → floor(6/12)+1 = 1
    expect(tithiIndex(0, 6)).toBe(1);
  });
});
