# Example Language Toggle + CDN Invocation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a real browser ESM build of the package, add a page-wide TypeScript/JavaScript toggle to the demo's code snippets, and put working npm/CDN load instructions at the top of the demo and in the README.

**Architecture:** A new `example/snippets.js` module owns all code shown to the user as a set of pure string functions (unit-testable in Node, no DOM). `app.js` describes each snippet as a spec object and delegates rendering to it; a registry of rendered `<code>` elements lets the language toggle swap text in place without re-running the WASM computation. A new esbuild target emits `dist/browser/vpv-panchangam.mjs` plus a `swisseph.wasm` sidecar so jsDelivr/unpkg can serve a working ESM module directly.

**Tech Stack:** TypeScript (build only), esbuild 0.21.5, Vitest 2, vanilla JS in the browser, highlight.js 11.9.0, ECharts 5.

## Global Constraints

- Package name is `vpv-panchangam`. Never write `vedic-panchanga` in new content.
- Package version is `0.4.0`; it must be injected from `package.json`, never hardcoded in a generated URL.
- CDN URLs are pinned to the exact version (`@0.4.0`), never a range like `@0.4` or `@latest`.
- The browser bundle and its `swisseph.wasm` MUST be siblings — `@swisseph/browser` resolves the sidecar via `new URL("./swisseph.wasm", import.meta.url)`.
- Do NOT add `module`, `exports`, `browser`, or `unpkg`/`jsdelivr` fields to `package.json`. The browser bundle is a CDN-only artifact; a `module` field would break tree-shaking for the Node path.
- Any esbuild invocation of `src/index.ts` or `example/entry.ts` MUST include `--external:node:*`, otherwise the `node:fs/promises` imports in `src/ephemeris/browser.ts:86-87` fail to resolve.
- The existing Vitest suite must keep passing; `npm run lint` (ESLint over `src/`) must stay clean.
- `dist/` and `example/dist/` are gitignored — never commit build output.
- No comments in code unless the surrounding code already uses them; match the existing terse `// ── section ──` banner style in `app.js`.

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/copy-wasm.cjs` | Copies `swisseph.wasm` next to any ESM bundle. Replaces `scripts/copy-demo-wasm.cjs`. |
| `scripts/verify-browser-build.mjs` | Loads `dist/browser/vpv-panchangam.mjs` and asserts a real panchang + chart compute. |
| `package.json` | `build:browser`, `verify:browser` scripts; `prepublishOnly` and `example:build` updated. |
| `example/snippets.js` | **Pure functions only.** Snippet composition (`snippetFor`) and install-band copy (`installBlock`). No DOM. |
| `test/example-snippets.test.ts` | Unit tests for the composer. |
| `example/entry.ts` | Exposes `version` on the `vpv` global, from an imported `package.json`. |
| `example/app.js` | Specs at the 29 `section()` call sites, `state.lang`, snippet registry, toggle + install-band wiring. |
| `example/index.html` | Invocation band markup, language toggle markup, `javascript.min.js` grammar, CSS. |
| `README.md` | Package-name fix + Browser/CDN section. |
| `example/README.md` | Documents the toggle and the invocation band. |

---

## Task 1: Browser ESM build pipeline

The CDN URLs in Tasks 4 and 5 are meaningless unless this produces a real, loadable browser module. This task is independently verifiable with `npm run verify:browser`.

**Files:**
- Create: `scripts/copy-wasm.cjs`
- Create: `scripts/verify-browser-build.mjs`
- Delete: `scripts/copy-demo-wasm.cjs`
- Modify: `package.json:18-21`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `dist/browser/vpv-panchangam.mjs` + `dist/browser/swisseph.wasm`. npm script `build:browser`. npm script `verify:browser`.

- [ ] **Step 1: Create `scripts/copy-wasm.cjs`**

Generalises the existing `scripts/copy-demo-wasm.cjs` to take an output directory, so the demo build and the package build share one code path.

```js
#!/usr/bin/env node
// Copies the Swiss Ephemeris WebAssembly binary next to an ESM bundle so the
// browser can fetch it at runtime. @swisseph/browser resolves the sidecar as
// new URL("./swisseph.wasm", import.meta.url), so the .wasm MUST be a sibling
// of the bundle that loads it.
//
// Usage: node scripts/copy-wasm.cjs <outdir>
const fs = require("node:fs");
const path = require("node:path");

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: node scripts/copy-wasm.cjs <outdir>");
  process.exit(1);
}

const packageRoot = path.dirname(require.resolve("@swisseph/browser"));
const srcFile = path.join(packageRoot, "swisseph.wasm");
const outFile = path.join(__dirname, "..", outDir, "swisseph.wasm");

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.copyFileSync(srcFile, outFile);
console.log("copied swisseph.wasm ->", path.relative(process.cwd(), outFile));
```

- [ ] **Step 2: Delete `scripts/copy-demo-wasm.cjs`**

```bash
rm scripts/copy-demo-wasm.cjs
```

Two callers still reference it; Step 4 rewires both.

- [ ] **Step 3: Create `scripts/verify-browser-build.mjs`**

This is the automated proof that the bundle plus its WASM sidecar actually compute. Loading the bundle from disk reproduces the exact relative resolution a CDN performs, so this catches a missing or mislocated `.wasm` before publication.

```js
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
```

- [ ] **Step 4: Rewire `package.json` scripts**

Replace the `copy-demo-wasm.cjs` references and add the two new scripts.

```json
  "scripts": {
    "build": "tsc",
    "build:browser": "esbuild src/index.ts --bundle --format=esm --platform=browser --outfile=dist/browser/vpv-panchangam.mjs --external:node:* && node scripts/copy-wasm.cjs dist/browser",
    "verify:browser": "npm run build:browser && node scripts/verify-browser-build.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "format": "prettier --write src/ test/",
    "format:check": "prettier --check src/ test/",
    "prepublishOnly": "npm run build && npm run build:browser",
    "example:build": "esbuild example/entry.ts --bundle --format=esm --platform=browser --outfile=example/dist/vpv-demo.mjs --external:node:* && node scripts/copy-wasm.cjs example/dist",
    "demo": "npm run example:build && node example/serve.js",
    "demo:watch": "node scripts/copy-wasm.cjs example/dist && (esbuild example/entry.ts --bundle --format=esm --platform=browser --outfile=example/dist/vpv-demo.mjs --external:node:* --watch & node example/serve.js)",
    "bump:major": "npm version major",
    "bump:minor": "npm version minor"
  },
```

- [ ] **Step 5: Run the verification**

Run: `npm run verify:browser`
Expected: esbuild reports `dist/browser/vpv-panchangam.mjs  ~278kb`, then `copied swisseph.wasm -> dist/browser/swisseph.wasm`, then `Swiss Ephemeris WASM initialized: 2.10.03`, then `browser build OK — vara: Monday | ascendant: Aries`. Exit code 0.

- [ ] **Step 6: Confirm the demo build still works after the script rename**

Run: `npm run example:build`
Expected: esbuild writes `example/dist/vpv-demo.mjs` and the script prints `copied swisseph.wasm -> example/dist/swisseph.wasm`. Exit code 0.

- [ ] **Step 7: Confirm the existing suite and lint are unaffected**

Run: `npm test && npm run lint`
Expected: all Vitest suites pass; ESLint reports no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json scripts/copy-wasm.cjs scripts/verify-browser-build.mjs
git rm --cached scripts/copy-demo-wasm.cjs 2>/dev/null || true
git commit -m "build: browser ESM bundle for CDN loading

The npm entry point is CommonJS with a lazily-imported ESM-only
ephemeris, so no bare package URL on a CDN can work. dist/browser/
carries a pre-bundled ESM module with swisseph.wasm beside it, which
is what @swisseph/browser's new URL('./swisseph.wasm', import.meta.url)
resolution requires.

copy-demo-wasm.cjs generalises to copy-wasm.cjs <outdir> so the demo
and package builds share one WASM-copying path. verify:browser loads
the built bundle and asserts a real panchang and chart."
```

---

## Task 2: Snippet composer

The heart of the feature: pure string functions that turn a spec into a TypeScript or JavaScript snippet. Unit-testable with no DOM.

**Files:**
- Create: `example/snippets.js`
- Create: `test/example-snippets.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `window.vpvSnippets` and `module.exports` with:
  - `version(vpv) -> string` — `vpv.version` if a non-empty string, else `"0.4.0"`.
  - `browserUrl(version, cdn) -> string` — `cdn` is `"jsdelivr"` or `"unpkg"`.
  - `snippetFor(spec, version, lang) -> string` — `lang` is `"ts"` or `"js"`.
  - `installBlock(tab, version) -> string` — `tab` is `"npm"`, `"jsdelivr"`, `"unpkg"`, or `"script"`. Throws on anything else.
  - `PACKAGE`, `FALLBACK_VERSION` constants.
  - Snippet spec shape: `{ fn, type, varName, args, extract?, tail? }` where `extract` is `{ varName, type, value }`.

> **Why a UMD wrapper instead of a plain ESM module:** `index.html` loads this file with a
> classic `<script src>` tag (the demo is not bundled for the page — `app.js` is also a
> plain script), so the module cannot be ESM-only. The `module.exports` branch exists purely
> so Vitest can import it; the `(ns as any).default ?? ns` line in the test handles Vite's
> CJS interop. This interop was verified to work with a `.js` extension because
> `package.json` has no `"type": "module"` field.
>
> Do **not** rename the file to `.cjs`: the browser needs it served as a script, and a `.cjs`
> extension risks a MIME-type rejection from the static server.

- [ ] **Step 1: Write the failing test file**

```ts
import { describe, it, expect } from "vitest";
import * as ns from "../example/snippets.js";

const snippets = (ns as any).default ?? ns;
const { snippetFor, installBlock, version, browserUrl, PACKAGE, FALLBACK_VERSION } = snippets;

const PAN = {
  fn: "computeDetailedPanchang",
  type: "PanchangResponse",
  varName: "p",
  args: '"2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en"',
  tail: "p.vara, p.panchang.paksha",
};

const HORA = {
  fn: "computeDetailedPanchang",
  type: "PanchangResponse",
  varName: "p",
  args: '"2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en"',
  extract: { varName: "h", type: "Hora", value: "p.hora" },
  tail: "h.day, h.night",
};

describe("version", () => {
  it("uses the injected build version", () => {
    expect(version({ version: "9.9.9" })).toBe("9.9.9");
  });

  it("falls back when the global carries no version", () => {
    expect(version({})).toBe(FALLBACK_VERSION);
    expect(version(null)).toBe(FALLBACK_VERSION);
    expect(version({ version: "" })).toBe(FALLBACK_VERSION);
  });
});

describe("browserUrl", () => {
  it("pins the exact version on jsDelivr", () => {
    expect(browserUrl("0.4.0", "jsdelivr")).toBe(
      "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs",
    );
  });

  it("pins the exact version on unpkg", () => {
    expect(browserUrl("0.4.0", "unpkg")).toBe(
      "https://unpkg.com/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs",
    );
  });
});

describe("snippetFor — typescript", () => {
  const out = snippetFor(PAN, "0.4.0", "ts");

  it("imports the function and the result type from the package", () => {
    expect(out).toContain(
      'import { computeDetailedPanchang, type PanchangResponse } from "vpv-panchangam";',
    );
  });

  it("annotates the declaration", () => {
    expect(out).toContain(
      'const p: PanchangResponse = await computeDetailedPanchang("2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en");',
    );
  });

  it("never references a CDN", () => {
    expect(out).not.toContain("https://");
  });

  it("keeps the field-access tail", () => {
    expect(out).toContain("p.vara, p.panchang.paksha // featured fields read above");
  });

  it("annotates an extract line and imports its type", () => {
    const h = snippetFor(HORA, "0.4.0", "ts");
    expect(h).toContain(
      'import { computeDetailedPanchang, type PanchangResponse, type Hora } from "vpv-panchangam";',
    );
    expect(h).toContain("const h: Hora = p.hora;");
  });
});

describe("snippetFor — javascript", () => {
  const out = snippetFor(PAN, "0.4.0", "js");

  it("imports the function from the jsDelivr browser bundle", () => {
    expect(out).toContain(
      'import { computeDetailedPanchang } from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("carries no type annotations", () => {
    expect(out).not.toContain("type ");
    expect(out).not.toContain(": PanchangResponse");
  });

  it("leaves an unannotated declaration", () => {
    expect(out).toContain(
      'const p = await computeDetailedPanchang("2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en");',
    );
  });

  it("leaves an unannotated extract line", () => {
    const h = snippetFor(HORA, "0.4.0", "js");
    expect(h).toContain("const h = p.hora;");
    expect(h).not.toContain("Hora");
  });

  it("omits the trailing comment's type-only tail difference", () => {
    expect(out).toContain("p.vara, p.panchang.paksha // featured fields read above");
  });
});

describe("snippetFor — version threading", () => {
  it("threads the version it is given into the URL", () => {
    expect(snippetFor(PAN, "1.2.3", "js")).toContain(
      "https://cdn.jsdelivr.net/npm/vpv-panchangam@1.2.3/dist/browser/vpv-panchangam.mjs",
    );
  });
});

describe("installBlock", () => {
  it("npm shows the install command and a bare-specifier import", () => {
    const out = installBlock("npm", "0.4.0");
    expect(out).toContain("npm install vpv-panchangam");
    expect(out).toContain('import { computeDetailedPanchang } from "vpv-panchangam";');
  });

  it("jsdelivr shows the pinned browser bundle URL", () => {
    expect(installBlock("jsdelivr", "0.4.0")).toBe(
      'import { computeDetailedPanchang } from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("unpkg mirrors the jsDelivr URL on a different host", () => {
    expect(installBlock("unpkg", "0.4.0")).toBe(
      'import { computeDetailedPanchang } from "https://unpkg.com/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("script shows a paste-ready module tag", () => {
    const out = installBlock("script", "0.4.0");
    expect(out).toContain('<script type="module">');
    expect(out).toContain("</script>");
    expect(out).toContain("window.vpv = vpv;");
    expect(out).toContain(
      'import * as vpv from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("threads the version into every tab that carries a URL", () => {
    expect(installBlock("jsdelivr", "2.0.0")).toContain("@2.0.0/");
    expect(installBlock("unpkg", "2.0.0")).toContain("@2.0.0/");
    expect(installBlock("script", "2.0.0")).toContain("@2.0.0/");
  });

  it("rejects an unknown tab", () => {
    expect(() => installBlock("bogus", "0.4.0")).toThrow();
  });
});

describe("package name", () => {
  it("is the published name, not the v0.2.0 name", () => {
    expect(PACKAGE).toBe("vpv-panchangam");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/example-snippets.test.ts`
Expected: FAIL — `Failed to load url ./example/snippets.js` (the module does not exist yet).

- [ ] **Step 3: Create `example/snippets.js`**

Dual-exported so the same file works as a plain browser global (for `index.html`) and as a CommonJS module (for Vitest).

```js
/*! Snippet composition for the vpv-panchangam browser demo.
 *  Pure string functions — no DOM, no library access. Exposed as
 *  `window.vpvSnippets` in the browser and via module.exports for tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.vpvSnippets = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PACKAGE = "vpv-panchangam";
  var FALLBACK_VERSION = "0.4.0";
  var BROWSER_ENTRY = "dist/browser/vpv-panchangam.mjs";
  var CDNS = {
    jsdelivr: "https://cdn.jsdelivr.net/npm/",
    unpkg: "https://unpkg.com/",
  };

  // the demo bundle injects package.json's version onto the vpv global; a stale
  // or missing bundle must never break snippet rendering
  function version(vpv) {
    var v = vpv && vpv.version;
    return typeof v === "string" && v ? v : FALLBACK_VERSION;
  }

  function browserUrl(ver, cdn) {
    var base = CDNS[cdn];
    if (!base) throw new Error("unknown cdn: " + cdn);
    return base + PACKAGE + "@" + ver + "/" + BROWSER_ENTRY;
  }

  // types a snippet needs in scope: the result type, plus any extracted value
  function typeNames(spec) {
    var names = [];
    if (spec.type) names.push(spec.type);
    if (spec.extract && spec.extract.type) names.push(spec.extract.type);
    return names;
  }

  function snippetFor(spec, ver, lang) {
    var types = typeNames(spec);
    var header;
    if (lang === "ts") {
      var parts = [spec.fn].concat(
        types.map(function (t) {
          return "type " + t;
        })
      );
      header = "import { " + parts.join(", ") + ' } from "' + PACKAGE + '";';
    } else {
      header = "import { " + spec.fn + ' } from "' + browserUrl(ver, "jsdelivr") + '";';
    }

    var lines = [header, ""];

    var decl = "const " + spec.varName;
    if (lang === "ts" && spec.type) decl += ": " + spec.type;
    lines.push(decl + " = await " + spec.fn + "(" + spec.args + ");");

    if (spec.extract) {
      var ex = "const " + spec.extract.varName;
      if (lang === "ts" && spec.extract.type) ex += ": " + spec.extract.type;
      lines.push(ex + " = " + spec.extract.value + ";");
    }

    if (spec.tail) {
      lines.push("");
      lines.push(spec.tail + " // featured fields read above");
    }

    return lines.join("\n");
  }

  function installBlock(tab, ver) {
    if (tab === "npm") {
      return (
        "npm install " +
        PACKAGE +
        "\n\n" +
        'import { computeDetailedPanchang } from "' +
        PACKAGE +
        '";'
      );
    }
    if (tab === "jsdelivr" || tab === "unpkg") {
      return (
        'import { computeDetailedPanchang } from "' + browserUrl(ver, tab) + '";'
      );
    }
    if (tab === "script") {
      return (
        '<script type="module">\n' +
        "  import * as vpv from " +
        JSON.stringify(browserUrl(ver, "jsdelivr")) +
        ";\n\n" +
        "  // vpv.computeDetailedPanchang, vpv.computeChart, …\n" +
        "  window.vpv = vpv;\n" +
        "</script>"
      );
    }
    throw new Error("unknown install tab: " + tab);
  }

  return {
    PACKAGE: PACKAGE,
    FALLBACK_VERSION: FALLBACK_VERSION,
    version: version,
    browserUrl: browserUrl,
    typeNames: typeNames,
    snippetFor: snippetFor,
    installBlock: installBlock,
  };
});
```

- [ ] **Step 4: Load the composer before `app.js`**

`app.js` reads `window.vpvSnippets` at the top of its IIFE, so the composer must be
evaluated first. `app.js` and `vpv-demo.mjs` are both `type="module"` (deferred,
run in document order), while a classic `<script src>` in `<head>` runs during
parsing — so a plain script tag in `<head>` is guaranteed to win the race.

Insert after the highlight.js tags in `example/index.html`, at line 18:

```html
  <script src="./snippets.js"></script>
```

Leave it as a classic script. Adding `type="module"` here would make it deferred
alongside `app.js`, and since it would then be evaluated in document order *before*
`app.js` only by position — relying on that is fragile, and it would break the
`window.vpvSnippets` global the UMD wrapper sets.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/example-snippets.test.ts`
Expected: PASS — 22 tests across 7 describes, 0 failures.

- [ ] **Step 6: Run the full suite and format check**

Run: `npm test && npm run format:check`
Expected: all suites pass including the new one; Prettier reports the new test file is formatted (if not, run `npx prettier --write test/example-snippets.test.ts` and re-run).

- [ ] **Step 7: Commit**

```bash
git add example/snippets.js example/index.html test/example-snippets.test.ts
git commit -m "feat(example): snippet composer with TypeScript/JavaScript variants

One body per block, composed differently per language: TypeScript
imports from the package and annotates the declaration and any
extracted value; JavaScript imports from the pinned jsDelivr browser
bundle and carries no annotations. The declaration is generated by the
composer, never rewritten out of the body, so neither direction does
string surgery on code."
```

---

## Task 3: Snippet specs at the call sites

Convert all 29 `section()` calls to spec objects and add a self-contained import line to every block. No language toggle yet — the page renders TypeScript only, so this is a self-contained visual improvement.

**Files:**
- Modify: `example/app.js:584-622` (call builders), `example/app.js:83-100` (`section`), and the 29 `section()` call sites
- Modify: `example/entry.ts:4-14`

**Interfaces:**
- Consumes: `window.vpvSnippets.snippetFor(spec, version, "ts")` and `window.vpvSnippets.version(vpv)` from Task 2.
- Produces: `panchangArgs()`, `chartArgs()`, `panchangSpec(tail, extra)`, `chartSpec(tail, extra)` in `app.js`; `vpv.version` string on the global; `section(container, title, content, spec, json)` accepting a spec.

- [ ] **Step 1: Expose the version on the demo global**

`example/entry.ts` gains a `package.json` import. esbuild inlines JSON natively, so no `--define` flag and no shell quoting is needed.

```ts
// Demo entry: re-exports the public library surface into the browser global.
// Built as an ES module so @swisseph/browser's import.meta.url stays intact and
// its WASM sidecar resolves relative to this bundle (example/dist/swisseph.wasm).
import * as lib from "../src/index";
import pkg from "../package.json";

const vpv: Record<string, unknown> = {
  version: pkg.version,
  computeDetailedPanchang: lib.computeDetailedPanchang,
  computeChart: lib.computeChart,
  PanchangError: lib.PanchangError,
  ChartError: lib.ChartError,
  getLocaleTable: lib.getLocaleTable,
  localeTables: lib.localeTables,
  EphemerisService: lib.EphemerisService,
};

(globalThis as Record<string, unknown>).vpv = vpv;
```

- [ ] **Step 2: Replace the call builders with argument builders**

In `example/app.js`, replace `panchangCall()` (line 584), `chartCall()` (line 600), and `panelSnippet()` (line 620) with the following. The builders now return only the argument text — the declaration belongs to the spec, and the tail is a spec field.

```js
  // ───────────────────────────── snippet specs ─────────────────────────────

  var snippets = window.vpvSnippets;
  var vpvVersion = snippets.version(vpv);

  // bare call arguments — the `const … = await …` declaration is the spec's job
  function panchangArgs() {
    return (
      '"' + state.date + '", ' + Number(state.lat.toFixed(4)) + ", " +
      Number(state.lon.toFixed(4)) + ', "' + state.tz + '", "' + state.locale + '"'
    );
  }

  function chartArgs() {
    return (
      "{\n" +
      '  date: "' + state.date + '",\n' +
      '  time: "' + state.time + '",\n' +
      "  latitude: " + Number(state.lat.toFixed(4)) + ",\n" +
      "  longitude: " + Number(state.lon.toFixed(4)) + ",\n" +
      '  timezone: "' + state.tz + '",\n' +
      '  ayanamsa: "' + state.ayanamsa + '"\n' +
      '}, "' + state.locale + '"'
    );
  }

  function panchangSpec(tail, extra) {
    return Object.assign(
      {
        fn: "computeDetailedPanchang",
        type: "PanchangResponse",
        varName: "p",
        args: panchangArgs(),
        tail: tail,
      },
      extra || {}
    );
  }

  function chartSpec(tail, extra) {
    return Object.assign(
      {
        fn: "computeChart",
        type: "ChartResponse",
        varName: "c",
        args: chartArgs(),
        tail: tail,
      },
      extra || {}
    );
  }
```

- [ ] **Step 3: Make `section()` render a spec**

Replace the `section` function at `example/app.js:83-100`. This version registers each code element for the language toggle that Task 4 wires up, and keeps rendering TypeScript until then.

```js
  // rendered <code> elements, so the language toggle can swap text in place
  // without re-running the WASM computation
  var snippetRegistry = [];

  function section(container, title, content, spec, json) {
    var sec = el("section", "card");
    sec.appendChild(el("h3", "section-title", title));
    if (content) sec.appendChild(content);
    if (spec) {
      var pre = el("pre", "code-block");
      var code = el("code", "language-ts");
      code.textContent = snippets.snippetFor(spec, vpvVersion, "ts");
      // tag input shown even if a CDN loaded hljs
      pre.classList.add("hli");
      pre.appendChild(code);
      sec.appendChild(pre);
      snippetRegistry.push({ code: code, spec: spec });
      if (hljs) hljs.highlightElement(code);
    }
    if (json !== undefined) sec.appendChild(jsonToggle(json));
    container.appendChild(sec);
    resizeCharts(sec);
  }
```

- [ ] **Step 4: Reset the registry in `clear()`**

`clear()` runs on every recompute and tab switch. Without this reset, detached code elements accumulate across re-renders and the toggle in Task 4 would try to write to orphaned nodes.

Replace the `clear` function at `example/app.js:38-41`:

```js
  function clear(node) {
    disposeCharts(node);
    node.textContent = "";
    snippetRegistry.length = 0;
  }
```

- [ ] **Step 5: Convert the 17 panchang call sites**

Each replacement below is the full new value of the 4th `section()` argument. Line numbers are the **start** of the `section(` call, which is what `rg` reports.

| Line | Title | New argument |
|---|---|---|
| 646 | Panchang overview | `panchangSpec()` |
| 649 | Sun & Moon timings | `panchangSpec("p.sun_moon.sunrise, p.sun_moon.sunset")` |
| 670 | Vara & Paksha | `panchangSpec("p.vara, p.panchang.paksha")` |
| 697 | Panchang (now) | `panchangSpec("p.panchang.tithi, p.panchang.nakshatra, p.panchang.yoga, p.panchang.karana")` |
| 726 | Panchang for date | `panchangSpec("p.panchang.tithi, p.panchang.nakshatra, p.panchang.yoga, p.panchang.karana, p.panchang.paksha")` |
| 740 | Rashi & Nakshatra | `panchangSpec("p.rashi_nakshatra.sunsign, p.rashi_nakshatra.moon_nakshatra_padas")` |
| 779 | Calendars | `panchangSpec("p.lunar_month, p.calendars, p.tamil_calendar")` |
| 788 | Ritu & Ayana | `panchangSpec("p.ritu_ayana")` |
| 821 | Auspicious timings | `panchangSpec("p.auspicious_timings")` |
| 844 | Inauspicious timings | `panchangSpec("p.inauspicious_timings")` |
| 853 | Udaya Lagna | `panchangSpec("p.udaya_lagna")` |
| 884 | Chandrabalam & Tarabalam | `panchangSpec("p.chandrabalam, p.tarabalam")` |
| 887 | Shool & Vasa | `panchangSpec("p.shool_vasa")` |
| 923 | Ganda Mula & Ravi Yoga | `panchangSpec("p.yogas_extra")` |
| 983 | Gowri Panchangam | `panchangSpec("p.gowri_panchang.day  // 8 segments: " + order)` |
| 1030 | Nalla Neram | `panchangSpec("p.nalla_neram")` |
| 1158 | Day at a glance | `panchangSpec("p.auspicious_timings + p.inauspicious_timings + p.gowri_panchang + p.hora + p.nalla_neram")` |

- [ ] **Step 6: Convert the two panchang call sites that extract a typed value**

Line 1013 (Hora) — the extract line teaches the `Hora` type, so both tabs get a named binding. The current tail is `p.hora.day, p.hora.night`; the new one reads through the binding:

```js
    section(
      view,
      "Hora (planetary hours)",
      box,
      panchangSpec("h.day, h.night", {
        extract: { varName: "h", type: "Hora", value: "p.hora" },
      }),
      hora
    );
```

Line 1078 (Tyajyam) — same shape with the `Tyajyam` type. The current tail is `p.tyajyam`:

```js
    section(
      view,
      "Tyajyam (avoiding periods)",
      box,
      panchangSpec("t", {
        extract: { varName: "t", type: "Tyajyam", value: "p.tyajyam" },
      }),
      t
    );
```

- [ ] **Step 7: Convert the 10 chart call sites**

| Line | Title | New argument |
|---|---|---|
| 1194 | Birth details | `chartSpec()` |
| 1230 | Planets | `chartSpec("c.planets_data")` |
| 1328 | D1 natal chart | `chartSpec("c.d1_chart, c.ascendant, c.planets_data")` |
| 1510 | Divisional charts | `chartSpec("c.vargas, c.varga_order")` |
| 1636 | Vimshottari dasha | `chartSpec("c.dasha, c.dasha_antar")` |
| 1656 | Jaimini karakas | `chartSpec("c.karakas, c.karakamsa, c.swamsa")` |
| 1674 | Kalsarpa dosha | `chartSpec("k.present", { extract: { varName: "k", type: "KalsarpaResult", value: "c.kalsarpa" } })` |
| 1698 | Friendships | `chartSpec("f.composite, f.natural", { extract: { varName: "f", type: "FriendshipTables", value: "c.friendships" } })` |
| 1738 | Drishti (aspects) | `chartSpec("d.aspects, d.mutual, d.by_planet", { extract: { varName: "d", type: "AspectResult", value: "c.drishti" } })` |

- [ ] **Step 8: Convert the one chart call site that extracts a typed value**

Line 1568 (Ashtakavarga):

```js
    section(
      view,
      "Ashtakavarga",
      box,
      chartSpec("ak.bav, ak.sav", {
        extract: { varName: "ak", type: "AshtakavargaResult", value: "c.ashtakavarga" },
      }),
      akv
    );
```

- [ ] **Step 9: Verify no old-style snippet arguments remain**

Run: `rg -n 'panelSnippet|panchangCall|chartCall' example/app.js`
Expected: no matches. All three helpers are gone and every `section()` receives a spec.

- [ ] **Step 10: Build and eyeball the page**

```bash
npm run example:build
node example/serve.js &
```

Open <http://localhost:8080>. Confirm: the Panchang overview block now shows an `import { computeDetailedPanchang, type PanchangResponse } from "vpv-panchangam";` line above the call; the Hora block shows a `const h: Hora = p.hora;` line; both tabs of the demo render with no console errors. Stop the server.

- [ ] **Step 11: Commit**

```bash
git add example/app.js example/entry.ts
git commit -m "feat(example): give every snippet a self-contained import line

Each of the 29 blocks becomes a spec that the composer renders, so a
copied block is runnable on its own. Blocks that read a named type
(Hora, Tyajyam, AshtakavargaResult, KalsarpaResult, FriendshipTables,
AspectResult) declare a typed binding for it."
```

---

## Task 4: Page-wide language toggle

**Files:**
- Modify: `example/app.js` — `state` (line 15), `bind()` (line 1743)
- Modify: `example/index.html:16-17` (grammar), `header.top` (line 215), CSS (near line 212)

**Interfaces:**
- Consumes: `snippetRegistry` and `snippets.snippetFor` from Task 3; `state.lang`; `applyLang()`, `setLang(lang)`.
- Produces: `#lang-ts` and `#lang-js` buttons; `state.lang` persisted to `localStorage` key `vpv-demo-lang`.

- [ ] **Step 1: Add `lang` to state with a guarded persisted read**

Replace the `state` object at `example/app.js:15-23`:

```js
  var state = {
    date: new Date().toISOString().slice(0, 10),
    time: "12:00",
    lat: 23.1765,
    lon: 75.7885,
    tz: "Asia/Kolkata",
    ayanamsa: "lahiri",
    locale: "en",
    lang: readLang(),
  };

  // localStorage throws in some privacy modes; fall back to the default
  function readLang() {
    try {
      return localStorage.getItem("vpv-demo-lang") === "js" ? "js" : "ts";
    } catch (e) {
      return "ts";
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem("vpv-demo-lang", lang);
    } catch (e) {
      /* in-memory only for this session */
    }
  }
```

- [ ] **Step 2: Add the toggle logic next to `setTab()`**

Insert after `setTab`, which ends at `example/app.js:1778`:

```js
  // swaps snippet text in place — never re-runs the WASM computation, and the
  // page height is unchanged so there is no scroll jump
  function applyLang() {
    snippetRegistry.forEach(function (entry) {
      var text = snippets.snippetFor(entry.spec, vpvVersion, state.lang);
      entry.code.textContent = text;
      entry.code.className = state.lang === "ts" ? "language-ts" : "language-javascript";
      if (hljs) hljs.highlightElement(entry.code);
    });
    $("#lang-ts").classList.toggle("active", state.lang === "ts");
    $("#lang-js").classList.toggle("active", state.lang === "js");
  }

  function setLang(lang) {
    if (lang !== "ts" && lang !== "js") return;
    state.lang = lang;
    saveLang(lang);
    applyLang();
  }
```

- [ ] **Step 3: Wire the buttons in `bind()`**

Add inside `bind()`, after the `$("#tab-kundali")` listener block that closes `bind()` at `example/app.js:1769`:

```js
    $("#lang-ts").addEventListener("click", function () {
      setLang("ts");
    });
    $("#lang-js").addEventListener("click", function () {
      setLang("js");
    });
```

- [ ] **Step 4: Apply the persisted language on load**

In the `DOMContentLoaded` handler at `example/app.js:1873`, add `applyLang();` on the line after `bind();` (line 1874) so the stored choice is reflected before the first paint of snippets:

```js
  document.addEventListener("DOMContentLoaded", function () {
    bind();
    applyLang();
    setTab(location.hash === "#kundali" ? "kundali" : "panchang");
    renderActive();
```

- [ ] **Step 5: Add the toggle markup to the header**

Replace the `header.top` block at `example/index.html:215-221`, whose current content is:

```html
  <header class="top">
    <h1>vpv-panchangam — interactive demo</h1>
    <div class="tag">
      Every feature of the library, driven from the browser build. Exact-input
      TypeScript snippets are shown next to each feature.
    </div>
  </header>
```

with:

```html
  <header class="top">
    <div class="top-row">
      <div>
        <h1>vpv-panchangam — interactive demo</h1>
        <div class="tag">
          Every feature of the library, driven from the browser build. Exact-input
          snippets are shown next to each feature, in TypeScript or JavaScript.
        </div>
      </div>
      <div class="lang-toggle" role="group" aria-label="Snippet language">
        <button type="button" id="lang-ts" class="active">TypeScript</button>
        <button type="button" id="lang-js">JavaScript</button>
      </div>
    </div>
  </header>
```

The `.top-row` wrapper is required: without it the `justify-content: space-between` in Step 7 has no flex parent to distribute against, and the toggle would stack below the title.

- [ ] **Step 6: Load the JavaScript highlight grammar**

highlight.js treats TypeScript and JavaScript as separate grammars, so the JS tab renders unstyled without this. Add after the typescript grammar at `example/index.html:17`:

```html
  <script src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/languages/javascript.min.js"></script>
```

- [ ] **Step 7: Add the CSS**

Append inside the existing `<style>` block, after the `.tabs button.active` rule (`example/index.html:89`):

```css
    .top-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .lang-toggle { display: flex; gap: 6px; flex-shrink: 0; }
    .lang-toggle button {
      border: 1px solid #3d444d;
      background: transparent;
      color: #f0f6fc;
      padding: 5px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .lang-toggle button.active { background: #0969da; border-color: #0969da; }
```

- [ ] **Step 8: Verify in the browser**

```bash
npm run example:build
node example/serve.js &
```

Open <http://localhost:8080>. Confirm each of these, then stop the server:

1. The header shows a `TypeScript | JavaScript` toggle with TypeScript active.
2. Clicking JavaScript swaps every snippet's import line to the jsDelivr URL and removes all type annotations — across both the Panchang and Kundali tabs.
3. No network/WASM activity occurs on toggle (the browser Network tab shows no new request, and the console is clean).
4. Scrolling does not jump.
5. Switching to Kundali and back keeps JavaScript selected.
6. Reloading the page keeps JavaScript selected.
7. JavaScript snippets are syntax-highlighted, not plain text.
8. Clicking Apply re-renders in the selected language.

- [ ] **Step 9: Commit**

```bash
git add example/app.js example/index.html
git commit -m "feat(example): page-wide TypeScript/JavaScript snippet toggle

A single segmented control flips every code block at once. The swap
walks a registry of rendered <code> elements and rewrites their text,
so no recompute runs and the page height — and therefore the scroll
position — is unchanged. The choice persists to localStorage."
```

---

## Task 5: Top invocation band

**Files:**
- Modify: `example/index.html` — markup between `header.top` and `.controls`; CSS
- Modify: `example/app.js` — `bind()` and the `DOMContentLoaded` handler

**Interfaces:**
- Consumes: `snippets.installBlock(tab, version)` from Task 2.
- Produces: `.install` band; `setInstallTab(tab)`; `#install-copy` button. Exported tab order: `npm`, `jsdelivr`, `unpkg`, `script`.

- [ ] **Step 1: Add the band markup**

Insert between `</header>` (line 222) and `<form class="controls" id="controls" onsubmit="return false">` (line 223) in `example/index.html`:

```html
  <section class="install" aria-label="Install and load">
    <div class="install-tabs" role="tablist">
      <button type="button" data-install="npm" class="active">npm</button>
      <button type="button" data-install="jsdelivr">jsDelivr</button>
      <button type="button" data-install="unpkg">unpkg</button>
      <button type="button" data-install="script">&lt;script type="module"&gt;</button>
    </div>
    <div class="install-body">
      <pre class="code-block"><code id="install-code" class="language-bash"></code></pre>
      <button type="button" id="install-copy" class="ghost">Copy</button>
    </div>
  </section>
```

- [ ] **Step 2: Add the CSS**

Append inside the `<style>` block, after the `.lang-toggle button.active` rule added in Task 4:

```css
    .install {
      background: #fff;
      border-bottom: 1px solid var(--line);
      padding: 12px 24px;
    }
    .install-tabs { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
    .install-tabs button {
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      border-radius: 6px;
      font-size: 12px;
      padding: 4px 12px;
    }
    .install-tabs button.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .install-body { display: flex; align-items: flex-start; gap: 10px; }
    .install-body pre.code-block { flex: 1; margin: 0; }
    button.ghost {
      background: #fff;
      color: var(--accent);
      flex-shrink: 0;
      min-width: 74px;
    }
    button.ghost:hover { background: #f6f8fa; }
```

- [ ] **Step 3: Add the band behaviour to `app.js`**

Insert immediately after `setLang` (added in Task 4):

```js
  // ───────────────────────────── invocation band ───────────────────────────

  var installTab = "npm";

  function renderInstall() {
    var code = $("#install-code");
    code.textContent = snippets.installBlock(installTab, vpvVersion);
    code.className = "language-bash";
    if (hljs) hljs.highlightElement(code);
  }

  function setInstallTab(tab) {
    installTab = tab;
    document.querySelectorAll("[data-install]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-install") === tab);
    });
    renderInstall();
  }

  function copyInstall() {
    var btn = $("#install-copy");
    var text = snippets.installBlock(installTab, vpvVersion);
    function done(label) {
      btn.textContent = label;
      setTimeout(function () {
        btn.textContent = "Copy";
      }, 1200);
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      // select the text so the user can copy manually
      var range = document.createRange();
      range.selectNodeContents($("#install-code"));
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () {
        done("Copied");
      },
      function () {
        done("Press ⌘C");
      }
    );
  }
```

- [ ] **Step 4: Wire the band in `bind()`**

Add inside `bind()`, after the language-toggle listeners added in Task 4:

```js
    document.querySelectorAll("[data-install]").forEach(function (b) {
      b.addEventListener("click", function () {
        setInstallTab(b.getAttribute("data-install"));
      });
    });
    $("#install-copy").addEventListener("click", copyInstall);
    setInstallTab("npm");
```

- [ ] **Step 5: Verify in the browser**

```bash
npm run example:build
node example/serve.js &
```

Open <http://localhost:8080>. Confirm, then stop the server:

1. The band sits between the title and the controls, showing `npm install vpv-panchangam` on load.
2. Each of the four tabs swaps the code: jsDelivr and unpkg show their pinned `@0.4.0/dist/browser/…` URLs; the fourth shows a complete `<script type="module">` block ending in `window.vpv = vpv;`.
3. Only one tab is highlighted at a time.
4. Clicking Copy writes the visible text to the clipboard and the button reads "Copied" for ~1.2s, then reverts.
5. The band does not depend on the language toggle — switching to JavaScript leaves it unchanged.
6. The band is roughly six lines tall, not a full screen.

- [ ] **Step 6: Verify the CDN URL in the band actually works**

This is the one thing the automated suite cannot prove, because it needs a real CDN.

1. Run `npm run build:browser`, then `npx npm-pack` style check that `dist/browser/` is in the tarball:
   Run: `npm pack --dry-run 2>&1 | rg "dist/browser/"`
   Expected: both `dist/browser/vpv-panchangam.mjs` and `dist/browser/swisseph.wasm` listed (`files: ["dist/"]` already covers them).
2. Publish or `npm pack` + install into a scratch directory, serve that copy of `dist/` over HTTP, and load a page containing:
   ```html
   <script type="module">
     import { computeDetailedPanchang } from "./dist/browser/vpv-panchangam.mjs";
     const p = await computeDetailedPanchang("2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en");
     document.title = p.vara.english;
   </script>
   ```
   Expected: the document title becomes `Monday` and the console shows `Swiss Ephemeris WASM initialized: 2.10.03`.
3. Note in the PR description whether Emscripten fell back from `instantiateStreaming` (a console warning about the MIME type is expected and harmless — jsDelivr may serve `.wasm` as `application/octet-stream`). This is a documentation note, not a defect.

- [ ] **Step 7: Commit**

```bash
git add example/app.js example/index.html
git commit -m "feat(example): npm/CDN invocation band at the top of the demo

Four tabs — npm, jsDelivr, unpkg, and a paste-ready script tag — with a
copy button. URLs are pinned to the exact build, because they hardcode
the /dist/browser/ path and a floating range would break on the next
release. Deliberately independent of the language toggle."
```

---

## Task 6: Documentation

**Files:**
- Modify: `README.md:1, 34, 39-44, 51, 71, 147, 170`
- Modify: `src/index.ts:2`
- Modify: `example/README.md:1-24`

**Interfaces:**
- Consumes: nothing new. Documents Tasks 1, 4, and 5.
- Produces: no code changes except the one-word comment fix in `src/index.ts`.

- [ ] **Step 1: Fix the stale package name in `README.md`**

Six occurrences of the v0.2.0 name `vedic-panchanga` must become `vpv-panchangam`: the H1 title (line 1), the `npm install` line (line 34), and the four `import` lines (51, 71, 147, 170).

Run: `rg -c "vedic-panchanga" README.md`
Expected: `6`. Fix every one.

Run: `rg -n "vedic-panchanga" README.md`
Expected: no matches.

- [ ] **Step 2: Replace the vague "Browser usage" section**

Replace the `## Browser usage` section at `README.md:39-44` with:

````markdown
## Browser and CDN usage

The npm entry point is **CommonJS** and it lazily `import()`s the ESM-only
`@swisseph/browser` package, so a CDN cannot load the package by name — a bare
specifier like `https://cdn.jsdelivr.net/npm/vpv-panchangam` will not resolve,
and the Swiss Ephemeris WebAssembly is a sidecar file that must sit next to the
module loading it.

That is what `dist/browser/` is for: a pre-bundled ESM module with
`swisseph.wasm` beside it, both served straight from npm.

### npm (Node.js and bundlers)

```bash
npm install vpv-panchangam
```

```js
import { computeDetailedPanchang } from 'vpv-panchangam';
```

### CDN — no build step

```js
import { computeDetailedPanchang } from 'https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs';
```

On `unpkg` instead:

```js
import { computeDetailedPanchang } from 'https://unpkg.com/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs';
```

### CDN — plain script tag

Paste into your HTML; it exposes `window.vpv`.

```html
<script type="module">
  import * as vpv from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";

  window.vpv = vpv;
</script>
```

```js
const p = await window.vpv.computeDetailedPanchang('2026-09-28', 23.1765, 75.7885, 'Asia/Kolkata', 'en');
```

> Pin the exact version. The URL hardcodes the `dist/browser/` path, so a range
> like `@0.4` or `@latest` will break the moment a release moves that file.

Try it all live at <https://reflexdemon.github.io/vpv-panchangam/>.
````

- [ ] **Step 3: Fix the header comment in `src/index.ts`**

Line 2 reads ` * vedic-panchanga — public API barrel export`. Change it to:

```ts
 * vpv-panchangam — public API barrel export
```

This propagates into the emitted `dist/index.js` and `dist/index.d.ts` comments that users see in editor tooltips.

- [ ] **Step 4: Document the demo additions in `example/README.md`**

Replace the two lines at `example/README.md:22-23`:

```
Every panel includes the exact TypeScript snippet (with the current inputs) so
each feature can be copied back into real code.
```

with:

```
Every panel includes the exact snippet (with the current inputs) so each
feature can be copied back into real code. Each snippet is self-contained —
it carries its own import line.

## Snippet language toggle

The **TypeScript / JavaScript** control in the header flips every snippet on
the page at once. The choice is remembered in `localStorage`.

- **TypeScript** imports from the package and annotates the declaration with the
  real exported type (`PanchangResponse`, `ChartResponse`, `Hora`, `Tyajyam`,
  `AshtakavargaResult`, `KalsarpaResult`, `FriendshipTables`, `AspectResult`).
- **JavaScript** imports from the pinned jsDelivr browser bundle and carries no
  annotations.

Switching does not re-run any calculation — the toggle rewrites the text inside
the existing code blocks, so results stay put.

## Invocation band

The band under the title shows how to load the package: **npm** (Node and
bundlers), **jsDelivr** and **unpkg** (no build step), and a paste-ready
`<script type="module">` tag. URLs are pinned to the exact build and generated
from `package.json` at build time, so they cannot go stale.
```

- [ ] **Step 5: Verify the build, suite, and lint are all still green**

Run: `npm run build && npm run build:browser && npm test && npm run lint`
Expected: tsc emits `dist/`; esbuild emits `dist/browser/`; all Vitest suites pass; ESLint clean.

- [ ] **Step 6: Verify no stale package name survives anywhere**

Run: `rg -n "vedic-panchanga" --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!docs/superpowers' .`
Expected: no matches. (`docs/superpowers/` is excluded — historical planning artifacts reference the old name deliberately.)

- [ ] **Step 7: Commit**

```bash
git add README.md example/README.md src/index.ts
git commit -m "docs: package-name fix and Browser/CDN loading guide

README.md still told users to install vedic-panchanga, the v0.2.0 name
(vpv-panchangam@0.4.0 is published). Corrected in all 6 places and
replaced the vague 'Browser usage' prose with the four real load
methods, including why the CDN URL carries a /dist/browser/ path."
```

---

## Post-Implementation Verification

Run through this list once, top to bottom, before declaring the work done:

```bash
npm run verify:browser     # bundle loads and computes
npm run example:build      # demo bundle builds
npm test                   # full suite, including the new composer tests
npm run lint               # ESLint clean
npm run build              # tsc still emits dist/
```

Then in the browser at <http://localhost:8080>:

- [ ] Invocation band shows all four load methods; each URL is pinned to `0.4.0`
- [ ] Copy button works and reverts after ~1.2s
- [ ] Language toggle swaps all 29 snippets with no recompute and no scroll jump
- [ ] Choice survives a reload
- [ ] JavaScript snippets are syntax-highlighted
- [ ] Both demo tabs render correctly in both languages
- [ ] `git status` is clean and `dist/`, `example/dist/` are not staged
