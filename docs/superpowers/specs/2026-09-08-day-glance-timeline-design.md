# Day at a Glance — 24h Muhurta Timeline — Design

**Date:** 2026-09-08
**Status:** Approved (design presented and confirmed by user)

## Goal

Replace the ECharts strip in the "Day at a glance — all muhurta windows" section of the demo with a pure-SVG, fixed 24h horizontal timeline showing all muhurta windows as colored bands, with a live tz-aware now-marker that moves one second at a time and an HH:MM:SS readout at the horizontal center of the widget.

## Decisions (user-confirmed)

- **Form:** linear horizontal 24h bar (00:00 left → 24:00 right) — not a circular dial.
- **Now indicator:** fixed 24h scale; a vertical now-line slides right (one px per second); current time (HH:MM:SS) is read out at the horizontal center of the widget. Both in the chart timezone `state.tz`, not the browser's local timezone.
- **Layout:** stacked bands, one per category (readable with ~60 windows).

## Design

### Widget: `timelineBar(opts)` (new, in `example/app.js`, mirroring `clockDial` construction style)

- Pure SVG via `document.createElementNS` — no ECharts. No new dependencies.
- `viewBox="0 0 1000 340"`, rendered `width:100%; max-width:900px`.
- Fixed 24h scale: tz-midnight at x=0, 24:00 at x=1000. Plot area: left label column `PLOT_L=118`, right edge `PLOT_R=990`.
- Hour ticks (24 vertical lines, `opacity .3`) + light half-hour ticks (`opacity .15`); hour labels `00..23` below the bands.
- Center time readout: text `.tl-now-time` at x=500, top of widget.

### Bands (top→bottom), each a labeled row

| Band | Sources (all from `p`) | Color |
|---|---|---|
| Muhurtas | `auspicious_timings.{brahma_muhurta, pratah_sandhya, abhijit, vijay_muhurta, godhuli_muhurta, sayahna_sandhya, nishita_muhurta}` | green |
| Yogas | `auspicious_timings.{amrit_kalam[], sarvartha_siddhi_yoga[], amrita_siddhi_yoga[]}` | green |
| Gowri Panchang | `gowri_panchang.day` + `.night` (label `s.name` / `s.name + " (night)"`) | green if `s.auspicious`, red if not |
| Hora | `hora.day` (label `s.name`) + `hora.night` (label `s.name + " hora (night)"`) | green if `s.auspicious`, red if not |
| Nalla Neram | `nalla_neram[]` (label "Nalla Neram") | green |
| Inauspicious | `inauspicious_timings.{rahu_kalam, yamaganda, gulika_kalam}` + `.dur_muhurtam[]` + `.bhadra[]` + `.varjyam[]` | red |

- Each segment: rounded rect (`rx=3`), class `seg-good` (fill `#2a9d4f`) or `seg-bad` (fill `#d73a49`), with `<title>` tooltip `Label · fmtDMin(start)–fmtDMin(end)`.
- Segment positions: `x = PLOT_L + (min / 1440) * PLOT_W` where `PLOT_W = PLOT_R - PLOT_L`, from `dMin(start)`/`dMin(end)` clamped to `[0, 1440]`. Zero-width segments skipped. If `start > end` (window crosses midnight), split into `[0, end]` and `[start, 1440]` (skipping degenerate halves).

### Now-marker + shared ticker

- The now-line `<line class="tl-now">` carries `data-x0` and `data-x1` (the plot span) and spans the band area vertically.
- Extend the existing shared `stepClockNow()` (single idempotent `setInterval`, 1s): after the existing `.clock-now`/`.clock-now-time` updates, also set `x1`/`x2` of every `.tl-now` to `x0 + frac * (x1 - x0)` and set every `.tl-now-time` text to the same `HH:MM:SS` `t` string. Reuse the already-computed `frac` and `t`.
- `nowInTz()` already returns `{h,min,s}` in `state.tz` — unchanged.

### renderDayGlance changes

- Keep building the same `items` list; group into the six bands above; drop the `chartEl()`/`renderStrip` call (remove the ECharts canvas from this section only); append `timelineBar({ bands, showNow: true })`.
- Keep: section title "Day at a glance — all muhurta windows", legacy legend chips (good/bad), TS snippet, and the JSON 5th arg (unchanged).
- `renderStrip` stays defined — still used at `:842` and `:1420`.

### CSS (`example/index.html`)

`.timeline`, `.seg-good`, `.seg-bad`, `.tl-now`, `.tl-now-time`, `.tl-tick`, `.tl-half`, `.tl-hlabel`, `.tl-band-label` — palette matches the clock (green `#2a9d4f`, red `#d73a49`, now blue `#0969da`, muted tick color).

## Verification

New `/tmp/demo-check.js` subcommand `glance`:
- navigate `#panchang`; find section whose `h3` starts with "Day at a glance";
- assert: 1 `svg.timeline`; **no** `<canvas>` in the section; ≥40 `seg-good`+`seg-bad`; `.tl-now` present; `.tl-now-time` matches `/^\d{2}:\d{2}:\d{2}$/`;
- re-read `.tl-now` `x1` after 2.1s → must differ (marker moves);
- `errors: []`.

Existing suite must stay green (`json`, `hora`, `nalla`, `alljson`, `summary` — section titles, JSON counts, and clock assertions unchanged).