/**
 * Parity suite: NativeEphemeris (swisseph addon) vs BrowserEphemeris
 * (@swisseph/browser WASM). Assert the two engines agree within tolerance.
 *
 * riseTrans is compared against a DIRECT corrected swisseph 10-flat call (the
 * adapter's own riseTrans is intentionally left buggy during migration — see
 * src/ephemeris/native.ts and the design spec).
 */

import { describe, expect, it, beforeAll } from "vitest";
import { createRequire } from "node:module";
import { BrowserEphemeris } from "../src/ephemeris/browser";
import { NativeEphemeris } from "../src/ephemeris/native";
import { SE } from "../src/ephemeris/types";
import { KELOWNA, UJJAIN, ALPHARETTA, approxEqual } from "./helpers";

const require = createRequire(import.meta.url);
const S = require("swisseph");

const AYANAMSAS = [
  "lahiri",
  "raman",
  "kp_new",
  "kp_khullar",
  "manoj",
  "sayan",
] as const;

const LOCATIONS = [
  { name: "Ujjain", lat: UJJAIN.latitude, lon: UJJAIN.longitude },
  { name: "Kelowna", lat: KELOWNA.latitude, lon: KELOWNA.longitude },
  { name: "Alpharetta", lat: ALPHARETTA.latitude, lon: ALPHARETTA.longitude },
];

// JDs: 2018 summer solstice-ish, 2018 Dec solstice-ish, and a 1582 Gregorian date
// (calendar transition), plus a BCE-era date.
const JDS = [2458271.0, 2458450.5, 2299160.5, 2000000.0];

let native: NativeEphemeris;
let browser: BrowserEphemeris;

beforeAll(async () => {
  native = new NativeEphemeris();
  native.init({ ayanamsa: "lahiri" });
  browser = new BrowserEphemeris((s) => import(s));
  await browser.init({ ayanamsa: "lahiri" });
}, 60000);

function siderealFlags(): number {
  return SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
}

/** Direct 10-flat corrected swe_rise_trans oracle. */
function nativeTransitOracle(
  jd: number,
  body: number,
  lon: number,
  lat: number,
  which: number,
): number | null {
  const r = S.swe_rise_trans(
    jd,
    body,
    "",
    SE.FLG_SWIEPH,
    which,
    lon,
    lat,
    0,
    1013.25,
    15,
  );
  const t: number = r.transitTime;
  if (t == null || t === -2) return null;
  return t;
}

describe("native vs browser ephemeris parity", () => {
  it("planet positions (longitude/latitude/distance/speed) agree", () => {
    for (const jd of JDS) {
      for (let p = SE.SUN; p <= SE.MEAN_NODE; p++) {
        const a = native.calcUt(jd, p, siderealFlags());
        const b = browser.calcUt(jd, p, siderealFlags());
        expect(
          approxEqual(a.lon, b.lon, 2e-4),
          `jd=${jd} planet=${p} lon: native=${a.lon} browser=${b.lon}`,
        ).toBe(true);
        expect(
          Math.abs(a.lat - b.lat) < 1e-3,
          `jd=${jd} planet=${p} lat: native=${a.lat} browser=${b.lat}`,
        ).toBe(true);
        expect(
          Math.abs(a.dist - b.dist) < 1e-6,
          `jd=${jd} planet=${p} dist: native=${a.dist} browser=${b.dist}`,
        ).toBe(true);
        expect(
          Math.abs(a.speed - b.speed) < 1e-5,
          `jd=${jd} planet=${p} speed: native=${a.speed} browser=${b.speed}`,
        ).toBe(true);
      }
    }
  });

  it("ayanamsa value agrees at all JDs", () => {
    for (const jd of JDS) {
      native.setAyanamsa("lahiri");
      expect(
        approxEqual(native.getAyanamsaUt(jd), browser.getAyanamsaUt(jd), 1e-8),
        `jd=${jd}`,
      ).toBe(true);
    }
  });

  it("julday / revjul round-trip agree", () => {
    for (const jd of JDS) {
      expect(native.revjul(jd)).toEqual(browser.revjul(jd));
      const [y, m, d, h] = native.revjul(jd);
      expect(native.julday(y, m, d, h)).toBeCloseTo(jd, 5);
      expect(browser.julday(y, m, d, h)).toBeCloseTo(jd, 5);
    }
  });

  it("ISO weekday agrees", () => {
    for (const jd of JDS) {
      expect(browser.isoWeekday(jd)).toBe(native.isoWeekday(jd));
    }
  });

  it("house ascendant agrees for several house systems", () => {
    const HSYS = ["W", "P", "K", "E"];
    for (const jd of JDS.slice(0, 2)) {
      for (const loc of LOCATIONS) {
        for (const hsys of HSYS) {
          const a = native.housesEx(
            jd,
            loc.lat,
            loc.lon,
            hsys,
            SE.FLG_SIDEREAL,
          );
          const b = browser.housesEx(
            jd,
            loc.lat,
            loc.lon,
            hsys,
            SE.FLG_SIDEREAL,
          );
          expect(
            approxEqual(a.ascendant, b.ascendant, 1e-4),
            `jd=${jd} ${loc.name} hsys=${hsys} asc: native=${a.ascendant} browser=${b.ascendant}`,
          ).toBe(true);
        }
      }
    }
  });

  it.each(AYANAMSAS)("house ascendant agrees for ayanamsa=%s", (ayanamsa) => {
    const jd = JDS[0];
    native.setAyanamsa(ayanamsa);
    browser.setAyanamsa(ayanamsa);
    for (const loc of LOCATIONS.slice(0, 1)) {
      const a = native.housesEx(jd, loc.lat, loc.lon, "W", SE.FLG_SIDEREAL);
      const b = browser.housesEx(jd, loc.lat, loc.lon, "W", SE.FLG_SIDEREAL);
      expect(
        approxEqual(a.ascendant, b.ascendant, 1e-4),
        `ayanamsa=${ayanamsa} asc: native=${a.ascendant} browser=${b.ascendant}`,
      ).toBe(true);
    }
  });

  it("rise/set agree with corrected native oracle", () => {
    for (const loc of LOCATIONS) {
      for (const jd of JDS.slice(0, 3)) {
        // chained events, mirroring computeSolarTimes
        const jdMid = jd - 0.5;
        for (const body of [SE.SUN, SE.MOON]) {
          const riseOracle = nativeTransitOracle(
            jdMid,
            body,
            loc.lon,
            loc.lat,
            SE.CALC_RISE,
          );
          const riseBrowser = browser.riseTrans(
            jdMid,
            body,
            [loc.lon, loc.lat, 0],
            SE.CALC_RISE,
          );
          if (riseOracle == null) continue;
          expect(
            approxEqual(riseBrowser ?? -1, riseOracle, 0.002),
            `${loc.name} jd=${jd} body=${body} rise: oracle=${riseOracle} browser=${riseBrowser}`,
          ).toBe(true);

          const setOracle = nativeTransitOracle(
            riseOracle,
            body,
            loc.lon,
            loc.lat,
            SE.CALC_SET,
          );
          const setBrowser = browser.riseTrans(
            riseOracle,
            body,
            [loc.lon, loc.lat, 0],
            SE.CALC_SET,
          );
          if (setOracle != null) {
            expect(
              approxEqual(setBrowser ?? -1, setOracle, 0.002),
              `${loc.name} jd=${jd} body=${body} set: oracle=${setOracle} browser=${setBrowser}`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("eclipse search methods are callable and return ret flags", () => {
    const s = browser.solEclipseWhenGlob(JDS[0]);
    expect(s).not.toBeNull();
    const l = browser.lunEclipseWhen(JDS[0]);
    expect(l).not.toBeNull();
  });
});
