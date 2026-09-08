# Demo: 24h Clock Dials + Click-to-Expand JSON — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unreadable Hora/Nalla Neram ECharts strips with pure-SVG 24h clock dials (green Nalla Neram zones, colored hora arcs, a live tz-aware "now" hand), and add live click-to-expand "Example JSON response" blocks to every panchang (22) and kundali (10) section.

**Architecture:** All code lives in `example/app.js` (renderers) and `example/index.html` (CSS only). New `jsonToggle(data)` returns a `<details>` block wired into `section()` via an optional 5th arg; new `clockDial(opts)` builds an inline SVG dial; a single shared 1s `setInterval` animates every `.clock-now` hand. No ECharts in the two reworked sections; ECharts stays untouched everywhere it works.

**Tech Stack:** Plain TS-in-JS demo (`example/app.js`), inline SVG, native `<details>`/`<summary>`, `Intl.DateTimeFormat`, ECharts (unchanged elsewhere), Node + headless Chromium CDP for verification.

## Global Constraints

- Library (`src/`) and its tests must not change; `npx vitest run` must stay green (464 tests).
- No new runtime dependencies. Clocks are pure SVG; JSON uses native `<details>`.
- ECharts is removed **only** from Hora and Nalla Neram. It stays in: Gowri, Day at a glance, D1 wheel, Ashtakavarga, dasha strip, and Panchang (now) — none of those sections are touched except to add the JSON toggle.
- Existing TS snippets shown per section are unchanged.
- JSON responses are **live** data for the current inputs (drawn from the `p`/`c` object already in scope in each renderer).
- The "now" hand uses the chart timezone `state.tz` (via `Intl.DateTimeFormat`), not the browser's local timezone.
- Verification is headless-browser based (no DOM test framework exists in the repo): a shared probe `/tmp/demo-check.js` is the "test suite"; each task runs it before (expect fail) and after (expect pass) the change.

---

### Task 1: `jsonToggle` helper + `section()` JSON param + CSS (anchor section)

**Files:**
- Modify: `example/app.js` — `section()` (~lines 70-88), add `jsonToggle()` near `chip()`; wire one anchor section.
- Modify: `example/index.html` — add `.api-json` CSS in the existing `<style>` block.
- Create: `/tmp/demo-check.js` — shared CDP probe with a `json` subcommand.

**Interfaces:**
- Produces: `jsonToggle(data)` → `<details class="api-json">` element.
- Produces: `section(container, title, content, snippet, json)` — optional 5th param; when `json !== undefined`, appends `jsonToggle(json)` after the snippet.
- Produces: `/tmp/demo-check.js json <tab> <expected>` — asserts `<template>` count of `details.api-json` inside the given view's `section.card`s.

- [ ] **Step 1: Write the failing probe**

Create `/tmp/demo-check.js`:

```js
// Shared demo verification probe. Usage:
//   node /tmp/demo-check.js json panchang 1    (or: kundali)
//   node /tmp/demo-check.js hora
//   node /tmp/demo-check.js nalla
//   node /tmp/demo-check.js summary
const { spawn } = require("child_process");
const { writeFileSync } = require("fs");
const PORT = 9231;
const BASE = process.env.DEMO_BASE || "http://localhost:8095/";
const cmd = process.argv[2], arg2 = process.argv[3];
const chrome = spawn("/Applications/Chromium.app/Contents/MacOS/Chromium", [
  "--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/demochk-" + Date.now(), "--window-size=1440,3000", "about:blank",
], { stdio: "ignore" });
async function waitWs() {
  for (let i = 0; i < 50; i++) {
    try { const ts = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
      const p = ts.find(t => t.type === "page"); if (p && p.webSocketDebuggerUrl) return p; } catch (e) {}
    await new Promise(r => setTimeout(r, 200)); }
  throw new Error("no cdp");
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function main() {
  const page = await waitWs();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === "Runtime.consoleAPICalled" && ["error","assert"].includes(m.params.type)) errors.push(m.params.args.map(a=>a.value||"").join(" "));
    if (m.method === "Runtime.exceptionThrown") errors.push((m.params.exceptionDetails.exception&&m.params.exceptionDetails.exception.description)||m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
  await new Promise(res => (ws.onopen = res));
  await send("Page.enable"); await send("Runtime.enable");
  async function navWait(hash, sel, maxMs) {
    await send("Page.navigate", { url: BASE + "index.html#" + hash });
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      const r = await send("Runtime.evaluate", { expression: `document.querySelectorAll(${JSON.stringify(sel)}).length`, returnByValue: true });
      if (r.result.result.value > 0) return;
      await sleep(400);
    }
    throw new Error("render timeout for " + hash + " / " + sel);
  }
  async function ev(expression) {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error("eval failed: " + JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  }
  if (cmd === "json") {
    const tab = (arg2 === "kundali") ? "kundali" : "panchang";
    await navWait(tab, "#" + tab + "-view section.card", 30000);
    const got = await ev(`(() => {
      const secs = document.querySelectorAll("#${tab}-view section.card");
      const withJson = Array.from(secs).filter(s => s.querySelectorAll("details.api-json").length === 1 && s.querySelector("details.api-json pre").textContent.trim().length > 0);
      return { total: secs.length, withJson: withJson.length };
    })()`);
    console.log("json:", JSON.stringify(got));
    if (got.withJson < Number(process.argv[4])) { console.error("FAIL: expected >= " + process.argv[4] + " sections with JSON, got " + got.withJson); process.exit(1); }
  }
  console.log("errors:", JSON.stringify(errors));
  process.exit(0);
}
main().catch(e => { console.error("FAIL", e.message); process.exit(1); });
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `node /tmp/demo-check.js json panchang 1`
Expected: FAIL (`withJson: 0` — no section has a `details.api-json` yet).

- [ ] **Step 3: Add `jsonToggle` + `section()` param**

In `example/app.js`, after the `chip()` helper (~line 66), add:

```js
  function jsonToggle(data) {
    var det = el("details", "api-json");
    det.appendChild(el("summary", null, "Example JSON response"));
    var pre = el("pre");
    pre.textContent = JSON.stringify(data, null, 2);
    det.appendChild(pre);
    return det;
  }
```

In `section()` (currently `function section(container, title, content, snippet)`), change the signature and add the JSON block right before `container.appendChild(sec);`:

```js
  function section(container, title, content, snippet, json) {
    var sec = el("section", "card");
    sec.appendChild(el("h3", "section-title", title));
    if (content) sec.appendChild(content);
    if (snippet) {
      var pre = el("pre", "code-block");
      var code = el("code", "language-ts");
      code.textContent = snippet;
      // tag input shown even if a CDN loaded hljs
      pre.classList.add("hli");
      pre.appendChild(code);
      sec.appendChild(pre);
      if (hljs) hljs.highlightElement(code);
    }
    if (json !== undefined) sec.appendChild(jsonToggle(json));
    container.appendChild(sec);
    resizeCharts(sec);
  }
```

- [ ] **Step 4: Wire the anchor section**

In `renderedPanchang(p)`, the "Sun & Moon timings" section (currently `section(view, "Sun & Moon timings", table(...), panelSnippet(panchangCall(), "p.sun_moon.sunrise, p.sun_moon.sunset"));` ~line 351) — add the 5th argument so it ends with `..., panelSnippet(panchangCall(), "p.sun_moon.sunrise, p.sun_moon.sunset"), p.sun_moon);`.

- [ ] **Step 5: Add CSS**

In `example/index.html` `<style>`, near the `.code-block` rules, add:

```css
.api-json { margin-top: 12px; border-top: 1px dashed var(--line); padding-top: 8px; }
    .api-json summary { cursor: pointer; font-size: 12px; color: var(--accent); user-select: none; }
    .api-json pre { max-height: 320px; overflow: auto; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-word; background: #f6f8fa; border: 1px solid var(--line); border-radius: 6px; padding: 10px; }
```

- [ ] **Step 6: Serve locally and run probe**

Run: `npm run example:build && DEMO_BASE=http://localhost:8095/ PORT=8095 node example/serve.js &`
Run: `node /tmp/demo-check.js json panchang 1`
Expected: PASS (`withJson >= 1`), `errors: []`.

- [ ] **Step 7: Commit**

```bash
git add example/app.js example/index.html
git commit -m "feat(example): click-to-expand live JSON response blocks for demo sections"
```

---

### Task 2: `clockDial` SVG widget + now-hand ticker + Hora rework

**Files:**
- Modify: `example/app.js` — add clock helpers (near `renderStrip`), replace `renderHora()` body.
- Modify: `example/index.html` — add `.clock*` CSS.

**Interfaces:**
- Consumes: `dMin(iso)`, `fmtDMin(minutes)` (already exist at `example/app.js:146,157`), `el()`, `table()`, `chip()`, `section(..., json)`.
- Produces: `clockDial({ title, zones, showNow })` → SVG element. `zones` = `[{ startMin, endMin, cls: "good"|"bad"|"neutral", label, labelText? }]`. Classes on SVG: `.clock`, `.ring`, `.arc-neutral`, `.arc-good`, `.arc-bad`, `.arc-label`, `.tick`, `.hlabel`, `.clock-now`, `.clock-now-dot`, `.clock-now-time`, `.clock-title`.
- Produces: `clockNowTimer` (module-level), `nowInTz()`, `stepClockNow()`, `startClockNow()` (idempotent).

- [ ] **Step 1: Write the failing probe**

In `/tmp/demo-check.js`, inside `main()` before `if (cmd === "json")`, add:

```js
  if (cmd === "hora") {
    await navWait("panchang", "#panchang-view section.card", 30000);
    const got = await ev(`(() => {
      const sec = Array.from(document.querySelectorAll("#panchang-view section.card")).find(s => /Hora /.test(s.querySelector("h3").textContent));
      const arcs = sec.querySelectorAll(".clock .arc-good, .clock .arc-bad");
      const rows = sec.querySelectorAll("table tr");
      return { arcs: arcs.length, rows: rows.length, hasHand: sec.querySelectorAll(".clock-now").length === 1, hasClock: sec.querySelectorAll("svg.clock").length === 1 };
    })()`);
    console.log("hora:", JSON.stringify(got));
    if (!(got.hasClock && got.arcs === 24 && got.rows === 25 && got.hasHand)) { console.error("FAIL hora"); process.exit(1); }
  }
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `node /tmp/demo-check.js hora`
Expected: FAIL (`hasClock: false`, arcs 0).

- [ ] **Step 3: Add clock helpers** (insert before `function renderStrip`)

```js
  // ── 24h clock (pure SVG, no ECharts) ───────────────────────────────────

  function clockPolar(cx, cy, r, frac) {
    var a = Math.PI * 2 * frac - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function clockArcPath(cx, cy, r0, r1, f0, f1) {
    var large = f1 - f0 > 0.5 ? 1 : 0;
    var o0 = clockPolar(cx, cy, r0, f0), o1 = clockPolar(cx, cy, r0, f1);
    var i0 = clockPolar(cx, cy, r1, f0), i1 = clockPolar(cx, cy, r1, f1);
    return ["M", o0[0], o0[1], "A", r0, r0, 0, large, 1, o1[0], o1[1],
      "L", i1[0], i1[1], "A", r1, r1, 0, large, 0, i0[0], i0[1], "Z"].join(" ");
  }

  function clockDial(opts) {
    var NS = "http://www.w3.org/2000/svg";
    var size = 500, cx = size / 2, cy = size / 2;
    var R_ARC0 = 214, R_ARC1 = 168, R_TICKS = 216, R_ANN = 232, R_LABEL = 134;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "clock");
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);

    var ring = document.createElementNS(NS, "circle");
    ring.setAttribute("class", "ring");
    ring.setAttribute("cx", cx); ring.setAttribute("cy", cy); ring.setAttribute("r", R_ANN);
    svg.appendChild(ring);

    var base = document.createElementNS(NS, "path");
    base.setAttribute("class", "arc-neutral");
    base.setAttribute("d", clockArcPath(cx, cy, R_ARC0, R_ARC1, 0, 1));
    svg.appendChild(base);

    (opts.zones || []).forEach(function (z) {
      if (z.endMin <= z.startMin) return;
      var f0 = z.startMin / 1440, f1 = z.endMin / 1440;
      var g = document.createElementNS(NS, "g");
      var p = document.createElementNS(NS, "path");
      p.setAttribute("class", "arc-" + (z.cls || "neutral"));
      p.setAttribute("d", clockArcPath(cx, cy, R_ARC0, R_ARC1, f0, f1));
      var tip = document.createElementNS(NS, "title");
      tip.textContent = z.label + " · " + fmtDMin(z.startMin) + "–" + fmtDMin(z.endMin);
      g.appendChild(tip);
      g.appendChild(p);
      if (z.labelText) {
        var mid = (f0 + f1) / 2;
        var pos = clockPolar(cx, cy, (R_ARC0 + R_ARC1) / 2, mid);
        var rot = mid * 360;
        if (rot > 90 && rot < 270) rot += 180;
        var txt = document.createElementNS(NS, "text");
        txt.setAttribute("class", "arc-label");
        txt.setAttribute("x", pos[0]); txt.setAttribute("y", pos[1]);
        txt.setAttribute("transform", "rotate(" + rot.toFixed(1) + " " + pos[0] + " " + pos[1] + ")");
        txt.textContent = z.labelText;
        g.appendChild(txt);
      }
      svg.appendChild(g);
    });

    for (var h = 0; h < 24; h++) {
      var f = h / 24;
      var t0 = clockPolar(cx, cy, R_TICKS, f);
      var t1 = clockPolar(cx, cy, R_ARC1, f);
      var tk = document.createElementNS(NS, "line");
      tk.setAttribute("class", "tick");
      tk.setAttribute("x1", t0[0]); tk.setAttribute("y1", t0[1]);
      tk.setAttribute("x2", t1[0]); tk.setAttribute("y2", t1[1]);
      svg.appendChild(tk);
      var lpos = clockPolar(cx, cy, R_LABEL, f + 1 / 48);
      var lb = document.createElementNS(NS, "text");
      lb.setAttribute("class", "hlabel");
      lb.setAttribute("x", lpos[0]); lb.setAttribute("y", lpos[1]);
      lb.textContent = String(h).padStart(2, "0");
      svg.appendChild(lb);
    }
    for (var m = 0; m < 48; m++) {
      var fm = (m + 0.5) / 48;
      var a0 = clockPolar(cx, cy, 202, fm);
      var a1 = clockPolar(cx, cy, 186, fm);
      var mk = document.createElementNS(NS, "line");
      mk.setAttribute("class", "tick");
      mk.setAttribute("x1", a0[0]); mk.setAttribute("y1", a0[1]);
      mk.setAttribute("x2", a1[0]); mk.setAttribute("y2", a1[1]);
      svg.appendChild(mk);
    }

    var title = document.createElementNS(NS, "text");
    title.setAttribute("class", "clock-title");
    title.setAttribute("x", cx); title.setAttribute("y", cy - 4);
    title.textContent = opts.title || "";
    svg.appendChild(title);
    var nowTxt = document.createElementNS(NS, "text");
    nowTxt.setAttribute("class", "clock-now-time");
    nowTxt.setAttribute("x", cx); nowTxt.setAttribute("y", cy + 20);
    nowTxt.textContent = "--:--:--";
    svg.appendChild(nowTxt);

    if (opts.showNow) {
      var h0 = clockPolar(cx, cy, 10, 0.25);
      var h1 = clockPolar(cx, cy, R_ARC1 - 4, 0.25);
      var hand = document.createElementNS(NS, "line");
      hand.setAttribute("class", "clock-now");
      hand.setAttribute("data-cx", cx); hand.setAttribute("data-cy", cy);
      hand.setAttribute("x1", h0[0]); hand.setAttribute("y1", h0[1]);
      hand.setAttribute("x2", h1[0]); hand.setAttribute("y2", h1[1]);
      hand.setAttribute("transform", "rotate(-90 " + cx + " " + cy + ")");
      svg.appendChild(hand);
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "clock-now-dot");
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
      dot.setAttribute("r", 7);
      svg.appendChild(dot);
    }
    startClockNow();
    return svg;
  }

  var clockNowTimer = null;
  function nowInTz() {
    try {
      var s = new Intl.DateTimeFormat("en", {
        timeZone: state.tz, hourCycle: "h23",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }).format(new Date());
      var mm = /^(\d{1,2}):(\d{1,2}):(\d{1,2})/.exec(s);
      return mm ? { h: Number(mm[1]), min: Number(mm[2]), s: Number(mm[3]) } : null;
    } catch (e) { return null; }
  }
  function stepClockNow() {
    var n = nowInTz();
    if (!n) return;
    var frac = (n.h * 3600 + n.min * 60 + n.s) / 86400;
    var ang = frac * 360 - 90;
    document.querySelectorAll(".clock-now").forEach(function (ln) {
      var cxx = ln.getAttribute("data-cx"), cyy = ln.getAttribute("data-cy");
      ln.setAttribute("transform", "rotate(" + ang.toFixed(3) + " " + cxx + " " + cyy + ")");
    });
    var t = String(n.h).padStart(2, "0") + ":" + String(n.min).padStart(2, "0") + ":" + String(n.s).padStart(2, "0");
    document.querySelectorAll(".clock-now-time").forEach(function (el2) { el2.textContent = t; });
  }
  function startClockNow() {
    if (clockNowTimer) return;
    stepClockNow();
    clockNowTimer = setInterval(stepClockNow, 1000);
  }
```

- [ ] **Step 4: Replace `renderHora` body**

Replace the whole current `renderHora` function (lines ~675-696) with:

```js
  function renderHora(view, hora) {
    var box = el("div");
    var zones = hora.day.concat(hora.night).map(function (s) {
      return {
        startMin: dMin(s.start), endMin: dMin(s.end),
        cls: s.auspicious ? "good" : "bad",
        label: s.name + " hora (" + (s.auspicious ? "good" : "avoid") + ")",
        labelText: s.name,
      };
    });
    box.appendChild(clockDial({ title: "Hora", zones: zones, showNow: true }));
    var rows = hora.day.map(function (s) {
      return [s.name, "Day", fmtTzAuto(s.start), fmtTzAuto(s.end), s.auspicious ? "Good" : "Avoid"];
    }).concat(hora.night.map(function (s) {
      return [s.name, "Night", fmtTzAuto(s.start), fmtTzAuto(s.end), s.auspicious ? "Good" : "Avoid"];
    }));
    box.appendChild(table(["Planet", "Day/Night", "Start", "Finish", "Status"], rows));
    var legend = el("div", "legend");
    legend.appendChild(chip("good", "good hora"));
    legend.appendChild(chip("bad", "avoiding hora"));
    box.appendChild(legend);
    section(view, "Hora (planetary hours)", box, panelSnippet(panchangCall(), "p.hora.day, p.hora.night"), hora);
  }
```

- [ ] **Step 5: Add clock CSS** (in `example/index.html` `<style>`):

```css
.clock { width: 100%; max-width: 560px; margin: 0 auto; display: block; }
    .clock .ring { fill: #f6f8fa; stroke: var(--line); stroke-width: 1.5; }
    .clock .arc-neutral { fill: #e3e6ea; }
    .clock .arc-good { fill: #2a9d4f; stroke: #fff; stroke-width: 1; }
    .clock .arc-bad { fill: #d73a49; stroke: #fff; stroke-width: 1; }
    .clock .tick { stroke: var(--muted); stroke-width: 1; opacity: 0.55; }
    .clock .hlabel { font-size: 11px; fill: var(--muted); text-anchor: middle; }
    .clock .arc-label { font-size: 11px; font-weight: 700; fill: #fff; text-anchor: middle; paint-order: stroke; stroke: rgba(0,0,0,0.45); stroke-width: 3px; }
    .clock .clock-now { stroke: #0969da; stroke-width: 3; stroke-linecap: round; }
    .clock .clock-now-dot { fill: #0969da; }
    .clock .clock-now-time { font-size: 16px; font-weight: 700; fill: #0969da; text-anchor: middle; }
    .clock .clock-title { font-size: 13px; fill: var(--muted); text-anchor: middle; }
```

- [ ] **Step 6: Run probe (server running from Task 1)**

Run: `node /tmp/demo-check.js hora`
Expected: PASS (`arcs: 24`, `rows: 25`, `hasHand: true`), `errors: []`. (The hand ticks 1°/240 per second; not asserted numerically here — Task 6 asserts the transform changes.)

- [ ] **Step 7: Commit**

```bash
git add example/app.js example/index.html
git commit -m "feat(example): 24h SVG clock with live tz-aware now hand for planetary hours"
```

---

### Task 3: Nalla Neram clock

**Files:**
- Modify: `example/app.js` — replace `renderNallaNeram()` body.

**Interfaces:**
- Consumes: `clockDial({ title, zones, showNow })` from Task 2.
- Produces: n/a (drops the ECharts strip for Nalla Neram only).

- [ ] **Step 1: Write the failing probe**

In `/tmp/demo-check.js`, add:

```js
  if (cmd === "nalla") {
    await navWait("panchang", "#panchang-view section.card", 30000);
    const got = await ev(`(() => {
      const sec = Array.from(document.querySelectorAll("#panchang-view section.card")).find(s => s.querySelector("h3") && s.querySelector("h3").textContent === "Nalla Neram");
      const green = sec.querySelectorAll(".clock .arc-good").length;
      const rows = sec.querySelectorAll("table tbody tr").length;
      return { green: green, rows: rows, hasHand: sec.querySelectorAll(".clock-now").length === 1 };
    })()`);
    console.log("nalla:", JSON.stringify(got));
    if (!(got.green >= 1 && got.green === got.rows && got.hasHand)) { console.error("FAIL nalla (green arcs should equal table rows)"); process.exit(1); }
  }
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `node /tmp/demo-check.js nalla`
Expected: FAIL (`green: 0` — old section has an ECharts canvas, not an SVG clock).

- [ ] **Step 3: Replace `renderNallaNeram` body** (lines ~698-715) with:

```js
  function renderNallaNeram(view, windows) {
    var box = el("div");
    var zones = windows.map(function (w) {
      return { startMin: dMin(w.start), endMin: dMin(w.end), cls: "good", label: "Nalla Neram" };
    });
    box.appendChild(clockDial({ title: "Nalla Neram", zones: zones, showNow: true }));
    box.appendChild(
      table(
        ["Nalla Neram (good time)", "From", "To"],
        windows.map(function (w) {
          return ["Nalla Neram", fmtTzAuto(w.start), fmtTzAuto(w.end)];
        })
      )
    );
    section(view, "Nalla Neram", box, panelSnippet(panchangCall(), "p.nalla_neram"), windows);
  }
```

- [ ] **Step 4: Run probe**

Run: `node /tmp/demo-check.js nalla`
Expected: PASS (green arcs count equals Nalla Neram table rows), `errors: []`.

- [ ] **Step 5: Commit**

```bash
git add example/app.js
git commit -m "feat(example): 24h clock with green Nalla Neram zones replaces strip chart"
```

---

### Task 4: JSON toggles for remaining panchang sections (19)

**Files:**
- Modify: `example/app.js` — add 5th arg to the remaining inline `section(...)` calls in `renderedPanchang` and to the `section()` calls inside `renderGowri`, `renderTyajyam`, `renderDayGlance`.

**Interfaces:**
- Consumes: `section(..., json)` from Task 1, `jsonToggle(data)`.
- Produces: all 22 panchang sections render exactly one `details.api-json` each.

- [ ] **Step 1: Write the failing probe** — extend `/tmp/demo-check.js`:

```js
  if (cmd === "alljson") {
    const tab = (arg2 === "kundali") ? "kundali" : "panchang";
    await navWait(tab, "#" + tab + "-view section.card", 40000);
    const got = await ev(`(() => {
      const secs = Array.from(document.querySelectorAll("#${tab}-view section.card"));
      const bad = secs.filter(s => s.querySelectorAll("details.api-json").length !== 1 || s.querySelector("details.api-json pre").textContent.trim().length === 0);
      return { total: secs.length, bad: bad.map(s => s.querySelector("h3").textContent) };
    })()`);
    console.log("alljson:", JSON.stringify(got));
    if (got.bad.length) { console.error("FAIL: sections missing/malformed JSON:", JSON.stringify(got.bad)); process.exit(1); }
  }
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `node /tmp/demo-check.js alljson panchang`
Expected: FAIL — 21 sections listed in `bad` (only "Sun & Moon timings" passes so far).

- [ ] **Step 3: Add the 5th argument to each section call**

In `renderedPanchang(p)`:

| Section | 5th arg (`json`) |
|---|---|
| "Panchang overview" (~348) | `p.panchang` |
| "Vara & Paksha" (~371) | `{ vara: p.vara, paksha: p.panchang.paksha }` |
| "Panchang (now)" (~397) | `p.panchang` |
| 4× sequence loop (~399) | `p.panchang[kind + "_sequence"]` |
| "Rashi & Nakshatra" (~431) | `p.rashi_nakshatra` |
| "Calendars" (~469) | `{ lunar_month: p.lunar_month, calendars: p.calendars, tamil_calendar: p.tamil_calendar }` |
| "Ritu & Ayana" (~477) | `p.ritu_ayana` |
| "Auspicious timings" (~509) | `p.auspicious_timings` |
| "Inauspicious timings" (~531) | `p.inauspicious_timings` |
| "Udaya Lagna" (~539) | `p.udaya_lagna` |
| "Chandrabalam & Tarabalam" (~569) | `{ chandrabalam: p.chandrabalam, tarabalam: p.tarabalam }` |
| "Shool & Vasa" (~572) | `p.shool_vasa` |
| "Ganda Mula & Ravi Yoga" (~607) | `p.yogas_extra` |

In renderer functions:

- `renderGowri(view, gowri)` — its `section(...)` call: add `, gowri` (5th arg).
- `renderTyajyam(view, t)` — its `section(...)` call: add `, t`.
- `renderDayGlance(view, p)` — its `section(...)` call: add `, { auspicious_timings: p.auspicious_timings, inauspicious_timings: p.inauspicious_timings, gowri_panchang: p.gowri_panchang, hora: p.hora, nalla_neram: p.nalla_neram }`.

(Hora and Nalla Neram already got theirs in Tasks 2-3.) Do NOT touch the single-line "Panchang overview" snippet text.

- [ ] **Step 4: Run probe**

Run: `node /tmp/demo-check.js alljson panchang`
Expected: PASS — `bad: []`, total 22.

- [ ] **Step 5: Commit**

```bash
git add example/app.js
git commit -m "feat(example): live JSON responses for all remaining panchang sections"
```

---

### Task 5: JSON toggles for kundali sections (10)

**Files:**
- Modify: `example/app.js` — `renderedKundali(c)` inline sections + the renderer functions `renderD1`, `renderVargas`, `renderAshtakavarga`, `renderDasha`, `renderKarakas`, `renderKalsarpa`, `renderFriendships`, `renderDrishti`.

**Interfaces:**
- Consumes: `section(..., json)` from Task 1.
- Produces: all 10 kundali sections render exactly one `details.api-json` each.

- [ ] **Step 1: Run probe to verify it fails**

Run: `node /tmp/demo-check.js alljson kundali`
Expected: FAIL — all 10 sections in `bad` (probe added in Task 4).

- [ ] **Step 2: Add the 5th argument to each section call**

In `renderedKundali(c)`:

| Section | 5th arg |
|---|---|
| "Birth details" (~846) | `c.birth` |
| "Planets" (~882) | `c.planets_data` |

In renderer functions (their `section(...)` call):

- `renderD1(view, c)` (~980) | `c.d1_chart`
- `renderVargas(view, c)` (~1161) | `{ varga_order: c.varga_order, vargas: c.vargas }`
- `renderAshtakavarga(view, akv)` (~1219) | `akv`
- `renderDasha(view, dasha, antar)` (~1287) | `{ dasha: dasha, dasha_antar: antar }`
- `renderKarakas(view, c)` (~1307) | `{ karakas: c.karakas, karakamsa: c.karakamsa, swamsa: c.swamsa }`
- `renderKalsarpa(view, s)` (~1325) | `s`
- `renderFriendships(view, f)` (~1349) | `f`
- `renderDrishti(view, d)` (~1389) | `d`

- [ ] **Step 3: Run probe**

Run: `node /tmp/demo-check.js alljson kundali`
Expected: PASS — `bad: []`, total 10.

- [ ] **Step 4: Commit**

```bash
git add example/app.js
git commit -m "feat(example): live JSON responses for all kundali sections"
```

---

### Task 6: Full verification, screenshot, deploy

**Files:** none (verification only).

- [ ] **Step 1: Add summary probe** — extend `/tmp/demo-check.js`:

```js
  if (cmd === "summary") {
    const out = {};
    for (const tab of ["panchang", "kundali"]) {
      await navWait(tab, "#" + tab + "-view section.card", 40000);
      out[tab] = await ev(`(() => {
        const secs = document.querySelectorAll("#${tab}-view section.card");
        let jsonOk = true, noClock = true;
        secs.forEach(s => { if (s.querySelectorAll("details.api-json").length !== 1 || s.querySelector("details.api-json pre").textContent.length === 0) jsonOk = false; if (s.querySelectorAll("svg.clock").length) noClock = false; });
        return { sections: secs.length, jsonOk, clocks: !noClock };
      })()`);
    }
    await navWait("panchang", "#panchang-view section.card", 30000);
    out.handTick = await ev(`(() => {
      const h = document.querySelector(".clock-now");
      const a1 = h ? h.getAttribute("transform") : null;
      return a1;
    })()`);
    await sleep(1300);
    out.handTick2 = await ev(`(() => { const h = document.querySelector(".clock-now"); return h ? h.getAttribute("transform") : null; })()`);
    out.handMoved = out.handTick !== out.handTick2;
    out.centerTime = await ev(`document.querySelector(".clock-now-time") ? document.querySelector(".clock-now-time").textContent : null`);
    out.errors = errors;
    writeFileSync("/tmp/demo-summary.json", JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 1));
    const ok = out.panchang.jsonOk && out.kundali.jsonOk && out.panchang.clocks && out.handMoved && out.errors.length === 0;
    if (!ok) { console.error("FAIL summary"); process.exit(1); }
  }
```

- [ ] **Step 2: Run the full suite locally**

Run:
```bash
npm run example:build
node --check example/app.js
# ensure local server from Task 1 is still running on :8095, else restart it
node /tmp/demo-check.js json panchang 1
node /tmp/demo-check.js hora
node /tmp/demo-check.js nalla
node /tmp/demo-check.js alljson panchang
node /tmp/demo-check.js alljson kundali
node /tmp/demo-check.js summary
```
Expected: all PASS, `errors: []` in every run, `handMoved: true`, center time non-`--:--:--`.

Also run `npx vitest run` (expect 464 passing) and `npx tsc --noEmit` (expect clean).

- [ ] **Step 3: Screenshot sanity check (visual)**

Capture a screenshot of the panchang view showing both clocks:
```bash
"/Applications/Chromium.app/Contents/MacOS/Chromium" --headless=new --disable-gpu --no-sandbox --window-size=1440,3000 --screenshot=/tmp/demo-panchang.png "http://localhost:8095/index.html#panchang"
```
Open the PNG and confirm: hora clock has 24 colored arcs with planet labels, nalla clock has green zones + neutral ring, both hands visible, no overlapping text.

- [ ] **Step 4: Commit any leftover changes**

```bash
git status --short   # should show nothing uncommitted
```

- [ ] **Step 5: Push and verify live**

```bash
git push origin main
# wait for the deploy workflow to reach success (rhythm: poll Actions API ~10s)
```
Then run the summary probe against the live site:
```bash
DEMO_BASE=https://reflexdemon.github.io/vpv-panchangam/ node /tmp/demo-check.js summary
```
Expected: PASS with `error: []` — panchang 22 sections with clocks, kundali 10 sections all with JSON.

---

## Self-Review (performed before handoff)

**Spec coverage:**
- A (clockDial/SVG/tooltips/ticks) → Task 2.
- B (Hora clock + schedule table) → Task 2.
- C (Nalla Neram clock) → Task 3.
- D (JSON in all 32 sections) → Tasks 1, 4, 5.
- Live now hand in `state.tz`, 1s rotation → Task 2 (`nowInTz`/`stepClockNow`/`startClockNow`).
- CSS → Tasks 1 (`.api-json`) and 2 (`.clock*`).
- ECharts removed only from Hora/Nalla; kept elsewhere → Tasks 2-3 only replace those two functions; `renderStrip` remains used by Gowri/Day at a glance.
- Verification incl. screenshot → Task 6.

**Placeholder scan:** all changes include full code; no TODOs.

**Type consistency:** `section(container, title, content, snippet, json)` is introduced in Task 1 and used as `, <json>` 5th arg in Tasks 2-5 consistently. `clockDial({title, zones, showNow})` and zone shape `{startMin, endMin, cls, label, labelText?}` identical across Tasks 2-3. Probe subcommand names (`json`, `hora`, `nalla`, `alljson`, `summary`) consistent across tasks. `renderStrip` undisputed.

**Naming note:** `fmtDMin`, `dMin`, `el`, `table`, `chip`, `fmtTzAuto` all pre-exist in `example/app.js` and are reused verbatim.