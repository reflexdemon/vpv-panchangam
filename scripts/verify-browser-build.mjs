// Proves dist/browser/ is loadable end-to-end: the ESM bundle resolves its
// swisseph.wasm sibling and returns real calculations. Run via `npm run
// verify:browser` (which builds first).
import assert from "node:assert/strict";
import { computeDetailedPanchang, computeChart } from "../dist/browser/vpv-panchangam.mjs";

const panchang = await computeDetailedPanchang(
  "2026-09-28",
  23.1765,
  75.7885,
  "Asia/Kolkata",
  "en",
);
assert.equal(typeof panchang.vara.english, "string");
assert.ok(panchang.panchang.tithi, "expected a tithi");
assert.match(panchang.sun_moon.sunrise, /^\d{4}-\d{2}-\d{2}T/);

const chart = await computeChart(
  {
    date: "1990-03-15",
    time: "08:30",
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: "Asia/Kolkata",
    ayanamsa: "lahiri",
  },
  "en",
);
assert.equal(typeof chart.ascendant.sign, "string");
assert.equal(chart.planets_data.length, 12);
assert.equal(typeof chart.kalsarpa.present, "boolean");

console.log("browser build OK — vara:", panchang.vara.english, "| ascendant:", chart.ascendant.sign);
