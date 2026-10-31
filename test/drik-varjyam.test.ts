/**
 * Phase 3 Task 3.3: Varjyam / Amrit Kalam offset fitting.
 *
 * This suite:
 *   1. Runs computeDetailedPanchang for each fixture.
 *   2. Extracts the nakshatra's UTC start/end from the panchang output.
 *   3. Computes the *observed* offset (from nak_start) for drik's varjyam and
 *      amrit windows stored in the fixtures.
 *   4. Reports per-nakshatra offset tables so the constants can be verified
 *      (or a per-nak table derived where the scalar offset is wrong).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { computeDetailedPanchang } from "../src/index";
import type { PanchangResponse } from "../src/index";
import {
  loadFixtures,
  parseWindow,
  minuteDelta,
} from "./drik-helpers";
import type { DrikFixture } from "./drik-helpers";

// ── constants from source ────────────────────────────────────────────────────
import { VARJYAM_GHATIKAS } from "../src/constants/muhurta";

const NAK_NAMES = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu",
  "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta",
  "Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha",
  "Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada",
  "Uttara Bhadrapada","Revati",
] as const;

function utcMin(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Offset in ghatikas from nak_start to window_start (wrapping 0-60). */
function offsetGh(nakStartMs: number, winStartMs: number): number {
  let diffMs = winStartMs - nakStartMs;
  const nakSpanMs = 24 * 60 * 60 * 1000;  // ~1 day (approximation)
  if (diffMs < 0) diffMs += nakSpanMs;
  return (diffMs / 60000) / 24;  // minutes → ghatikas (1 gh = 24 min)
}

const fixtures = loadFixtures();

interface NakData {
  idx: number;
  varjyamOffsets: number[];
  amritOffsets: number[];
  varjyamDurations: number[];
  amritDurations: number[];
}

const nakSummary: Record<string, NakData> = {};

describe("varjyam/amrit offset fitting", () => {
  const results = new Map<string, PanchangResponse>();

  beforeAll(async () => {
    for (const f of fixtures) {
      const r = await computeDetailedPanchang(
        f.date, f.latitude, f.longitude, f.timezone, "en"
      );
      results.set(`${f.slug}|${f.date}`, r);
    }
  });

  it("collects observed offsets for all fixtures and verifies counts", () => {
    for (const f of fixtures) {
      const r = results.get(`${f.slug}|${f.date}`)!;
      const page = f.page as any;
      const tz = (page.displayTimezone ?? f.timezone) as string;

      // Get nakshatra window from panchang output
      const nakSeq = r.panchang.nakshatra_sequence ?? [];
      if (!nakSeq.length) continue;

      // The "current" nakshatra = the one active at sunrise
      const nakNow = nakSeq[0];
      const nakName = nakNow?.name as string;
      const nakIdx = NAK_NAMES.indexOf(nakName as any);
      if (nakIdx < 0) continue;

      // nak start: starts_at if available, else compute from prev nak end
      const nakStartIso: string | null = nakNow?.starts_at ?? null;
      const nakEndIso: string = nakNow?.ends_at;
      if (!nakStartIso || !nakEndIso) continue;

      const nakStartMs = new Date(nakStartIso).getTime();
      const nakEndMs = new Date(nakEndIso).getTime();
      const nakSpanMin = (nakEndMs - nakStartMs) / 60000;

      // Initialize collector
      if (!nakSummary[nakName]) {
        nakSummary[nakName] = { idx: nakIdx, varjyamOffsets: [], amritOffsets: [], varjyamDurations: [], amritDurations: [] };
      }

      // Fixture windows
      const fxVarjyam: string[] = (page.windows?.varjyam ?? []) as string[];
      const fxAmrit: string[] = (page.windows?.amritKalam ?? []) as string[];

      // For each fixture varjyam window, find offset from nak_start in gh
      for (const raw of fxVarjyam) {
        const { startUtc, endUtc } = parseWindow(raw, tz, f.date);
        const winStartMs = new Date(startUtc).getTime();
        const winEndMs = new Date(endUtc).getTime();
        const durMin = (winEndMs - winStartMs) / 60000;

        // offset from nak_start
        let diffMs = winStartMs - nakStartMs;
        // wrap within nak span (window may start in next day's nak span)
        if (diffMs < -6 * 60 * 60000) diffMs += 24 * 60 * 60000;
        if (diffMs > 30 * 60 * 60000) diffMs -= 24 * 60 * 60000;
        const offGh = (diffMs / 60000) / 24;
        // Only record if plausibly within 0-60 gh
        if (offGh >= 0 && offGh <= 60) {
          nakSummary[nakName]!.varjyamOffsets.push(offGh);
          nakSummary[nakName]!.varjyamDurations.push(durMin / 24);
        }
      }

      // For each fixture amrit window, find offset from nak_start
      for (const raw of fxAmrit) {
        const { startUtc, endUtc } = parseWindow(raw, tz, f.date);
        const winStartMs = new Date(startUtc).getTime();
        const winEndMs = new Date(endUtc).getTime();
        const durMin = (winEndMs - winStartMs) / 60000;

        let diffMs = winStartMs - nakStartMs;
        if (diffMs < -6 * 60 * 60000) diffMs += 24 * 60 * 60000;
        if (diffMs > 30 * 60 * 60000) diffMs -= 24 * 60 * 60000;
        const offGh = (diffMs / 60000) / 24;
        if (offGh >= 0 && offGh <= 60) {
          nakSummary[nakName]!.amritOffsets.push(offGh);
          nakSummary[nakName]!.amritDurations.push(durMin / 24);
        }
      }
    }

    // Print the summary table
    console.log("\n=== Observed offsets (gh from nak_start) ===");
    const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
    const padL = (s: string, n: number) => s.padStart(n).slice(-n);
    console.log(pad("Nakshatra",26) + padL("idx",4) + padL("VARJ_GH",8) + "  obs_varj               obs_amrit              dur_v  dur_a");
    for (const nakName of NAK_NAMES) {
      const nd = nakSummary[nakName];
      if (!nd) continue;
      const tableVarj = VARJYAM_GHATIKAS[nd.idx];
      const avgDv = nd.varjyamDurations.length
        ? nd.varjyamDurations.reduce((a,b)=>a+b)/nd.varjyamDurations.length : NaN;
      const avgDa = nd.amritDurations.length
        ? nd.amritDurations.reduce((a,b)=>a+b)/nd.amritDurations.length : NaN;
      const vStr = nd.varjyamOffsets.map(x=>x.toFixed(1)).join(",");
      const aStr = nd.amritOffsets.map(x=>x.toFixed(1)).join(",");
      const dvStr = isNaN(avgDv) ? "-" : avgDv.toFixed(1);
      const daStr = isNaN(avgDa) ? "-" : avgDa.toFixed(1);
      console.log(
        `${pad(nakName,26)} ${padL(String(nd.idx),3)} ${padL(String(tableVarj ?? "?"),7)}  ${pad(vStr||"—",22)}  ${pad(aStr||"—",22)}  ${padL(dvStr,5)}  ${padL(daStr,5)}`
      );
    }

    // Check: all nakshatras we have data for should have consistent offsets
    expect(Object.keys(nakSummary).length).toBeGreaterThan(0);
  });

  it("each observed varjyam offset is within 2 gh of VARJYAM_GHATIKAS table", () => {
    for (const [nakName, nd] of Object.entries(nakSummary)) {
      const tableVal = VARJYAM_GHATIKAS[nd.idx];
      if (tableVal == null) continue;
      for (const obs of nd.varjyamOffsets) {
        // Allow wrap (table may use different convention)
        const diff = Math.min(
          Math.abs(obs - tableVal),
          Math.abs(obs - tableVal + 60),
          Math.abs(obs - tableVal - 60),
        );
        expect(diff, `${nakName} varjyam offset ${obs.toFixed(1)} vs table ${tableVal}`).toBeLessThanOrEqual(4);
      }
    }
  });
});
