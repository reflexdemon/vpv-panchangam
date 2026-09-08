# Gowri Panchangam — 24h Timeline (align with Day at a glance) — Design

**Date:** 2026-09-08
**Status:** Approved (user confirmed: two bands, Day + Night)

## Goal

Replace the two ECharts strips (`renderStrip`) in the demo's **Gowri Panchangam** section with the same pure-SVG `timelineBar` used by "Day at a glance — all muhurta windows", keeping the section's existing Day/Night split as two timeline bands.

## Design

### `renderGowri` (example/app.js ~947)

- Remove `chartEl()` hosts, the `.sep` divs ("Day (sunrise → sunset)" / "Night"), and the two `renderStrip(...)` calls (the `echarts` guard for this section too).
- Build segments exactly as today: `{ start: dMin(s.start), end: dMin(s.end), label: s.name + (good/avoid), good: s.auspicious }` for `gowri.day` (band label "Day") and `gowri.night` (band label "Night").
- Render one `timelineBar({ showNow: true, bands: [Day, Night] })` into the box. If there are no segments at all, fall back to the existing `el("p", "hint", ...)` pattern used by Day at a glance.
- Keep unchanged: section title "Gowri Panchangam", legend chips, TS snippet, JSON 5th arg (`gowri`).

### Reuse — no widget changes

`timelineBar`/`timelineSeg`/`stepClockNow`/CSS are reused as-is (segments use `dMin` minutes, clamped to `[0,1440]` with midnight wrap, hover `Label · start–end` tooltips, `seg-good`/`seg-bad` palette, blue now-marker + center HH:MM:SS readout on the existing single 1s timer).

`renderStrip`/`chartEl` stay defined — still used by other sections (e.g. renderStrip at ~1576).

### Verification

New `gowri` subcommand in `/tmp/demo-check.js` (mirroring the `glance` probe):
- navigate `#panchang`; find section whose `h3` starts with "Gowri Panchangam";
- assert: 1 `svg.timeline`; 0 `canvas` in the section; ≥10 `seg-good`+`seg-bad`; `.tl-now` present; `.tl-now-time` matches `/^\d{2}:\d{2}:\d{2}$/`;
- re-read `.tl-now` `x1` after 2.1s → must differ; `errors: []`.

Existing suite stays green (`glance`, `json panchang 1` (22), `hora`, `nalla`, `alljson panchang`, `summary`). `node --check`, `npm run example:build`, `npx vitest run` (464), `npx tsc --noEmit` clean.