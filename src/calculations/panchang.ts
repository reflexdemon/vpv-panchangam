/**
 * Core panchang index calculators and sequence generators.
 * All index functions are pure arithmetic — no IO or ephemeris calls.
 */

import { NAK_SPAN } from "../constants/panchang";
import { karanaName } from "../constants/panchang";
import { findAngleTime, findAllCrossings } from "./bisection";
import type { EphemerisService } from "../ephemeris";
import { SE } from "../ephemeris";
import type { PanchangItem, MoonSign, NakshatraPada } from "../types";

// ─── Index Functions ──────────────────────────────────────────────────────────

/**
 * Tithi index (1-30).
 * 1 = Shukla Pratipada, 15 = Purnima, 16 = Krishna Pratipada, 30 = Amavasya.
 */
export function tithiIndex(sunLon: number, moonLon: number): number {
  let diff = (((moonLon - sunLon) % 360) + 360) % 360;
  return Math.floor(diff / 12) + 1;
}

/**
 * Nakshatra index (0-26). 0 = Ashwini.
 */
export function nakshatraIndex(moonLon: number): number {
  return Math.floor((((moonLon % 360) + 360) % 360) / NAK_SPAN);
}

/**
 * Nakshatra pada (1-4) from a longitude.
 */
export function nakshatraPada(lon: number): number {
  const normLon = ((lon % 360) + 360) % 360;
  const degInNak = normLon - Math.floor(normLon / NAK_SPAN) * NAK_SPAN;
  return Math.floor(degInNak / (NAK_SPAN / 4)) + 1;
}

/**
 * Yoga index (0-26). 0 = Vishkumbha.
 * yoga = floor((sunLon + moonLon) / 13.333...)
 */
export function yogaIndex(sunLon: number, moonLon: number): number {
  const total = (((sunLon + moonLon) % 360) + 360) % 360;
  return Math.floor(total / NAK_SPAN);
}

/**
 * Karana half-tithi index (0-59).
 */
export function karanaHalfIndex(sunLon: number, moonLon: number): number {
  const diff = (((moonLon - sunLon) % 360) + 360) % 360;
  return Math.floor(diff / 6);
}

/**
 * Moon sign ID (1-12). 1 = Aries.
 */
export function moonSignId(moonLon: number): number {
  return Math.floor((((moonLon % 360) + 360) % 360) / 30) + 1;
}

/**
 * Sign ID from any ecliptic longitude (1-12).
 */
export function signIdFromLon(lon: number): number {
  return Math.floor((((lon % 360) + 360) % 360) / 30) + 1;
}

/**
 * Degree position within its sign (0-30).
 */
export function degreeInSign(lon: number): number {
  const n = ((lon % 360) + 360) % 360;
  return n - Math.floor(n / 30) * 30;
}

/**
 * Format a decimal degree as a DMS string: "12° 34' 56\"".
 */
export function formatDms(deg: number): string {
  const n = ((deg % 360) + 360) % 360;
  const d = Math.floor(n);
  const mFull = (n - d) * 60;
  const m = Math.floor(mFull);
  let s = Math.round((mFull - m) * 60);
  if (s === 60) {
    s = 0;
  }
  return `${d.toString().padStart(2, "0")}° ${m.toString().padStart(2, "0")}' ${s.toString().padStart(2, "0")}"`;
}

/**
 * Julian Day → ISO-8601 string (UTC).
 */
export function jdToIso(jd: number, ephe: EphemerisService): string {
  const [y, mo, d, hFrac] = ephe.revjul(jd);
  const h = Math.floor(hFrac);
  const mFull = (hFrac - h) * 60;
  const m = Math.floor(mFull);
  const sFull = (mFull - m) * 60;
  const s = Math.floor(sFull);
  const ms = Math.round((sFull - s) * 1000);
  return `${y.toString().padStart(4, "0")}-${mo.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}T${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}Z`;
}

// ─── Sequence Generators ──────────────────────────────────────────────────────

const SIDEREAL_FLAGS = () => SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;

function sunLonAt(jd: number, ephe: EphemerisService): number {
  return ephe.calcUt(jd, SE.SUN, SIDEREAL_FLAGS()).lon;
}

function moonLonAt(jd: number, ephe: EphemerisService): number {
  return ephe.calcUt(jd, SE.MOON, SIDEREAL_FLAGS()).lon;
}

function tithiAngle(jd: number, ephe: EphemerisService): number {
  const s = sunLonAt(jd, ephe);
  const m = moonLonAt(jd, ephe);
  return (((m - s) % 360) + 360) % 360;
}

function yogaAngle(jd: number, ephe: EphemerisService): number {
  const s = sunLonAt(jd, ephe);
  const m = moonLonAt(jd, ephe);
  return (((s + m) % 360) + 360) % 360;
}

/**
 * Generate sequence of Tithis within [startJd, endJd].
 * Each item has index (1-30), name (en), starts_at, ends_at.
 */
export function generateTithis(
  startJd: number,
  endJd: number,
  ephe: EphemerisService,
  namesFn: (idx: number) => string = (i) => `Tithi ${i}`,
): PanchangItem[] {
  const result: PanchangItem[] = [];
  const angle0 = tithiAngle(startJd, ephe);
  const idx0 = Math.floor(angle0 / 12); // 0-based slot

  let prev = startJd;
  let curSlot = idx0;

  const crossings = findAllCrossings(
    startJd,
    endJd,
    12,
    (jd) => tithiAngle(jd, ephe),
    angle0,
  );

  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });

  for (const b of boundaries) {
    const tithiIdx = curSlot + 1; // 1-based
    result.push({
      index: tithiIdx,
      name: namesFn(tithiIdx),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe),
    });
    prev = b.jd;
    curSlot = (curSlot + 1) % 30;
  }

  return result;
}

/**
 * Generate sequence of Nakshatras within [startJd, endJd].
 */
export function generateNakshatras(
  startJd: number,
  endJd: number,
  ephe: EphemerisService,
  namesFn: (idx: number) => string = (i) => `Nakshatra ${i}`,
): PanchangItem[] {
  const result: PanchangItem[] = [];
  const moonAngle0 = moonLonAt(startJd, ephe);
  const idx0 = Math.floor((((moonAngle0 % 360) + 360) % 360) / NAK_SPAN);

  const crossings = findAllCrossings(
    startJd,
    endJd,
    NAK_SPAN,
    (jd) => moonLonAt(jd, ephe),
    moonAngle0,
  );

  let prev = startJd;
  let curIdx = idx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });

  for (const b of boundaries) {
    result.push({
      index: curIdx,
      name: namesFn(curIdx),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe),
    });
    prev = b.jd;
    curIdx = (curIdx + 1) % 27;
  }

  return result;
}

/**
 * Generate sequence of Yogas within [startJd, endJd].
 */
export function generateYogas(
  startJd: number,
  endJd: number,
  ephe: EphemerisService,
  namesFn: (idx: number) => string = (i) => `Yoga ${i}`,
): PanchangItem[] {
  const result: PanchangItem[] = [];
  const angle0 = yogaAngle(startJd, ephe);
  const idx0 = Math.floor(angle0 / NAK_SPAN);

  const crossings = findAllCrossings(
    startJd,
    endJd,
    NAK_SPAN,
    (jd) => yogaAngle(jd, ephe),
    angle0,
  );

  let prev = startJd;
  let curIdx = idx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });

  for (const b of boundaries) {
    result.push({
      index: curIdx,
      name: namesFn(curIdx),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe),
    });
    prev = b.jd;
    curIdx = (curIdx + 1) % 27;
  }

  return result;
}

/**
 * Generate sequence of Karanas within [startJd, endJd].
 * Each half-tithi (6°) is one karana.
 */
export function generateKaranas(
  startJd: number,
  endJd: number,
  ephe: EphemerisService,
): PanchangItem[] {
  const result: PanchangItem[] = [];
  const angle0 = tithiAngle(startJd, ephe);
  const halfIdx0 = Math.floor(angle0 / 6);

  const crossings = findAllCrossings(
    startJd,
    endJd,
    6,
    (jd) => tithiAngle(jd, ephe),
    angle0,
  );

  let prev = startJd;
  let curHalf = halfIdx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });

  for (const b of boundaries) {
    result.push({
      index: curHalf,
      name: karanaName(curHalf),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe),
    });
    prev = b.jd;
    curHalf = (curHalf + 1) % 60;
  }

  return result;
}

/**
 * Generate Moon sign sequence within [startJd, endJd].
 */
export function generateMoonSigns(
  startJd: number,
  endJd: number,
  ephe: EphemerisService,
  namesFn: (idx: number) => string = (i) => `Rashi ${i}`,
  rashiFn: (idx: number) => string = (i) => `Rashi ${i}`,
): MoonSign[] {
  const result: MoonSign[] = [];
  const moonAngle0 = moonLonAt(startJd, ephe);
  const signIdx0 = Math.floor((((moonAngle0 % 360) + 360) % 360) / 30); // 0-based

  const crossings = findAllCrossings(
    startJd,
    endJd,
    30,
    (jd) => moonLonAt(jd, ephe),
    moonAngle0,
  );

  let prev = startJd;
  let curIdx = signIdx0; // 0-based
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });

  for (const b of boundaries) {
    const signId = curIdx + 1; // 1-based
    result.push({
      index: signId,
      name: namesFn(curIdx),
      rashi: rashiFn(curIdx),
      ends_at: jdToIso(b.jd, ephe),
    });
    prev = b.jd;
    curIdx = (curIdx + 1) % 12;
  }

  return result;
}

/**
 * Generate Nakshatra Pada sequence (Moon) within [startJd, endJd].
 * Each pada is NAK_SPAN / 4 degrees.
 */
export function generateNakshatraPadas(
  startJd: number,
  endJd: number,
  ephe: EphemerisService,
  namesFn: (nakIdx: number) => string = (i) => `Nakshatra ${i}`,
): NakshatraPada[] {
  const result: NakshatraPada[] = [];
  const PADA_SPAN = NAK_SPAN / 4;
  const moonAngle0 = moonLonAt(startJd, ephe);
  const padaIdx0 = Math.floor((((moonAngle0 % 360) + 360) % 360) / PADA_SPAN); // 0-107

  const crossings = findAllCrossings(
    startJd,
    endJd,
    PADA_SPAN,
    (jd) => moonLonAt(jd, ephe),
    moonAngle0,
  );

  let curPadaIdx = padaIdx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });

  for (const b of boundaries) {
    const nakIdx = Math.floor(curPadaIdx / 4); // 0-26
    const pada = (curPadaIdx % 4) + 1; // 1-4
    result.push({
      index: nakIdx,
      name: namesFn(nakIdx),
      pada,
      ends_at: jdToIso(b.jd, ephe),
    });
    curPadaIdx = (curPadaIdx + 1) % 108;
  }

  return result;
}
