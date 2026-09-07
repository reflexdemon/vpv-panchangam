/**
 * Browser ephemeris (@swisseph/browser WASM) reference suite.
 *
 * Each value below was validated against the corrected native `swisseph`
 * oracle during the migration (see design spec / earlier A/B suite); those
 * reference points are pinned here so the browser engine stays regression-safe
 * now that the native adapter has been removed.
 */

import { describe, expect, it, beforeAll, vi } from "vitest";
import { BrowserEphemeris } from "../src/ephemeris/browser";
import { SE } from "../src/ephemeris/types";
import { EphemerisService } from "../src/ephemeris";
import { computeChart } from "../src/api/calculate";
import { computeDetailedPanchang } from "../src/api/get-panchang";
import { KELOWNA, UJJAIN, ALPHARETTA, approxEqual } from "./helpers";

const UJ = { name: "Ujjain", lat: UJJAIN.latitude, lon: UJJAIN.longitude };
const KL = { name: "Kelowna", lat: KELOWNA.latitude, lon: KELOWNA.longitude };
const AT = {
  name: "Alpharetta",
  lat: ALPHARETTA.latitude,
  lon: ALPHARETTA.longitude,
};

let browser: BrowserEphemeris;

beforeAll(async () => {
  browser = new BrowserEphemeris((s) => import(s));
  await browser.init({ ayanamsa: "lahiri" });
}, 60000);

describe("browser ephemeris", () => {
  it("computes sidereal sun/moon positions", () => {
    const jd = browser.julday(2018, 6, 1, 12);
    const flags = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
    const sun = browser.calcUt(jd, SE.SUN, flags);
    const moon = browser.calcUt(jd, SE.MOON, flags);
    expect(approxEqual(sun.lon, 46.840103386061095, 1e-9)).toBe(true);
    expect(approxEqual(moon.lon, 259.09624001729605, 1e-9)).toBe(true);
    expect(approxEqual(sun.dist, 1.0140046963766582, 1e-9)).toBe(true);
    expect(approxEqual(moon.dist, 0.0027048284895628966, 1e-9)).toBe(true);
  });

  it("computes ayanamsa (24.11433667 @ 2018-06-01)", () => {
    const jd = browser.julday(2018, 6, 1, 12);
    expect(
      approxEqual(browser.getAyanamsaUt(jd), 24.114336671992817, 1e-9),
    ).toBe(true);
  });

  it("computes Ujjain houses (ascendant 206.13792568)", () => {
    const jd = browser.julday(2018, 6, 1, 12);
    const h = browser.housesEx(jd, UJ.lat, UJ.lon, "W");
    expect(approxEqual(h.ascendant, 206.13792567772435, 1e-9)).toBe(true);
  });

  it("julday/revjul round-trip", () => {
    expect(browser.julday(2018, 6, 1, 12)).toBeCloseTo(2458271.0, 8);
    expect(browser.revjul(2458271.0)).toEqual([2018, 6, 1, 12]);
    expect(browser.isoWeekday(2458271.0)).toBe(5); // 2018-06-01 = Friday
  });

  it("rise/set matches native-validated reference (Ujjain summer)", () => {
    const jdMid = browser.julday(2018, 6, 1, 12) - 0.5;
    const sr = browser.riseTrans(
      jdMid,
      SE.SUN,
      [UJ.lon, UJ.lat, 0],
      SE.CALC_RISE,
    );
    const ss =
      sr != null
        ? browser.riseTrans(sr, SE.SUN, [UJ.lon, UJ.lat, 0], SE.CALC_SET)
        : null;
    const ns =
      ss != null
        ? browser.riseTrans(ss, SE.SUN, [UJ.lon, UJ.lat, 0], SE.CALC_RISE)
        : null;
    const mr = browser.riseTrans(
      jdMid,
      SE.MOON,
      [UJ.lon, UJ.lat, 0],
      SE.CALC_RISE,
    );
    const ms =
      mr != null
        ? browser.riseTrans(mr, SE.MOON, [UJ.lon, UJ.lat, 0], SE.CALC_SET)
        : null;
    expect(sr).not.toBeNull();
    expect(approxEqual(sr!, 2458270.5074593266, 0.002)).toBe(true);
    expect(approxEqual(ss!, 2458271.068513046, 0.002)).toBe(true);
    expect(approxEqual(ns!, 2458271.5073734885, 0.002)).toBe(true);
    expect(approxEqual(mr!, 2458271.1659553247, 0.002)).toBe(true);
    expect(approxEqual(ms!, 2458271.6292085443, 0.002)).toBe(true);
  });

  it("rise/set matches native-validated reference (Kelowna summer)", () => {
    const jdMid = browser.julday(2018, 6, 1, 12) - 0.5;
    const sr = browser.riseTrans(
      jdMid,
      SE.SUN,
      [KL.lon, KL.lat, 0],
      SE.CALC_RISE,
    );
    const ss =
      sr != null
        ? browser.riseTrans(sr, SE.SUN, [KL.lon, KL.lat, 0], SE.CALC_SET)
        : null;
    const ns =
      ss != null
        ? browser.riseTrans(ss, SE.SUN, [KL.lon, KL.lat, 0], SE.CALC_RISE)
        : null;
    const mr = browser.riseTrans(
      jdMid,
      SE.MOON,
      [KL.lon, KL.lat, 0],
      SE.CALC_RISE,
    );
    const ms =
      mr != null
        ? browser.riseTrans(mr, SE.MOON, [KL.lon, KL.lat, 0], SE.CALC_SET)
        : null;
    expect(sr).not.toBeNull();
    expect(approxEqual(sr!, 2458270.9960077973, 0.002)).toBe(true);
    expect(approxEqual(ss!, 2458271.6652820036, 0.002)).toBe(true);
    expect(approxEqual(ns!, 2458271.995527832, 0.002)).toBe(true);
    expect(approxEqual(mr!, 2458270.7430952042, 0.002)).toBe(true);
    expect(approxEqual(ms!, 2458271.106042589, 0.002)).toBe(true);
  });

  it("rise/set matches native-validated reference (Alpharetta summer)", () => {
    const jdMid = browser.julday(2018, 6, 1, 12) - 0.5;
    const sr = browser.riseTrans(
      jdMid,
      SE.SUN,
      [AT.lon, AT.lat, 0],
      SE.CALC_RISE,
    );
    const ss =
      sr != null
        ? browser.riseTrans(sr, SE.SUN, [AT.lon, AT.lat, 0], SE.CALC_SET)
        : null;
    const ns =
      ss != null
        ? browser.riseTrans(ss, SE.SUN, [AT.lon, AT.lat, 0], SE.CALC_RISE)
        : null;
    const mr = browser.riseTrans(
      jdMid,
      SE.MOON,
      [AT.lon, AT.lat, 0],
      SE.CALC_RISE,
    );
    const ms =
      mr != null
        ? browser.riseTrans(mr, SE.MOON, [AT.lon, AT.lat, 0], SE.CALC_SET)
        : null;
    expect(sr).not.toBeNull();
    expect(approxEqual(sr!, 2458270.935262533, 0.002)).toBe(true);
    expect(approxEqual(ss!, 2458271.530225777, 0.002)).toBe(true);
    expect(approxEqual(ns!, 2458271.935066565, 0.002)).toBe(true);
    expect(approxEqual(mr!, 2458270.607802949, 0.002)).toBe(true);
    expect(approxEqual(ms!, 2458271.0390025573, 0.002)).toBe(true);
  });

  it("eclipse search methods are callable and return ret flags", () => {
    const jd = browser.julday(2018, 6, 1, 12);
    const s = browser.solEclipseWhenGlob(jd);
    expect(s).not.toBeNull();
    const l = browser.lunEclipseWhen(jd);
    expect(l).not.toBeNull();
  });

  it("dedupes concurrent init() calls", async () => {
    let loads = 0;
    class StubSwe {
      async init(): Promise<void> {}
      setSiderealMode(): void {}
    }
    const countingLoader = (s: string) => {
      loads++;
      return Promise.resolve({ SwissEphemeris: StubSwe });
    };
    const b = new BrowserEphemeris(countingLoader);
    await Promise.all([b.init(), b.init(), b.init()]);
    expect(loads).toBe(1);
    expect(b.initialized).toBe(true);
  });

  it("EphemerisService.init() dedupes concurrent calls", async () => {
    EphemerisService.destroy();
    const spy = vi
      .spyOn(BrowserEphemeris.prototype, "init")
      .mockResolvedValue(undefined);
    const svc = EphemerisService.getInstance();
    await Promise.all([svc.init(), svc.init(), svc.init()]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(svc.initialized).toBe(true);
    spy.mockRestore();
    EphemerisService.destroy();
  });

  it("rise/set honors observer elevation (horizon dip)", () => {
    const jdMid = browser.julday(2018, 6, 1, 12) - 0.5;
    const sr0 = browser.riseTrans(
      jdMid,
      SE.SUN,
      [UJ.lon, UJ.lat, 0],
      SE.CALC_RISE,
    );
    const sr1 = browser.riseTrans(
      jdMid,
      SE.SUN,
      [UJ.lon, UJ.lat, 1000],
      SE.CALC_RISE,
    );
    expect(sr0).not.toBeNull();
    expect(sr1).not.toBeNull();
    expect(sr1!).toBeLessThan(sr0!);
    const ss0 = browser.riseTrans(
      sr0!,
      SE.SUN,
      [UJ.lon, UJ.lat, 0],
      SE.CALC_SET,
    );
    const ss1 = browser.riseTrans(
      sr1!,
      SE.SUN,
      [UJ.lon, UJ.lat, 1000],
      SE.CALC_SET,
    );
    expect(ss0).not.toBeNull();
    expect(ss1).not.toBeNull();
    expect(ss1!).toBeGreaterThan(ss0!);
  });

  it("sidereal houses stay in [0,360) across the ayanamsa wrap", () => {
    const jd = browser.julday(2018, 9, 20, 12);
    const h = browser.housesEx(jd, UJ.lat, UJ.lon, "P");
    for (let i = 1; i <= 12; i++) {
      expect(h.cusps[i]).toBeGreaterThanOrEqual(0);
      expect(h.cusps[i]).toBeLessThan(360);
    }
    expect(h.ascendant).toBeGreaterThanOrEqual(0);
    expect(h.ascendant).toBeLessThan(360);
    expect(h.mc).toBeGreaterThanOrEqual(0);
    expect(h.mc).toBeLessThan(360);
    expect(h.cusps[2]).toBeCloseTo(354.5, 0); // pre-fix this was -5.5
  });

  it("maps inner ephemeris init failure to ChartError EPHEMERIS_ERROR", async () => {
    EphemerisService.destroy();
    const ephe = EphemerisService.getInstance();
    const spy = vi.spyOn(ephe, "init").mockRejectedValueOnce(new Error("boom"));
    await expect(
      computeChart({
        date: "2018-06-01",
        time: "12:00",
        latitude: UJ.lat,
        longitude: UJ.lon,
        timezone: "Asia/Kolkata",
      }),
    ).rejects.toMatchObject({ name: "ChartError", code: "EPHEMERIS_ERROR" });
    spy.mockRestore();
    EphemerisService.destroy();
  });

  it("maps inner ephemeris init failure to PanchangError EPHEMERIS_ERROR", async () => {
    EphemerisService.destroy();
    const ephe = EphemerisService.getInstance();
    const spy = vi.spyOn(ephe, "init").mockRejectedValueOnce(new Error("boom"));
    await expect(
      computeDetailedPanchang("2018-06-01", UJ.lat, UJ.lon, "Asia/Kolkata"),
    ).rejects.toMatchObject({ name: "PanchangError", code: "EPHEMERIS_ERROR" });
    spy.mockRestore();
    EphemerisService.destroy();
  });
});
