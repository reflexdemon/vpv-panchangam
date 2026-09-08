# Design — Demo: Hora/Nalla Neram 24h clocks + click-to-expand JSON

Date: 2026-09-07
Scope: `example/app.js` + `example/index.html` (CSS only). No library changes.

## Problem

- The Hora (planetary hours) and Nalla Neram sections render thin ECharts time
  strips with no usable axis labels; users cannot infer what time each segment
  covers ("random lines").
- Sections show a TypeScript snippet of the API call but never show what the
  API actually returns, making it hard to trust or explore the output shape.

## Goal

1. Replace the Hora and Nalla Neram ECharts strip charts with a readable
   24-hour clock dial (pure SVG). ECharts is kept in the sections where it
   works (Day at a glance, D1 wheel, Ashtakavarga, Gowri, dasha strip) and
   removed only from Hora and Nalla Neram.
2. Add a click-to-expand "Example JSON response" block to every panchang and
   kundali section, populated with the live data for the current inputs.
3. Show a live "now" hand on the clocks, rotating every second, in the chart's
   timezone (`state.tz`), not the browser's local timezone.

## Design

### A. `clockDial({ title, zones, showNow })` — reusable SVG 24h clock

- Pure inline SVG, no ECharts, no new dependencies. Spans midnight to
  midnight (0–1440 minutes of the day).
- Visuals:
  - Outer ring, inner ring, 24 hour ticks with numeric labels (00–23), and
    30-minute minor ticks.
  - Each `zone` = `{ startMin, endMin, cls, label }`, drawn as an annular arc
    (SVG path arc) between the rings:
    - `cls "good"` → green fill (`#2a9d4f`)
    - `cls "bad"` → red fill (`#d73a49`)
    - `cls "neutral"` → grey fill (`#d8dee4`)
  - Native SVG `<title>` inside each arc → hover tooltip with times, e.g.
    "Nalla Neram · 06:30–07:45" or "Sun hora (good) · 06:21–07:15".
  - Hora arcs also print the planet short name at the arc's mid-angle
    (rotated text or positioned text, sized to fit the arc width).
- `showNow` (only for Hora and Nalla Neram clocks):
  - A colored hand (line) from the dial center to the outer edge plus a center
    dot, positioned at the current minute-of-day.
  - Center of the dial shows the live time "HH:MM:SS" in `state.tz`.
  - One shared `setInterval(1000)` created lazily; each tick queries
    `document.querySelectorAll(".clock-now")` and recomputes the rotation from
    the current time (no accumulation, no drift). Re-renders replace the DOM
    nodes, so no per-clock timer disposal is needed. The interval is started
    when the first `showNow` clock is created and never stopped (cheap; nodes
    for a hidden tab simply keep updating).
  - Current time in `state.tz` computed via
    `new Intl.DateTimeFormat("en", { timeZone: state.tz, hourCycle: "h23",
    hour: "2-digit", minute: "2-digit", second: "2-digit" })` and parsed back
    to a moment in the chart's day. Position = `(hours*60 + minutes +
    seconds/60) / 1440 * 360`.

### B. Hora section (`renderHora`)

- Remove the two ECharts strip charts (`renderStrip` calls for day/night).
- Render one `clockDial` with all 24 hora spans as zones:
  `hora.day` + `hora.night` → `{ startMin: dMin(s.start), endMin: dMin(s.end),
  cls: s.auspicious ? "good" : "bad", label: s.name }`, with the planet name
  on each arc.
- Below the clock: a **Hora schedule table** with 24 rows (12 day + 12 night)
  grouped by a "Day"/"Night" first column:
  `Planet | Day/Night | Start | Finish | Status` (Status = "Good"/"Avoid").
  Reuses the existing `table()` helper.
- Keep the good/bad legend chips.
- Section snippet: unchanged `p.hora.day, p.hora.night`.
- JSON response: `jsonToggle(hora)` with the full `hora` object.

### C. Nalla Neram section (`renderNallaNeram`)

- Remove the ECharts strip chart.
- Render one `clockDial` with each Nalla Neram window as a green zone
  (`{ startMin: dMin(w.start), endMin: dMin(w.end), cls: "good", label:
  "Nalla Neram" }`). The rest of the dial stays neutral grey (not "bad").
- Keep the existing **Nalla Neram (good time) / From / To** table below.
- Section snippet: unchanged `p.nalla_neram`.
- JSON response: `jsonToggle(windows)` with the full `windows` array.

### D. Click-to-expand JSON in all sections

- New helper `jsonToggle(data)`:
  - `<details class="api-json"><summary>Example JSON response</summary>
    <pre>JSON.stringify(data, null, 2)</pre></details>`.
  - If `data` is `undefined`/empty, still render the toggle with a `[]`/`{}`
    or a "no data" note rather than crashing.
- Appended to every one of the 22 panchang + 10 kundali sections, fed from the
  live slice each renderer already receives. Where a renderer doesn't receive
  the object (e.g., composite panels built from parts of `p`), pass the
  appropriate sub-slice (`p.*` / `c.*`). Every `section(...)` gets a JSON
  toggle; the existing TS snippet stays.
- CSS in `example/index.html`:
  - `.api-json summary` styled as a small monochrome button/link; `details`
    collapsed by default.
  - `details.api-json pre` monospace, max-height with vertical scroll,
    mono font, readable padding.

## Data flow

- Pure client-side rendering in the demo. `renderedPanchang(p)` passes `p`
  slices into each renderer; JSON toggles read the same slice at render time,
  so the shown JSON always matches the currently applied inputs. Re-computed on
  every Apply/tab switch (existing request-generation guard already prevents
  stale renders).

## Error handling

- Empty arrays render a hint ("No Nalla Neram windows today." / "No hora data.")
  and the `details` JSON still expands to the (empty) live array.
- No clock, no hand, and no JSON toggle when `state` of a required slice is
  missing — the existing banner on compute failure already covers that path.

## Verification

1. `node --check example/app.js`.
2. `npx vitest run` stays green (library untouched).
3. `npm run example:build` + local `PORT=8093 node example/serve.js`.
4. Headless CDP probe asserts, for both tabs:
   - Hora section: one SVG clock with exactly 24 arcs; schedule table with 24
     data rows; a `.clock-now` hand present.
   - Nalla Neram section: one SVG clock; number of green arcs equals the number
     of `nalla_neram` windows; From/To table rows match.
   - Every `section.card` contains exactly one `details.api-json` with a
     non-empty `<pre>`.
   - Zero console errors / exceptions.
5. Screenshot sanity check of both clocks (visual, not automated).

## Out of scope

- No changes to the library (`src/`), tests, or other example sections' visuals.
- No new runtime dependencies (clocks are pure SVG; JSON uses native `<details>`).