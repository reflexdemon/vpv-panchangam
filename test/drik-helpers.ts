/**
 * Offline helpers for the drik parity suite (`test/drik-parity.test.ts`).
 *
 * Everything here reads only committed JSON under `test/fixtures/drik/`
 * (manifest + per-day pages). No network, no HTML parsing, no new deps.
 *
 * Wall-clock extraction uses `Intl.DateTimeFormat` with an explicit IANA
 * timezone so comparisons happen in the location's local time.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export interface DrikPanchangItem {
  name: string;
  endsAt: string | null;
  next: string;
}

export interface DrikPage {
  slug: string;
  date: string; // YYYY-MM-DD
  timezone: string;
  displayTimezone?: string | null;
  drikUtcOffsetMinutes?: number | null;
  locationName: string;
  sunrise: string | null; // localISO "YYYY-MM-DDTHH:MM" or null
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
  tithi: DrikPanchangItem;
  nakshatra: DrikPanchangItem;
  yoga: DrikPanchangItem;
  karana: DrikPanchangItem;
  paksha: string;
  vara: string; // Sanskrit weekday, e.g. "Shukrawara"
  vikramSamvat: number;
  vikramName: string;
  shakaSamvat: number;
  shakaName: string;
  gujaratiSamvat: number;
  chandramasaPurnimanta: string;
  chandramasaAmanta: string;
  kaliyugaYears: number;
  windows: Record<string, string | string[] | null>;
  raw: Record<string, string>;
}

export interface DrikLocation {
  slug: string;
  geonameId: number;
  name: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface LoadedFixture {
  slug: string;
  date: string; // YYYY-MM-DD
  timezone: string;
  locationName: string;
  latitude: number;
  longitude: number;
  page: DrikPage;
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRIK_DIR = path.join(HERE, "fixtures", "drik");

/** Load every committed fixture: manifest locations x dates joined with pages. */
export function loadFixtures(): LoadedFixture[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(DRIK_DIR, "manifest.json"), "utf8"),
  ) as { locations: DrikLocation[]; dates: string[] };
  const out: LoadedFixture[] = [];
  for (const loc of manifest.locations) {
    for (const date of manifest.dates) {
      const file = path.join(DRIK_DIR, "pages", `${loc.slug}-${date}.json`);
      const page = JSON.parse(fs.readFileSync(file, "utf8")) as DrikPage;
      out.push({
        slug: loc.slug,
        date,
        timezone: loc.timezone,
        locationName: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        page,
      });
    }
  }
  return out;
}

/** Wall-clock "HH:MM" of an absolute ISO instant in `tz`. */
export function localHm(isoUtc: string, tz: string): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoUtc));
  // Some engines emit "24:xx" for midnight; normalize to "00:xx".
  return formatted.startsWith("24:") ? `00:${formatted.slice(3)}` : formatted;
}

/** Wall-clock "YYYY-MM-DD" of an absolute ISO instant in `tz`. */
export function localDay(isoUtc: string, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoUtc));
}

/** Absolute minute distance between two "HH:MM" wall-clock strings. */
export function minuteDelta(a: string, b: string): number {
  const toMin = (hm: string): number => {
    const [h, m] = hm.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.abs(toMin(a) - toMin(b));
}

const MONTH_NUM: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/** UTC offset (ms) of `tz` at a given absolute instant. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string): number =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - utcMs;
}

/** Interpret a wall-clock date+time in `tz` as an absolute UTC instant. */
function zonedTimeToUtcMs(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  tz: string,
): number {
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  let utc = wallAsUtc;
  for (let i = 0; i < 3; i += 1) utc = wallAsUtc - tzOffsetMs(utc, tz);
  return utc;
}

interface ParsedEndpoint {
  utcMs: number;
  hasMarker: boolean;
}

/**
 * Parse one raw endpoint such as "04:42 AM" or "12:32 AM , Oct 17".
 * An explicit ", Mon DD" marker pins the endpoint to that calendar day
 * (rolling into the next year when the marker predates the fixture date);
 * otherwise the fixture date is assumed.
 */
function parseEndpoint(
  ep: string,
  tz: string,
  y: number,
  mo: number,
  d: number,
): ParsedEndpoint {
  const tm = ep.match(/(\d{1,2}):(\d{2})\s*([AP])M/i);
  if (!tm) throw new Error(`parseWindow: unparseable endpoint ${ep}`);
  let h = Number(tm[1]) % 12;
  if (tm[3].toUpperCase() === "P") h += 12;
  const mi = Number(tm[2]);
  let yy = y;
  let mmo = mo;
  let dd = d;
  let hasMarker = false;
  const mk = ep.match(/,\s*([A-Za-z]{3})\s*(\d{1,2})/);
  if (mk) {
    hasMarker = true;
    const mNum = MONTH_NUM[mk[1].toLowerCase()];
    if (!mNum) throw new Error(`parseWindow: bad month marker in ${ep}`);
    const baseMs = Date.UTC(y, mo - 1, d);
    let candMs = Date.UTC(y, mNum - 1, Number(mk[2]));
    // Marker dates always refer to the fixture day or a following day.
    if (candMs < baseMs) {
      candMs = Date.UTC(y + 1, mNum - 1, Number(mk[2]));
    }
    const cand = new Date(candMs);
    yy = cand.getUTCFullYear();
    mmo = cand.getUTCMonth() + 1;
    dd = cand.getUTCDate();
  }
  return { utcMs: zonedTimeToUtcMs(yy, mmo, dd, h, mi, tz), hasMarker };
}

/**
 * Parse a RAW drik window string (e.g. "04:42 AM to 05:32 AM",
 * "11:42 PM to 12:32 AM , Oct 17", "02:35 AM , Oct 17 to 04:23 AM , Oct 17")
 * into absolute UTC instants. A trailing endpoint that reads earlier than
 * the start without an explicit next-day marker is rolled +1 day
 * (midnight crossover).
 */
export function parseWindow(
  raw: string,
  tz: string,
  date: string,
): { startUtc: string; endUtc: string } {
  const [y, mo, d] = date.split("-").map(Number);
  const halves = raw.split(/\s+to\s+/);
  if (halves.length !== 2 || !halves[0] || !halves[1]) {
    throw new Error(`parseWindow: expected "A to B", got ${raw}`);
  }
  const start = parseEndpoint(halves[0], tz, y, mo, d);
  let end = parseEndpoint(halves[1], tz, y, mo, d);
  if (!end.hasMarker && end.utcMs <= start.utcMs) {
    end = { ...end, utcMs: end.utcMs + 24 * 3600 * 1000 };
  }
  return {
    startUtc: new Date(start.utcMs).toISOString(),
    endUtc: new Date(end.utcMs).toISOString(),
  };
}
