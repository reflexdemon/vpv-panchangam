/*! vpv-panchangam browser demo — interactive showcase of the whole library.
 *  Loaded after example/dist/vpv-demo.js (global `vpv`). ECharts + highlight.js
 *  are loaded from CDN; if they are unavailable the text output still works and
 *  charts are skipped.
 */
(function () {
  "use strict";

  var vpv = window.vpv;
  var echarts = window.echarts;
  var hljs = window.hljs;

  // ───────────────────────────── global state ─────────────────────────────

  var state = {
    date: new Date().toISOString().slice(0, 10),
    time: "12:00",
    lat: 23.1765,
    lon: 75.7885,
    tz: "Asia/Kolkata",
    ayanamsa: "lahiri",
    locale: "en",
  };

  // ───────────────────────────── dom helpers ──────────────────────────────

  function $(sel) {
    return document.querySelector(sel);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.appendChild(document.createTextNode(text));
    return n;
  }

  function clear(node) {
    disposeCharts(node);
    node.textContent = "";
  }

  function table(headers, rows, cls) {
    var t = el("table", "data-table");
    if (cls) t.classList.add(cls);
    var thead = el("thead");
    var trh = el("tr");
    headers.forEach(function (h) {
      trh.appendChild(el("th", null, h));
    });
    thead.appendChild(trh);
    t.appendChild(thead);
    var tbody = el("tbody");
    rows.forEach(function (r, ri) {
      var tr = el("tr", ri % 2 ? "alt" : "");
      r.forEach(function (c) {
        if (c instanceof Node) tr.appendChild(c);
        else tr.appendChild(el("td", null, String(c)));
      });
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    return t;
  }

  function chip(cls, text) {
    return el("span", "chip " + cls, text);
  }

  function jsonToggle(data) {
    var det = el("details", "api-json");
    det.appendChild(el("summary", null, "Example JSON response"));
    var pre = el("pre");
    var code = el("code", "language-json");
    code.textContent = JSON.stringify(data, null, 2);
    pre.classList.add("hli");
    pre.appendChild(code);
    det.appendChild(pre);
    if (hljs) hljs.highlightElement(code);
    return det;
  }

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

  // charts are mounted into detached boxes (built before section() appends
  // them), so their echarts init measures 0×0; re-measure once they are in
  // the document so every canvas gets its real size
  function resizeCharts(host) {
    if (!host || !echarts) return;
    host.querySelectorAll("[data-chart]").forEach(function (node) {
      var inst = echarts.getInstanceByDom(node);
      if (inst) inst.resize();
    });
  }

  function banner(header, detail) {
    $("#error-banner").innerHTML = "";
    $("#error-banner").appendChild(el("strong", null, header));
    $("#error-banner").appendChild(el("div", null, detail));
    $("#error-banner").classList.add("visible");
    $("#error-banner").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideBanner() {
    $("#error-banner").classList.remove("visible");
  }

  // ───────────────────────────── tz / time helpers ────────────────────────

  function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  // offset (in minutes east of UTC) for a given local date at 12:00 in state.tz
  function tzOffsetMs(dateStr) {
    var cand = new Date(dateStr + "T12:00:00Z");
    var f = new Intl.DateTimeFormat("en-CA", {
      timeZone: state.tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    var parts = {};
    f.formatToParts(cand).forEach(function (p) {
      if (p.type !== "literal") parts[p.type] = Number(p.value);
    });
    var h = parts.hour === 24 ? 0 : parts.hour;
    var localUtc = Date.UTC(parts.year, parts.month - 1, parts.day, h, parts.minute, parts.second);
    return localUtc - cand.getTime();
  }

  // UTC ms of local midnight (state.date 00:00:00 in state.tz)
  function localMidnightMs() {
    var p = state.date.split("-").map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2], 0, 0, 0) - tzOffsetMs(state.date);
  }

  // minutes since local midnight of stated date
  function dMin(iso) {
    if (!iso) return null;
    return (new Date(iso).getTime() - localMidnightMs()) / 60000;
  }

  // invert dMin → ISO, for formatting strip-chart tooltips as real datetimes
  function dMinToIso(m) {
    return new Date(localMidnightMs() + m * 60000).toISOString();
  }

  // format a strip-chart tooltip coordinate (minutes since local midnight)
  function fmtDMin(m) {
    return fmtTzAuto(dMinToIso(m));
  }

  var DUR_YEAR_ON = { year: "numeric", month: "short", day: "2-digit" };
  var DUR_TIME_ON = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };

  function fmtTz(iso, withDate) {
    if (!iso) return "—";
    var opts = Object.assign({}, DUR_TIME_ON, withDate ? DUR_YEAR_ON : {}, { timeZone: state.tz });
    return new Intl.DateTimeFormat("en-GB", opts).format(new Date(iso));
  }

  // time-only normally, includes date when the instant falls on another day
  function fmtTzAuto(iso) {
    if (!iso) return "—";
    var ms = new Date(iso).getTime();
    var day = Math.round((ms - localMidnightMs()) / 86400000);
    return fmtTz(iso, day !== 0);
  }

  // ───────────────────────────── echarts helpers ──────────────────────────

  function disposeCharts(host) {
    if (!host || !echarts) return;
    host.querySelectorAll("[data-chart]").forEach(function (node) {
      var inst = echarts.getInstanceByDom(node);
      if (inst) inst.dispose();
      node.removeAttribute("data-chart");
    });
    var inst = echarts.getInstanceByDom(host);
    if (inst) inst.dispose();
  }

  function mountChart(node, option) {
    var inst = echarts.getInstanceByDom(node) || echarts.init(node);
    node.setAttribute("data-chart", "1");
    inst.setOption(option, true);
    return inst;
  }

  function chartEl(extraClass) {
    var host = el("div", "chart-host" + (extraClass ? " " + extraClass : ""));
    return host;
  }

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

    var base = document.createElementNS(NS, "g");
    base.setAttribute("class", "arc-neutral");
    [0, 0.5].forEach(function (f0) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", clockArcPath(cx, cy, R_ARC0, R_ARC1, f0, f0 + 0.5));
      base.appendChild(p);
    });
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
      var n0 = nowInTz();
      if (n0) {
        var frac0 = (n0.h * 3600 + n0.min * 60 + n0.s) / 86400;
        hand.setAttribute("transform", "rotate(" + (frac0 * 360 - 90).toFixed(3) + " " + cx + " " + cy + ")");
        nowTxt.textContent = String(n0.h).padStart(2, "0") + ":" + String(n0.min).padStart(2, "0") + ":" + String(n0.s).padStart(2, "0");
      }
    }
    startClockNow();
    return svg;
  }

  var clockNowTimer = null;
  var clockNowFmt = null;
  var clockNowTz = null;
  function nowInTz() {
    try {
      if (state.tz !== clockNowTz) {
        clockNowTz = state.tz;
        clockNowFmt = new Intl.DateTimeFormat("en", {
          timeZone: state.tz, hourCycle: "h23",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
      }
      var s = clockNowFmt.format(new Date());
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
    document.querySelectorAll(".tl-now").forEach(function (ln) {
      var x0 = Number(ln.getAttribute("data-x0")), x1 = Number(ln.getAttribute("data-x1"));
      var x = x0 + frac * (x1 - x0);
      ln.setAttribute("x1", x.toFixed(2));
      ln.setAttribute("x2", x.toFixed(2));
    });
    document.querySelectorAll(".tl-now-time").forEach(function (el2) { el2.textContent = t; });
  }
  function startClockNow() {
    if (clockNowTimer) return;
    stepClockNow();
    clockNowTimer = setInterval(stepClockNow, 1000);
  }

  // ── 24h muhurta timeline (pure SVG, no ECharts) ────────────────────────

  // build segment rects for a band, handling midnight wrap
  function timelineSeg(g, start, end, good, label) {
    var PLOT_L = 118, PLOT_R = 990, PLOT_W = PLOT_R - PLOT_L;
    var emit = function (s, e) {
      var x = PLOT_L + (s / 1440) * PLOT_W;
      var w = (PLOT_L + (e / 1440) * PLOT_W) - x;
      if (w <= 0) return;
      var seg = document.createElementNS("http://www.w3.org/2000/svg", "g");
      var tip = document.createElementNS("http://www.w3.org/2000/svg", "title");
      tip.textContent = label + " · " + fmtDMin(s) + "–" + fmtDMin(e);
      seg.appendChild(tip);
      var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("class", good ? "seg-good" : "seg-bad");
      r.setAttribute("x", x.toFixed(2));
      r.setAttribute("rx", 3);
      r.setAttribute("width", w.toFixed(2));
      seg.appendChild(r);
      g.appendChild(seg);
    };
    if (start > end) {
      emit(0, end);
      emit(start, 1440);
    } else {
      emit(start, end);
    }
  }

  function timelineBar(opts) {
    opts = opts || {};
    var NS = "http://www.w3.org/2000/svg";
    var PLOT_L = 118, PLOT_R = 990, PLOT_W = PLOT_R - PLOT_L;
    var ROW_Y = 40, ROW_H = 44, BAND_H = 24;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "timeline");
    svg.setAttribute("viewBox", "0 0 1000 340");

    var bandTop = ROW_Y - (BAND_H / 2);

    var nowTxt = document.createElementNS(NS, "text");
    nowTxt.setAttribute("class", "tl-now-time");
    nowTxt.setAttribute("x", 500);
    nowTxt.setAttribute("y", ROW_Y - 12);
    nowTxt.textContent = "--:--:--";
    svg.appendChild(nowTxt);

    for (var h = 0; h < 24; h++) {
      var x = PLOT_L + (h / 24) * PLOT_W;
      var tk = document.createElementNS(NS, "line");
      tk.setAttribute("class", "tl-tick");
      tk.setAttribute("x1", x.toFixed(2)); tk.setAttribute("y1", bandTop);
      tk.setAttribute("x2", x.toFixed(2)); tk.setAttribute("y2", bandTop + (opts.bands ? opts.bands.length : 0) * ROW_H);
      svg.appendChild(tk);
      var lb = document.createElementNS(NS, "text");
      lb.setAttribute("class", "tl-hlabel");
      lb.setAttribute("x", x.toFixed(2));
      lb.setAttribute("y", bandTop + (opts.bands ? opts.bands.length : 0) * ROW_H + 22);
      lb.textContent = String(h).padStart(2, "0");
      svg.appendChild(lb);
    }
    for (var hm = 0; hm < 48; hm++) {
      var xm = PLOT_L + ((hm + 0.5) / 48) * PLOT_W;
      var mk = document.createElementNS(NS, "line");
      mk.setAttribute("class", "tl-half");
      mk.setAttribute("x1", xm.toFixed(2)); mk.setAttribute("y1", bandTop);
      mk.setAttribute("x2", xm.toFixed(2)); mk.setAttribute("y2", bandTop + (opts.bands ? opts.bands.length : 0) * ROW_H);
      svg.appendChild(mk);
    }

    (opts.bands || []).forEach(function (band, bi) {
      var y = ROW_Y + bi * ROW_H;
      var lbl = document.createElementNS(NS, "text");
      lbl.setAttribute("class", "tl-band-label");
      lbl.setAttribute("x", 8);
      lbl.setAttribute("y", y + 4);
      lbl.setAttribute("text-anchor", "start");
      lbl.textContent = band.label;
      svg.appendChild(lbl);
      var pg = document.createElementNS(NS, "g");
      band.segments.forEach(function (s) {
        timelineSeg(pg, s.start, s.end, s.good, s.label);
      });
      pg.childNodes.forEach(function (segG) {
        segG.querySelector("rect").setAttribute("y", y - BAND_H / 2);
        segG.querySelector("rect").setAttribute("height", BAND_H);
      });
      svg.appendChild(pg);
    });

    if (opts.showNow) {
      var now = document.createElementNS(NS, "line");
      now.setAttribute("class", "tl-now");
      now.setAttribute("data-x0", PLOT_L);
      now.setAttribute("data-x1", PLOT_R);
      var bandH = (opts.bands ? opts.bands.length : 0) * ROW_H;
      now.setAttribute("y1", bandTop);
      now.setAttribute("y2", bandTop + bandH);
      var n0 = nowInTz();
      if (n0) {
        var frac0 = (n0.h * 3600 + n0.min * 60 + n0.s) / 86400;
        var x0 = PLOT_L + frac0 * PLOT_W;
        now.setAttribute("x1", x0.toFixed(2));
        now.setAttribute("x2", x0.toFixed(2));
        nowTxt.textContent = String(n0.h).padStart(2, "0") + ":" + String(n0.min).padStart(2, "0") + ":" + String(n0.s).padStart(2, "0");
      }
      svg.appendChild(now);
    }

    startClockNow();
    return svg;
  }

  // Generic horizontal time strip built from { start, end, label, good } (numerical x units)
  function renderStrip(node, items, opts) {
    opts = opts || {};
    if (!items.length) {
      mountChart(node, { title: { text: "", show: false } });
      node.setAttribute("data-chart", "1");
      return;
    }
    var xs = [];
    items.forEach(function (it) {
      xs.push(it.start, it.end);
    });
    var x0 = opts.x0 != null ? opts.x0 : Math.min.apply(null, xs);
    var x1 = opts.x1 != null ? opts.x1 : Math.max.apply(null, xs);
    if (x0 === x1) x1 = x0 + 1;
    x0 -= (x1 - x0) * 0.01;
    x1 += (x1 - x0) * 0.01;

    var option = {
      tooltip: {
        formatter: function (params) {
          if (!params || !params.data) return "";
          var d = params.data;
          return (
            (d[4] || "segment") +
            "<br/><b>" +
            (opts.fmt ? opts.fmt(d[0]) : d[0]) +
            "</b> → <b>" +
            (opts.fmt ? opts.fmt(d[1]) : d[1]) +
            "</b>"
          );
        },
      },
      grid: { left: 52, right: 16, top: 14, bottom: 26 },
      xAxis: {
        type: "value",
        min: x0,
        max: x1,
        axisLabel: opts.axisLabel || false,
      },
      yAxis: {
        type: "category",
        data: [opts.rowLabel || ""],
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: "custom",
          dimensions: ["start", "end", "row", "good", "label"],
          encode: { x: [0, 1], y: 2 },
          renderItem: function (params, api) {
            var p0 = api.coord([api.value(0), api.value(2)]);
            var p1 = api.coord([api.value(1), api.value(2) + 1]);
            var rect = {
              x: p0[0],
              y: p0[1],
              width: Math.max(p1[0] - p0[0], 1),
              height: Math.max(p1[1] - p0[1], 1),
            };
            return {
              type: "rect",
              shape: rect,
              style: api.style({
                fill: api.value(3) === 1 ? "rgba(39,136,74,0.9)" : "rgba(204,40,40,0.85)",
                stroke: "#fff",
                lineWidth: 1,
              }),
            };
          },
          data: items.map(function (it) {
            return [it.start, it.end, it.row || 0, it.good ? 1 : 0, it.label];
          }),
        },
      ],
    };
    return mountChart(node, option);
  }

  // ───────────────────────────── data loaders ─────────────────────────────

  var panchangCall = function () {
    return (
      'const p = await computeDetailedPanchang("' +
      state.date +
      '", ' +
      Number(state.lat.toFixed(4)) +
      ", " +
      Number(state.lon.toFixed(4)) +
      ', "' +
      state.tz +
      '", "' +
      state.locale +
      '");'
    );
  };

  var chartCall = function () {
    return (
      'const c = await computeChart({\n  date: "' +
      state.date +
      '",\n  time: "' +
      state.time +
      '",\n  latitude: ' +
      Number(state.lat.toFixed(4)) +
      ",\n  longitude: " +
      Number(state.lon.toFixed(4)) +
      ',\n  timezone: "' +
      state.tz +
      '",\n  ayanamsa: "' +
      state.ayanamsa +
      '"\n}, "' +
      state.locale +
      '");'
    );
  };

  function panelSnippet(call, access) {
    return call + "\n\n" + access + " // featured fields read above";
  }

  // ───────────────────────────── panchang renderer ────────────────────────

  function renderedPanchang(p) {
    var view = $("#panchang-view");
    clear(view);

    // 1 — header
    var head = el("div", "hero");
    head.appendChild(el(
      "h2",
      "",
      "Panchang for " + p.date + " • " + fmtTz(p.sun_moon.sunrise, true).split(",")[0]
    ));
    var locLine =
      "Location " + p.location.latitude + "°, " + p.location.longitude +
      "° • tz " + p.location.timezone + " • locale " + state.locale;
    head.appendChild(el("p", "sub", locLine));
    head.appendChild(el(
      "p",
      "sub",
      "Vara " + p.vara.sanskrit + " (" + p.vara.english + ") • " + p.panchang.paksha
    ));
    section(view, "Panchang overview", head, panchangCall(), p.panchang);

    // 2 — sun & moon
    section(
      view,
      "Sun & Moon timings",
      table(
        ["Event", "Local time"],
        [
          ["Sunrise", fmtTzAuto(p.sun_moon.sunrise)],
          ["Sunset", fmtTzAuto(p.sun_moon.sunset)],
          ["Next sunrise", fmtTzAuto(p.sun_moon.next_sunrise)],
          ["Midday (Madhyahna)", fmtTzAuto(p.sun_moon.madhyahna)],
          ["Moonrise", fmtTzAuto(p.sun_moon.moonrise)],
          ["Moonset", fmtTzAuto(p.sun_moon.moonset)],
          ["Dinaman (day)", hoursLabel(p.sun_moon.dinaman_hours)],
          ["Ratriman (night)", hoursLabel(p.sun_moon.ratriman_hours)],
        ]
      ),
      panelSnippet(panchangCall(), "p.sun_moon.sunrise, p.sun_moon.sunset"),
      p.sun_moon
    );

    // 3 — vara & paksha
    section(
      view,
      "Vara & Paksha",
      table(
        ["Item", "Value"],
        [
          ["Vara", p.vara.sanskrit + " (" + p.vara.english + ")"],
          ["Paksha", p.panchang.paksha],
        ]
      ),
      panelSnippet(panchangCall(), "p.vara, p.panchang.paksha"),
      { vara: p.vara, paksha: p.panchang.paksha }
    );

    // 4 — panchang (tithi / nakshatra / yoga / karana)
    var pc = el("div");
    pc.appendChild(
      table(
        ["Title", "Now", "Starts", "Ends"],
        [
          ["Tithi", fmtNull(p.panchang.tithi), fmtTzAuto(p.panchang.tithi && p.panchang.tithi.starts_at), fmtTzAuto(p.panchang.tithi && p.panchang.tithi.ends_at)],
          ["Nakshatra", fmtNull(p.panchang.nakshatra), fmtTzAuto(p.panchang.nakshatra && p.panchang.nakshatra.starts_at), fmtTzAuto(p.panchang.nakshatra && p.panchang.nakshatra.ends_at)],
          ["Yoga", fmtNull(p.panchang.yoga), fmtTzAuto(p.panchang.yoga && p.panchang.yoga.starts_at), fmtTzAuto(p.panchang.yoga && p.panchang.yoga.ends_at)],
          ["Karana", fmtNull(p.panchang.karana), fmtTzAuto(p.panchang.karana && p.panchang.karana.starts_at), fmtTzAuto(p.panchang.karana && p.panchang.karana.ends_at)],
        ]
      )
    );
    section(view, "Panchang (now)", pc, panelSnippet(panchangCall(), "p.panchang.tithi, p.panchang.nakshatra, p.panchang.yoga, p.panchang.karana"), p.panchang);

    ["tithi", "nakshatra", "yoga", "karana"].forEach(function (kind) {
      var seq = p.panchang[kind + "_sequence"].slice(0, 5);
      section(
        view,
        kind[0].toUpperCase() + kind.slice(1) + " sequence (next 5)",
        table(
          ["#", "Name", "Starts", "Ends"],
          seq.map(function (item) {
            return [
              item.index,
              item.name,
              fmtTzAuto(item.starts_at),
              fmtTzAuto(item.ends_at),
            ];
          })
        ),
        panelSnippet(panchangCall(), "p.panchang." + kind + "_sequence"),
        p.panchang[kind + "_sequence"]
      );
    });

    // 5 — rashi & nakshatra
    var rn = p.rashi_nakshatra;
    var rnRows = [
      ["Sun sign", rn.sunsign.sign + " (" + rn.sunsign.rashi + ")", rn.sunsign.longitude.toFixed(2) + "°"],
    ];
    rn.moonsign_sequence.slice(0, 4).forEach(function (ms) {
      rnRows.push(["Moon sign (move) " + ms.index, ms.name + " (" + ms.rashi + ")", "till " + fmtTzAuto(ms.ends_at)]);
    });
    rnRows.push(["Surya nakshatra", rn.surya_nakshatra.name + " P" + rn.surya_nakshatra.pada, ""]);
    rn.moon_nakshatra_padas.slice(0, 4).forEach(function (np) {
      rnRows.push(["Moon pada", np.name + " P" + np.pada, "till " + fmtTzAuto(np.ends_at)]);
    });
    section(
      view,
      "Rashi & Nakshatra",
      table(["Item", "Value", "Detail"], rnRows),
      panelSnippet(panchangCall(), "p.rashi_nakshatra.sunsign, p.rashi_nakshatra.moon_nakshatra_padas"),
      p.rashi_nakshatra
    );

    // 6 — calendars
    var lm = p.lunar_month;
    var calRows = [
      ["Samvatsara (Shaka)", lm.samvatsara_shaka],
      ["Samvatsara (Vikram)", lm.samvatsara_vikram],
      ["Vikram Samvat", lm.vikram_samvat],
      ["Shaka Samvat", lm.shaka_samvat],
      ["Gujarati Samvat", lm.gujarati_samvat],
      ["Chandramasa (Amanta)", lm.chandramasa_amanta],
      ["Chandramasa (Purnimanta)", lm.chandramasa_purnimanta],
      ["Nirayana solar month", lm.nirayana_solar_month + " (" + lm.pravishte_day + " pravishte)"],
      ["Kali Year", p.calendars.kali_year],
      ["Kali Ahargana (days)", p.calendars.kali_ahargana_days],
      ["Julian Day", p.calendars.julian_day],
      ["Modified Julian Day", p.calendars.modified_julian_day],
      ["Rata Die", p.calendars.rata_die],
      ["Ayanamsha (Lahiri)", p.calendars.ayanamsha_lahiri.toFixed(4) + "°"],
      ["National civil date", p.calendars.national_civil_date.month + " " + p.calendars.national_civil_date.day + ", Shaka " + p.calendars.national_civil_date.shaka_year],
      ["National nirayana date", p.calendars.national_nirayana_date.month + " " + p.calendars.national_nirayana_date.day + ", Shaka " + p.calendars.national_nirayana_date.shaka_year],
    ];
    if (p.tamil_calendar) {
      calRows.push(
        ["Tamil date", p.tamil_calendar.tamil_date],
        ["Tamil month", p.tamil_calendar.tamil_month.en + " (" + p.tamil_calendar.tamil_month.ta + ", " + p.tamil_calendar.tamil_month.rashi + ")"],
        ["Tamil year", p.tamil_calendar.tamil_year.name_en + " (" + p.tamil_calendar.tamil_year.name_ta + ")"],
        ["Month start", fmtTzAuto(p.tamil_calendar.month_start_iso)],
        ["Nokku naal", p.tamil_calendar.nokku_naal],
        ["Kari naal", p.tamil_calendar.kari_naal ? "Yes" : "No"],
        ["Thaniya naal", p.tamil_calendar.thaniya_naal ? "Yes" : "No"]
      );
    }
    section(
      view,
      "Calendars",
      table(["Item", "Value"], calRows),
      panelSnippet(panchangCall(), "p.lunar_month, p.calendars, p.tamil_calendar"),
      { lunar_month: p.lunar_month, calendars: p.calendars, tamil_calendar: p.tamil_calendar }
    );

    // 7 — ritu & ayana
    section(
      view,
      "Ritu & Ayana",
      table(
        ["System", "Ritu", "Ayana"],
        [
          ["Drik (sidereal solar)", p.ritu_ayana.drik_ritu, p.ritu_ayana.drik_ayana],
          ["Vedic tropical", p.ritu_ayana.vedic_ritu, p.ritu_ayana.vedic_ayana],
        ]
      ),
      panelSnippet(panchangCall(), "p.ritu_ayana"),
      p.ritu_ayana
    );

    // 8 — auspicious timings
    var au = p.auspicious_timings;
    var auRows = [];
    pushWindow(auRows, "Brahma Muhurta", au.brahma_muhurta);
    pushWindow(auRows, "Pratah Sandhya", au.pratah_sandhya);
    pushWindow(auRows, "Abhijit Muhurta", au.abhijit);
    pushWindow(auRows, "Vijay Muhurta", au.vijay_muhurta);
    pushWindow(auRows, "Godhuli Muhurta", au.godhuli_muhurta);
    pushWindow(auRows, "Sayahna Sandhya", au.sayahna_sandhya);
    pushWindow(auRows, "Nishita Muhurta", au.nishita_muhurta);
    au.amrit_kalam.forEach(function (w, i) {
      auRows.push(["Amrit Kalam #" + (i + 1), fmtTzAuto(w.start), fmtTzAuto(w.end)]);
    });
    au.sarvartha_siddhi_yoga.forEach(function (w, i) {
      auRows.push(["Sarvartha Siddhi Yoga #" + (i + 1), fmtTzAuto(w.start), fmtTzAuto(w.end)]);
    });
    au.amrita_siddhi_yoga.forEach(function (w, i) {
      auRows.push(["Amrita Siddhi Yoga #" + (i + 1), fmtTzAuto(w.start), fmtTzAuto(w.end)]);
    });
    section(
      view,
      "Auspicious timings",
      table(["Muhurta", "From", "To"], auRows),
      panelSnippet(panchangCall(), "p.auspicious_timings"),
      p.auspicious_timings
    );

    // 9 — inauspicious timings
    var ia = p.inauspicious_timings;
    var iaRows = [];
    pushWindow(iaRows, "Rahu Kalam", ia.rahu_kalam);
    pushWindow(iaRows, "Yamaganda", ia.yamaganda);
    pushWindow(iaRows, "Gulika Kalam", ia.gulika_kalam);
    ia.dur_muhurtam.forEach(function (w, i) {
      iaRows.push(["Durmuhurtam #" + (i + 1), fmtTzAuto(w.start), fmtTzAuto(w.end)]);
    });
    ia.bhadra.forEach(function (w, i) {
      iaRows.push(["Bhadra #" + (i + 1), fmtTzAuto(w.start), fmtTzAuto(w.end)]);
    });
    ia.varjyam.forEach(function (w, i) {
      iaRows.push(["Varjyam #" + (i + 1), fmtTzAuto(w.start), fmtTzAuto(w.end)]);
    });
    section(
      view,
      "Inauspicious timings",
      table(["Avoid", "From", "To"], iaRows),
      panelSnippet(panchangCall(), "p.inauspicious_timings"),
      p.inauspicious_timings
    );

    // 10 — udaya lagna
    section(
      view,
      "Udaya Lagna",
      table(
        ["Lagna", "", "Start", "End"],
        p.udaya_lagna.map(function (u) {
          return [u.sign, u.rashi, fmtTzAuto(u.start), fmtTzAuto(u.end)];
        })
      ),
      panelSnippet(panchangCall(), "p.udaya_lagna"),
      p.udaya_lagna
    );

    // 11 — chandrabalam & tarabalam
    var bal = el("div");
    bal.appendChild(
      table(
        ["Good rashis for Moon", ""],
        p.chandrabalam.good_rashis.map(function (r) {
          return [r.rashi, "Rashi " + r.index];
        })
      )
    );
    bal.appendChild(
      table(
        ["Good nakshatras (Tarabalam)", "Index"],
        p.tarabalam.good_nakshatras.map(function (n) {
          return [n.nakshatra, n.index];
        })
      )
    );
    section(view, "Chandrabalam & Tarabalam", bal, panelSnippet(panchangCall(), "p.chandrabalam, p.tarabalam"), { chandrabalam: p.chandrabalam, tarabalam: p.tarabalam });

    // 12 — shool & vasa
    section(
      view,
      "Shool & Vasa",
      table(
        ["Item", "Direction"],
        [
          ["Disha Shool", p.shool_vasa.disha_shool],
          ["Rahu Vasa", p.shool_vasa.rahu_vasa],
          ["Chandra Vasa", p.shool_vasa.chandra_vasa],
        ]
      ),
      panelSnippet(panchangCall(), "p.shool_vasa"),
      p.shool_vasa
    );

    // 13 — yogas extra
    var ye = el("div");
    ye.appendChild(
      table(
        ["Yoga", "Value"],
        [
          [
            "Ganda Mula",
            p.yogas_extra.ganda_mula
              ? p.yogas_extra.ganda_mula.nakshatra + " (ends " + fmtTzAuto(p.yogas_extra.ganda_mula.ends_at) + ")"
              : "Not active",
          ],
          [
            "Ravi Yoga",
            p.yogas_extra.ravi_yoga
              ? fmtTzAuto(p.yogas_extra.ravi_yoga.start) + " → " + fmtTzAuto(p.yogas_extra.ravi_yoga.end)
              : "Not active",
          ],
        ]
      )
    );
    section(view, "Ganda Mula & Ravi Yoga", ye, panelSnippet(panchangCall(), "p.yogas_extra"), p.yogas_extra);

    // 14 — gowri panchangam
    renderGowri(view, p.gowri_panchang);

    // 15 — hora
    renderHora(view, p.hora);

    // 16 — nalla neram
    renderNallaNeram(view, p.nalla_neram);

    // 17 — tyajyam
    renderTyajyam(view, p.tyajyam);

    // 18 — day at a glance
    renderDayGlance(view, p);
  }

  function hoursLabel(h) {
    if (h == null) return "—";
    var m = Math.round(h * 60);
    return pad2(Math.floor(m / 60)) + "h " + pad2(m % 60) + "m";
  }

  function fmtNull(item) {
    return item ? item.name : "—";
  }

  function pushWindow(rows, label, w) {
    if (w) rows.push([label, fmtTzAuto(w.start), fmtTzAuto(w.end)]);
  }

  function renderGowri(view, gowri) {
    var box = el("div");
    box.appendChild(el("div", "sep", "Day (sunrise → sunset)"));
    var day = chartEl();
    box.appendChild(day);
    var nightTxt = el("div", "sep", "Night");
    box.appendChild(nightTxt);
    var night = chartEl();
    box.appendChild(night);

    var daySegs = gowri.day.map(function (s) {
      return { start: dMin(s.start), end: dMin(s.end), label: s.name + (s.auspicious ? " (good)" : " (avoid)"), good: s.auspicious };
    });
    var nightSegs = gowri.night.map(function (s) {
      return { start: dMin(s.start), end: dMin(s.end), label: s.name + (s.auspicious ? " (good)" : " (avoid)"), good: s.auspicious };
    });
    if (echarts) {
      renderStrip(day, daySegs, { fmt: fmtDMin, rowLabel: "Day" });
      renderStrip(night, nightSegs, { fmt: fmtDMin, rowLabel: "Night" });
    }

    var legend = el("div", "legend");
    legend.appendChild(chip("good", "good segment"));
    legend.appendChild(chip("bad", "avoiding segment"));
    box.appendChild(legend);

    var names = gowri.day.map(function (s) { return s.name; });
    var order = names.length ? names.join(" • ") : "—";
    section(
      view,
      "Gowri Panchangam",
      box,
      panelSnippet(panchangCall(), 'p.gowri_panchang.day  // 8 segments: ' + order),
      gowri
    );
  }

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

  var TYAJYAM_LABEL = {
    nakshatraTyajyam: function (w) { return "Nakshatra tyajyam — " + w.nakshatra + " nakshatra"; },
    tithiTyajyam: function (w) { return "Tithi tyajyam — " + w.tithi + " tithi"; },
    varaTyajyam: function () { return "Vara tyajyam"; },
    amritadiYogam: function (w) { return "Amritadi yogam — " + w.yogam + " (" + w.nakshatra + ")"; },
    lagnaTyajyam: function (w) { return "Lagna tyajyam — " + w.sign + (w.position ? " (" + w.position + ")" : ""); },
    karanaTyajyam: function (w) { return "Karana tyajyam — " + w.karana; },
    gowriTyajyam: function (w) { return "Gowri tyajyam — " + w.name + (w.period ? " (" + w.period + ")" : ""); },
    doshaTyajyam: function (w) { return "Dosha tyajyam — " + w.dosha; },
    tithiLagnaTyajyam: function (w) { return "Tithi-Lagna tyajyam — " + w.tithi + " in " + w.sign; },
  };

  function renderTyajyam(view, t) {
    var box = el("div");
    var rows = [];
    Object.keys(TYAJYAM_LABEL).forEach(function (key) {
      var list = t[key];
      if (!list) return;
      if (Array.isArray(list)) {
        list.forEach(function (w) {
          rows.push([TYAJYAM_LABEL[key](w), fmtTzAuto(w.start), fmtTzAuto(w.end)]);
        });
      } else if (list.start) {
        rows.push([TYAJYAM_LABEL[key](list), fmtTzAuto(list.start), fmtTzAuto(list.end)]);
      }
    });
    var avoid = (t.tamilMonthAvoidables || null);
    if (avoid) {
      avoid.windows.forEach(function (w) {
        rows.push(["Tamil month (" + w.kind + " — " + w.name + ")", fmtTzAuto(w.start), fmtTzAuto(w.end)]);
      });
      box.appendChild(
        table(
          ["Tamil month avoidables", ""],
          [
            ["Avoided tithis", (avoid.avoid_tithis || []).join(", ")],
            ["Avoided nakshatras", (avoid.avoid_nakshatras || []).join(", ")],
            ["Avoided lagnas", (avoid.avoid_lagnas || []).join(", ")],
          ]
        )
      );
    }
    box.appendChild(
      table(["Avoid during", "From", "To"], rows.length ? rows : [["—", "—", "—"]])
    );
    section(view, "Tyajyam (avoiding periods)", box, panelSnippet(panchangCall(), "p.tyajyam"), t);
  }

  function renderDayGlance(view, p) {
    var box = el("div");

    var toSeg = function (it) {
      var start = dMin(it.start), end = dMin(it.end);
      if (start == null || end == null) return null;
      return { label: it.label, start: start, end: end, good: it.good };
    };
    var bands = [];
    ["brahma_muhurta", "pratah_sandhya", "abhijit", "vijay_muhurta", "godhuli_muhurta", "sayahna_sandhya", "nishita_muhurta"].forEach(function (k) {
      var w = p.auspicious_timings[k];
      if (w) bands.push({ label: k.replace(/_/g, " "), segments: [toSeg({ start: w.start, end: w.end, good: true, label: k.replace(/_/g, " ") })].filter(Boolean) });
    });
    var yogas = [];
    ["amrit_kalam", "sarvartha_siddhi_yoga", "amrita_siddhi_yoga"].forEach(function (k) {
      p.auspicious_timings[k].forEach(function (w) {
        var s = toSeg({ start: w.start, end: w.end, good: true, label: k.replace(/_/g, " ") });
        if (s) yogas.push(s);
      });
    });
    var gowri = [];
    ["day", "night"].forEach(function (part) {
      p.gowri_panchang[part].forEach(function (s) {
        var lab = s.name + (part === "night" ? " (night)" : "");
        var seg = toSeg({ start: s.start, end: s.end, good: s.auspicious, label: lab });
        if (seg) gowri.push(seg);
      });
    });
    var hora = [];
    p.hora.day.forEach(function (s) {
      var seg = toSeg({ start: s.start, end: s.end, good: s.auspicious, label: s.name });
      if (seg) hora.push(seg);
    });
    p.hora.night.forEach(function (s) {
      var seg = toSeg({ start: s.start, end: s.end, good: s.auspicious, label: s.name + " hora (night)" });
      if (seg) hora.push(seg);
    });
    var nalla = [];
    p.nalla_neram.forEach(function (w) {
      var seg = toSeg({ start: w.start, end: w.end, good: true, label: "Nalla Neram" });
      if (seg) nalla.push(seg);
    });
    var inausp = [];
    ["rahu_kalam", "yamaganda", "gulika_kalam"].forEach(function (k) {
      var w = p.inauspicious_timings[k];
      if (w) { var seg = toSeg({ start: w.start, end: w.end, good: false, label: k.replace(/_/g, " ") }); if (seg) inausp.push(seg); }
    });
    ["dur_muhurtam", "bhadra", "varjyam"].forEach(function (k) {
      p.inauspicious_timings[k].forEach(function (w) {
        var seg = toSeg({ start: w.start, end: w.end, good: false, label: k.replace(/_/g, " ") });
        if (seg) inausp.push(seg);
      });
    });

    var segCount = bands.reduce(function (n, b) { return n + b.segments.length; }, 0) +
      yogas.length + gowri.length + hora.length + nalla.length + inausp.length;

    if (segCount) {
      box.appendChild(timelineBar({
        showNow: true,
        bands: [
          { label: "Muhurtas", segments: bands.reduce(function (a, b) { return a.concat(b.segments); }, []) },
          { label: "Yogas", segments: yogas },
          { label: "Gowri Panchang", segments: gowri },
          { label: "Hora", segments: hora },
          { label: "Nalla Neram", segments: nalla },
          { label: "Inauspicious", segments: inausp },
        ],
      }));
    } else {
      box.appendChild(el("p", "hint", "No windows computed for this day."));
    }

    var legend = el("div", "legend");
    legend.appendChild(chip("good", "auspicious"));
    legend.appendChild(chip("bad", "inauspicious"));
    box.appendChild(legend);
    section(view, "Day at a glance — all muhurta windows", box, panelSnippet(panchangCall(), "p.auspicious_timings + p.inauspicious_timings + p.gowri_panchang + p.hora + p.nalla_neram"), { auspicious_timings: p.auspicious_timings, inauspicious_timings: p.inauspicious_timings, gowri_panchang: p.gowri_panchang, hora: p.hora, nalla_neram: p.nalla_neram });
  }

  function kv(w, label, good) {
    return { start: w.start, end: w.end, label: label, good: good };
  }

  // ───────────────────────────── kundali renderer ─────────────────────────

  var PLANET_ABBR = {
    "Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me", "Jupiter": "Ju",
    "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra", "Ketu": "Ke",
  };
  var PLANET_COLOR = {
    "Su": "#e65100", "Mo": "#1565c0", "Ma": "#c62828", "Me": "#2e7d32",
    "Ju": "#f9a825", "Ve": "#6a1b9a", "Sa": "#37474f", "Ra": "#795548",
    "Ke": "#546e7a",
  };

  // South-Indian fixed-sign grid: sign(1-12) → (row, col) in a 4×4 layout,
  // corners empty, Aries at left-middle. Unambiguous and tz-independent.
  var SI_CELL = {
    1: [2, 0], 2: [1, 0], 3: [0, 1], 4: [0, 2], 5: [1, 3], 6: [2, 3],
    7: [3, 2], 8: [3, 1], 9: [2, 2], 10: [2, 1], 11: [1, 2], 12: [1, 1],
  };

  function renderedKundali(c) {
    var view = $("#kundali-view");
    clear(view);

    // 1 — birth details
    var b = c.birth;
    var bRows = [
      ["Local time", b.local_time],
      ["UTC time", b.utc_time],
      ["Timezone", b.timezone],
      ["Latitude / Longitude", b.latitude + " / " + b.longitude],
      ["Julian Day", b.julian_day],
      ["Ayanamsa", b.ayanamsa.toFixed(4) + "° (" + b.ayanamsa_label + ")"],
    ];
    section(view, "Birth details", table(["Item", "Value"], bRows), chartCall(), c.birth);

    // 2 — planets
    var pRows = c.planets_data.map(function (pl) {
      var flags = [];
      if (pl.retrograde) flags.push("R");
      if (pl.combust) flags.push("C");
      if (pl.exalted) flags.push("Exalted");
      if (pl.debilitated) flags.push("Debilitated");
      if (pl.own_sign) flags.push("Own sign");
      if (pl.moolatrikona) flags.push("Moolatrikona");
      if (pl.vargottama) flags.push("Vargottama");
      if (pl.digbala) flags.push("Digbala");
      if (pl.pushkara_bhaga) flags.push("Pushkara");
      if (pl.pushkara_navamsa) flags.push("Pushkara Navamsa");
      if (pl.mrityu_bhaga) flags.push("Mrityu Bhaga");
      if (pl.gandanta) flags.push("Gandanta");
      if (pl.neecha_bhanga) flags.push("Neecha Bhanga");
      if (pl.parivartana) flags.push("Parivartana " + (pl.parivartana_with || ""));
      if (pl.graha_yuddha) flags.push("Yuddha " + (pl.graha_yuddha_with || ""));
      var flagCell = el("td");
      flags.forEach(function (f) {
        flagCell.appendChild(chip("info", f));
      });
      var nameCell = el("td");
      nameCell.appendChild(chip("planet", pl.abbr));
      nameCell.appendChild(document.createTextNode(" " + pl.name));
      return [
        nameCell,
        pl.house + " (" + pl.sign + ")",
        pl.degree_in_sign.toFixed(2) + "°",
        pl.dms + (pl.retrograde ? " R" : ""),
        pl.nakshatra + " P" + pl.nakshatra_pada,
        flagCell,
      ];
    });
    section(view, "Planets", table(["Planet", "House / sign", "Degree", "Longitude", "Nakshatra", "Special"], pRows), panelSnippet(chartCall(), "c.planets_data"), c.planets_data);

    // 3 — D1 chart (South Indian grid + wheel)
    renderD1(view, c);

    // 4 — divisional gallery
    renderVargas(view, c);

    // 5 — ashtakavarga
    renderAshtakavarga(view, c.ashtakavarga);

    // 6 — dasha
    renderDasha(view, c.dasha, c.dasha_antar);

    // 7 — karakas
    renderKarakas(view, c);

    // 8 — kalsarpa
    renderKalsarpa(view, c.kalsarpa);

    // 9 — friendships
    renderFriendships(view, c.friendships);

    // 10 — drishti
    renderDrishti(view, c.drishti);
  }

  var RASHI_NAMES_FALLBACK = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  // per-locale sign names resolved lazily (locale can change at runtime)
  function rashiNames() {
    try {
      var t = vpv && vpv.getLocaleTable ? vpv.getLocaleTable(state.locale) : null;
      if (t && t.signs && t.signs.length === 12) return t.signs;
    } catch (e) { /* fallback below */ }
    return RASHI_NAMES_FALLBACK;
  }

  function siGrid(chart) {
    var table = el("div", "si-grid");
    var ascSign = chart.asc_sign;
    var cells = {};
    Object.keys(chart.chart).forEach(function (h) {
      var sign = ((ascSign + Number(h) - 1) % 12) + 1;
      if (!cells[sign]) cells[sign] = [];
      cells[sign] = cells[sign].concat(chart.chart[h]);
    });
    var signs = rashiNames();
    for (var r = 0; r < 4; r++) {
      var tr = el("div", "si-row");
      for (var cIdx = 0; cIdx < 4; cIdx++) {
        var cell = el("div", "si-cell");
        var sign = null;
        Object.keys(SI_CELL).forEach(function (s) {
          if (SI_CELL[s][0] === r && SI_CELL[s][1] === cIdx) sign = Number(s);
        });
        if (!sign) {
          tr.appendChild(cell); // corner cell (empty)
          continue;
        }
        cell.classList.add("si-fill");
        if (sign === ascSign) cell.classList.add("si-asc");
        var head = el("div", "si-sign");
        head.appendChild(el("span", "si-sign-name", signs[sign - 1] || String(sign)));
        cell.appendChild(head);
        var planets = cells[sign] || [];
        if (planets.length) {
          var pbox = el("div", "si-planets");
          planets.forEach(function (abbr) {
            var b = el("span", "si-planet");
            b.textContent = abbr;
            b.style.backgroundColor = PLANET_COLOR[abbr] || "#555";
            pbox.appendChild(b);
          });
          cell.appendChild(pbox);
        }
        tr.appendChild(cell);
      }
      table.appendChild(tr);
    }
    var foot = el("div", "si-footer");
    foot.appendChild(el("span", "si-asc-mark", "▲"));
    foot.appendChild(el("span", null, " ascendant (" + signs[ascSign - 1] + ")"));
    table.appendChild(foot);
    return table;
  }

  function renderD1(view, c) {
    var box = el("div", "d1-wrap");
    var grid = siGrid(c.d1_chart);
    var wheelHost = chartEl();
    box.appendChild(el("div", "sep", "D1 — Rashi chart (South Indian fixed-sign layout)"));
    box.appendChild(grid);
    box.appendChild(el("div", "sep", "D1 — Sidereal wheel with natal planets"));
    box.appendChild(wheelHost);

    if (echarts) renderWheel(wheelHost, c);

    section(
      view,
      "D1 natal chart",
      box,
      panelSnippet(chartCall(), "c.d1_chart, c.ascendant, c.planets_data"),
      c.d1_chart
    );
  }

  function renderWheel(host, c) {
    var signs = rashiNames();
    var planets = c.planets_data.map(function (pl) {
      return {
        name: pl.abbr,
        long: pl.longitude,
        retro: pl.retrograde,
        house: pl.house,
      };
    });
    planets.push({ name: "As", long: c.ascendant.longitude, retro: false, house: 1 });

    var sectorData = signs.map(function (s, i) {
      return { start: i * 30, span: 30, sign: s, idx: i + 1 };
    });

    function polarRect(coord, api, a0, a1, r0, r1) {
      var pts = [];
      var STEPS = 8;
      for (var i = 0; i <= STEPS; i++) pts.push(coord([a0 + ((a1 - a0) * i) / STEPS, r0]));
      for (var j = STEPS; j >= 0; j--) pts.push(coord([a0 + ((a1 - a0) * j) / STEPS, r1]));
      return pts;
    }

    var option = {
      tooltip: {
        formatter: function (params) {
          if (!params.data || !params.data.extra) return "";
          var x = params.data.extra;
          return "<b>" + (x.abbr || x.sign || "") + "</b>" + (x.house ? " — house " + x.house : "");
        },
      },
      legend: {
        bottom: 0,
        data: planets.map(function (p) { return p.name; }),
        orient: "horizontal",
        icon: "circle",
        itemWidth: 10,
        itemHeight: 10,
      },
      polar: {
        center: ["50%", "48%"],
        radius: "62%",
      },
      angleAxis: {
        type: "value",
        startAngle: 90,
        clockwise: false,
        min: 0,
        max: 360,
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        minInterval: 30,
      },
      radiusAxis: { min: 0, max: 110, axisLabel: { show: false }, splitLine: { show: false } },
      series: [
        {
          name: "rashi",
          type: "custom",
          coordinateSystem: "polar",
          renderItem: function (params, api) {
            var d = params.dataIndex;
            var data = sectorData[d];
            var a0 = data.start;
            var a1 = data.start + data.span;
            var group = {
              type: "group",
              children: [
                {
                  type: "polygon",
                  shape: {
                    points: polarRect(api.coord, api, a0, a1 + 0.4, 22, 78),
                  },
                  style: api.style({
                    fill: d % 2 === 0 ? "rgba(240,246,255,0.9)" : "rgba(217,231,255,0.9)",
                    stroke: "#90a4ae",
                    lineWidth: 0.8,
                  }),
                },
              ],
            };
            var midA = a0 + data.span / 2;
            var lp = api.coord([midA, data.idx % 2 === 0 ? 30 : 34]);
            group.children.push({
              type: "text",
              style: {
                x: lp[0],
                y: lp[1],
                text: data.sign,
                fontSize: 9,
                fill: "#37474f",
                textAlign: "center",
                textVerticalAlign: "middle",
              },
            });
            return group;
          },
          data: sectorData,
          encode: { angle: [0, 1], radius: 1 },
          silent: true,
        },
        {
          name: "planets",
          type: "scatter",
          coordinateSystem: "polar",
          symbol: "circle",
          symbolSize: 16,
          itemStyle: { borderColor: "#fff", borderWidth: 1 },
          label: {
            show: true,
            position: "top",
            formatter: function (p) {
              var d = p.data.extra;
              return d.abbr + (d.retro ? " R" : "");
            },
            fontSize: 9,
          },
          data: planets.map(function (pl) {
            return {
              value: [pl.long, 92],
              extra: pl,
              itemStyle: { color: PLANET_COLOR[pl["name"]] || "#555" },
              name: pl.name,
            };
          }),
        },
      ],
    };

    mountChart(host, option);
    host.style.height = "460px";
  }

  function renderVargas(view, c) {
    var box = el("div");

    c.varga_order = c.varga_order || [];
    var avail = c.varga_order.filter(function (d) {
      return c.vargas["d" + d];
    });

    var select = el("select", "varga-select");
    avail.forEach(function (d) {
      var opt = document.createElement("option");
      opt.value = String(d);
      opt.textContent = "D" + d + " — " + c.vargas["d" + d].name;
      select.appendChild(opt);
    });

    var target = el("div");
    function showCard(d) {
      target.textContent = "";
      var vc = c.vargas["d" + d];
      var card = el("div", "varga-card wide");
      card.appendChild(el("div", "varga-title", vc.name + " (D" + d + ")"));
      card.appendChild(el("div", "varga-sub", vc.subtitle || ""));
      card.appendChild(siGrid(vc));
      target.appendChild(card);
    }

    if (avail.length) {
      box.appendChild(el("div", "sep", "Divisional varga charts — one at a time"));
      box.appendChild(select);
      select.addEventListener("change", function () {
        showCard(Number(select.value));
      });
      showCard(avail[0]);
    } else {
      box.appendChild(el("p", "hint", "No divisional charts returned."));
    }
    box.appendChild(target);
    section(view, "Divisional charts (D1 ⇄ D60)", box, panelSnippet(chartCall(), "c.vargas, c.varga_order"), { varga_order: c.varga_order, vargas: c.vargas });
  }

  function renderAshtakavarga(view, akv) {
    var box = el("div");
    var signs = RASHI_NAMES_FALLBACK;
    Object.keys(akv.bav).forEach(function (planetName) {
      var host = chartEl();
      box.appendChild(el("div", "sep", "Ashtakavarga — " + planetName));
      box.appendChild(host);
      if (!echarts) return;
      var vals = akv.bav[planetName];
      mountChart(host, {
        grid: { left: 30, right: 12, top: 10, bottom: 28 },
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: signs,
          axisLabel: { fontSize: 9, interval: 0, rotate: 40 },
        },
        yAxis: { type: "value", minInterval: 1 },
        series: [
          {
            type: "bar",
            data: vals,
            itemStyle: {
              // per-planet BAV is a 0–8 sum (one point max per contributor
              // sign), so classify on that scale: ≥5 strong, 3–4 moderate.
              color: function (pp) {
                return pp.value >= 5 ? "#2e7d32" : pp.value >= 3 ? "#ef6c00" : "#c62828";
              },
            },
            label: { show: true, position: "top", fontSize: 9 },
          },
        ],
      });
      host.style.height = "180px";
    });
    var sav = chartEl();
    box.appendChild(el("div", "sep", "Sarvatobhadra Chakra (SAV) — points by sign"));
    box.appendChild(sav);
    if (echarts) {
      mountChart(sav, {
        grid: { left: 30, right: 12, top: 10, bottom: 28 },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: signs, axisLabel: { fontSize: 9, interval: 0, rotate: 40 } },
        yAxis: { type: "value", minInterval: 1 },
        series: [
          {
            type: "bar",
            data: akv.sav,
            itemStyle: { color: "#1565c0" },
            label: { show: true, position: "top", fontSize: 9 },
          },
        ],
      });
      sav.style.height = "200px";
    }
    section(view, "Ashtakavarga", box, panelSnippet(chartCall(), "c.ashtakavarga.bav, c.ashtakavarga.sav"), akv);
  }

  function renderDasha(view, dasha, antar) {
    var box = el("div");

    var host = chartEl();
    box.appendChild(el("div", "sep", "Vimshottari Mahadasha timeline"));
    box.appendChild(host);
    if (echarts) {
      var segs = dasha.map(function (m) {
        return { start: new Date(m.start).getTime(), end: new Date(m.end).getTime(), label: m.lord + " (" + m.years + "y)", good: true };
      });
      if (segs.length) {
        renderStrip(host, segs, {
          fmt: function (ms) {
            return new Date(ms).toISOString().slice(0, 10);
          },
          axisLabel: {
            show: true,
            formatter: function (ms) {
              return new Date(ms).toISOString().slice(0, 4);
            },
          },
          rowLabel: "Mahadasha",
        });
        host.style.height = "80px";
      }
    }

    box.appendChild(
      table(
        ["Mahadasha", "Start", "End", "Years"],
        dasha.map(function (m) {
          return [m.lord, fmtTz(m.start, true), fmtTz(m.end, true), m.years];
        })
      )
    );

    // current mahadasha's antardashas — looked up in the enriched `antar`
    // array (computeChart stores plain periods in `dasha` and the
    // antardasha-enriched copy in `dasha_antar`); fall back to the plain
    // array when the enriched one is empty.
    var now = new Date();
    var enriched = (antar && antar.length) ? antar : dasha;
    var current = null;
    enriched.forEach(function (m) {
      var s = new Date(m.start).getTime();
      var e = new Date(m.end).getTime();
      if (now.getTime() >= s && now.getTime() < e) current = m;
    });

    if (current) {
      box.appendChild(el("div", "sep", "Antardashas of " + current.lord + " (current mahadasha)"));
      if (current.antardashas && current.antardashas.length) {
        box.appendChild(
          table(
            ["Antardasha", "Start", "End", "Years"],
            current.antardashas.map(function (a) {
              return [a.lord, fmtTz(a.start, true), fmtTz(a.end, true), a.years];
            })
          )
        );
      } else {
        box.appendChild(el("p", "hint", "No antardashas returned for the current mahadasha."));
      }
    }

    section(view, "Vimshottari dasha", box, panelSnippet(chartCall(), "c.dasha, c.dasha_antar"), { dasha: dasha, dasha_antar: antar });
  }

  function renderKarakas(view, c) {
    var box = el("div");
    box.appendChild(
      table(
        ["Rank", "Karaka", "Planet", "Sign", "Degree"],
        c.karakas.map(function (k) {
          return [k.rank, k.title + " (" + k.abbr + ")", k.planet + " (" + k.planet_abbr + ")", k.sign + " (" + k.sign_id + ")", k.dms + " (" + k.degree_in_sign.toFixed(2) + "°)"];
        })
      )
    );
    box.appendChild(table(
      ["Derived", "Value"],
      [
        ["Karakamsa (jamini lagna)", c.karakamsa],
        ["Swamsa (own-sign placement)", c.swamsa],
      ]
    ));
    section(view, "Jaimini karakas", box, panelSnippet(chartCall(), "c.karakas, c.karakamsa, c.swamsa"), { karakas: c.karakas, karakamsa: c.karakamsa, swamsa: c.swamsa });
  }

  function renderKalsarpa(view, s) {
    var box = el("div");
    box.appendChild(
      table(
        ["Item", "Value"],
        [
          ["Present", s.present ? "Yes" : "No"],
          ["Verdict", s.verdict],
          ["Kind", s.kind || "—"],
          ["Direction", s.direction || "—"],
          ["Rahu house", s.rahu_house],
          ["Ketu house", s.ketu_house],
        ]
      )
    );
    section(view, "Kalsarpa dosha", box, panelSnippet(chartCall(), "c.kalsarpa"), s);
  }

  function renderFriendships(view, f) {
    var box = el("div");
    var PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
    var composite = f.composite || {};
    var natural = f.natural || {};
    function rel(of, to) {
      return (composite[of] && composite[of][to]) || (natural[of] && natural[of][to]) || "?";
    }
    box.appendChild(el("div", "sep", "Friendship matrix (composite overrides natural; G = great friend, F = friend, N = neutral, E = enemy, GE = great enemy)"));
    var rows = PLANETS.map(function (from) {
      var row = [from].concat(PLANETS.map(function (to) {
        return relChip(rel(from, to));
      }));
      return row;
    });
    box.appendChild(table(["From \\ To"].concat(PLANETS), rows));
    var legend = el("div", "legend");
    ["G", "F", "N", "E", "GE", "?"].forEach(function (code) {
      legend.appendChild(relChip(code));
    });
    box.appendChild(legend);
    section(view, "Friendships", box, panelSnippet(chartCall(), "c.friendships.composite, c.friendships.natural"), f);
  }

  function relChip(rel) {
    var cls =
      rel === "GF" ? "g" :
      rel === "F" ? "f" :
      rel === "GE" ? "ge" :
      rel === "E" ? "e" : "n";
    return chip(cls, rel);
  }

  function renderDrishti(view, d) {
    var box = el("div");
    box.appendChild(el("div", "sep", "Mutual aspects"));
    box.appendChild(
      table(
        ["Planet", "Planet"],
        d.mutual.map(function (m) {
          return [m.planet1, m.planet2];
        })
      )
    );
    box.appendChild(el("div", "sep", "Aspect edges"));
    box.appendChild(
      table(
        ["From", "", "To", "Offset", "Type", "Strength", "Benefic"],
        d.aspects.map(function (a) {
          return [
            a.planet_abbr + " (" + a.from_sign + ")",
            "→",
            a.to_sign + " (house " + a.to_house + ")",
            a.offset + "th",
            a.aspect_type,
            a.strength,
            a.benefic ? "yes" : "no",
          ];
        })
      )
    );
    section(view, "Drishti (aspects)", box, panelSnippet(chartCall(), "c.drishti.aspects, c.drishti.mutual, c.drishti.by_planet"), d);
  }

  // ───────────────────────────── wiring ───────────────────────────────────

  function bind() {
    $("#f-date").value = state.date;
    $("#f-time").value = state.time;
    $("#f-lat").value = state.lat;
    $("#f-lon").value = state.lon;
    $("#f-tz").value = state.tz;
    $("#f-ayanamsa").value = state.ayanamsa;
    $("#f-locale").value = state.locale;

    $("#apply").addEventListener("click", collect);

    ["f-date", "f-time", "f-lat", "f-lon", "f-tz", "f-ayanamsa", "f-locale"].forEach(function (id) {
      $("#" + id).addEventListener("change", collect);
      $("#" + id).addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") collect();
      });
    });

    $("#tab-panchang").addEventListener("click", function () {
      setTab("panchang");
      renderActive();
    });
    $("#tab-kundali").addEventListener("click", function () {
      setTab("kundali");
      renderActive();
    });
  }

  function setTab(t) {
    state.tab = t;
    $("#tab-panchang").classList.toggle("active", t === "panchang");
    $("#tab-kundali").classList.toggle("active", t === "kundali");
    $("#panchang-view").classList.toggle("hidden", t !== "panchang");
    $("#kundali-view").classList.toggle("hidden", t !== "kundali");
  }

  function collect() {
    var d = $("#f-date").value;
    var lat = Number($("#f-lat").value);
    var lon = Number($("#f-lon").value);
    var tz = $("#f-tz").value;
    var ayanamsa = $("#f-ayanamsa").value;
    var locale = $("#f-locale").value;
    var time = $("#f-time").value || "12:00";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      banner("Invalid date", "Pick a real date.");
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      banner("Invalid latitude", "Latitude must be between -90 and 90.");
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      banner("Invalid longitude", "Longitude must be between -180 and 180.");
      return;
    }
    state.date = d;
    state.time = time;
    state.lat = lat;
    state.lon = lon;
    state.tz = tz;
    state.ayanamsa = ayanamsa;
    state.locale = locale;
    renderActive();
  }

  function renderActive() {
    if (!vpv || !vpv.computeDetailedPanchang) {
      banner("Library not loaded", "Wait for vpv-demo.js to initialise the WASM ephemeris, then retry.");
      return;
    }
    if (state.tab === "panchang") renderPanchang();
    else renderKundali();
  }

  // per-view request generations: stale async renders discard their result so
  // a fast "Apply" / tab switch can never be overwritten by an older compute
  var panchangGen = 0;
  var kundaliGen = 0;

  async function renderPanchang() {
    var view = $("#panchang-view");
    var gen = ++panchangGen;
    clear(view);
    view.appendChild(el("p", "hint", "Computing panchang…"));
    try {
      var p = await vpv.computeDetailedPanchang(state.date, state.lat, state.lon, state.tz, state.locale);
      if (gen !== panchangGen) return; // superseded by a newer request
      hideBanner();
      renderedPanchang(p);
    } catch (e) {
      if (gen !== panchangGen) return;
      banner(labelError(e), e.detail || e.message || String(e));
      clear(view);
    }
  }

  async function renderKundali() {
    var view = $("#kundali-view");
    var gen = ++kundaliGen;
    clear(view);
    view.appendChild(el("p", "hint", "Casting chart…"));
    try {
      var c = await vpv.computeChart(
        {
          date: state.date,
          time: state.time,
          latitude: state.lat,
          longitude: state.lon,
          timezone: state.tz,
          ayanamsa: state.ayanamsa,
        },
        state.locale
      );
      if (gen !== kundaliGen) return; // superseded by a newer request
      hideBanner();
      renderedKundali(c);
    } catch (e) {
      if (gen !== kundaliGen) return;
      banner(labelError(e), e.detail || e.message || String(e));
      clear(view);
    }
  }

  function labelError(e) {
    if (e instanceof vpv.PanchangError) return "Panchang calculation failed";
    if (e instanceof vpv.ChartError) return "Chart calculation failed";
    return "Error";
  }

  document.addEventListener("DOMContentLoaded", function () {
    bind();
    setTab(location.hash === "#kundali" ? "kundali" : "panchang");
    renderActive();

    // keep tabs in sync with manual # hash edits; re-render only on a real switch
    window.addEventListener("hashchange", function () {
      var t = location.hash === "#kundali" ? "kundali" : "panchang";
      if (t !== state.tab) {
        setTab(t);
        renderActive();
      }
    });

    // keep visible charts sized when the browser window resizes
    window.addEventListener("resize", function () {
      resizeCharts(document.querySelector("#" + state.tab + "-view"));
    });
  });
})();