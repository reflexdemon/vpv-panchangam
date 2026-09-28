# Example Language Toggle + CDN Invocation — Design

**Date:** 2026-09-28
**Status:** Approved
**Scope:** `example/` (demo page), package publish pipeline, root `README.md`

## Problem

The interactive demo at `example/` renders ~25 code snippets showing how to call
each feature. Three gaps:

1. **Snippets are TypeScript-only.** They are generated inline in `example/app.js`
   as string literals tagged `language-ts`. A JavaScript visitor has nothing to
   copy, and there is no visible import line, so the snippets are not
   self-contained — they reference `computeDetailedPanchang` as if it were global.

2. **No way to get the package.** The page never tells you how to install or load
   `vpv-panchangam`. A visitor sees a demo and no next step.

3. **The npm package cannot be loaded from a CDN today.** `tsconfig.json` emits
   CommonJS, and `src/ephemeris/browser.ts` lazily `import()`s the ESM-only
   `@swisseph/browser` package. A raw `<script>` tag pointed at npm has no
   resolvable bare specifier, and the Swiss Ephemeris WASM is a sidecar that
   must sit next to the module that loads it.

## Goals

- One page-wide **TypeScript / JavaScript** toggle that flips every snippet.
- A **top-of-page invocation band** with npm and CDN load instructions that
  actually work.
- A **real browser ESM build** published to npm, so the CDN URLs are genuine
  rather than aspirational.
- Copy-pasteable snippets: each block carries its own import line.

## Non-goals

- No change to library behaviour, API surface, or calculation logic.
- No per-block language override.
- No new `module` / `exports` / `browser` fields in `package.json`.
- No JSX/framework component for the demo page — it stays vanilla.

## Key finding that shapes the design

`@swisseph/browser` resolves its WASM as
`new URL("./swisseph.wasm", import.meta.url)`. That means the `.wasm` must be a
**sibling of the JS module that loads it**. Any CDN solution has to preserve that
adjacency, which rules out pointing users at a bare package name or at a
transpiling proxy like esm.sh (whose shimmed module resolves the WASM through a
path we do not control).

Verified during exploration:

- `https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/+esm` returns 200, but
  statically imports `node:fs/promises`, `node:process`, `node:url` and does not
  guarantee WASM resolution. Not used.
- `https://cdn.jsdelivr.net/npm/@swisseph/browser@1.3.1/dist/swisseph.wasm`
  returns 200 (411,879 bytes), confirming the adjacency rule is satisfiable from
  a CDN.

## Design

### 1. Browser ESM build

New npm script:

```json
"build:browser": "esbuild src/index.ts --bundle --format=esm --platform=browser --outfile=dist/browser/vpv-panchangam.mjs && node scripts/copy-wasm.cjs dist/browser"
```

Published outputs, both under the existing `files: ["dist/"]` glob:

- `dist/browser/vpv-panchangam.mjs` — ESM, library plus `@swisseph/browser` inlined
- `dist/browser/swisseph.wasm` — the WASM sidecar

`prepublishOnly` becomes `npm run build && npm run build:browser`.

**WASM copying.** `scripts/copy-demo-wasm.cjs` generalises to
`scripts/copy-wasm.cjs <outdir>`, so the demo build and the package build share
one WASM-copying code path. The existing `example:build` script is updated to
call the new path with `example/dist`.

**Deliberately untouched:** `main`, `module`, `exports`, `browser` in
`package.json`. The browser bundle is a CDN-only artifact. Adding a `module` field
would make bundlers prefer a pre-bundled blob over the tree-shakeable CJS entry and
would break the normal Node path.

**Duplication note.** `example:build` and `build:browser` both bundle the same
source and differ only in the wrapper (`example/entry.ts` sets the `vpv` global;
the package build exports ESM). They are kept as separate entry points rather
than unified, because the demo is deployed from `example/` to GitHub Pages and
must not depend on `dist/` existing.

### 2. Snippet layer

New file `example/snippets.js` owns all code shown to the user. `app.js` keeps
ownership of the DOM and the data.

Each `section()` call replaces its current string snippet with a spec:

```js
section(view, "Panchang overview", head, {
  imports: ["computeDetailedPanchang"],
  type: "PanchangResponse",
  varName: "p",
  body: panchangCall(),      // the bare call, no `const` declaration
});
```

`snippetFor(spec, lang)` owns the declaration as well as the header, so the
language toggle never has to edit the body. It emits the import line, then the
declaration, then the body:

```ts
// lang === "ts"
import { computeDetailedPanchang, type PanchangResponse } from "vpv-panchangam";

const p: PanchangResponse = await computeDetailedPanchang(/* … */);

// lang === "js"
import { computeDetailedPanchang } from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";

const p = await computeDetailedPanchang(/* … */);
```

The annotation is only ever applied to the `const` line that `snippetFor` itself
generates, never to text inside `body`. No type-stripping or rewriting of the
body happens in either direction.

`panchangCall()` (`example/app.js:584`) and `chartCall()` (`example/app.js:600`)
keep interpolating the live inputs, but each drops its `const X = ` prefix — the
declaration now belongs to the spec. `varName` is `"p"` for panchang-derived
snippets and `"c"` for chart-derived ones, which is what the field-access tails
in `panelSnippet()` (`example/app.js:620`) already assume.

**Type annotations are selective.** Only blocks where a named return type teaches
something get a `type`: `PanchangResponse`, `ChartResponse`, `BirthInfo`,
`TimeWindow`, `Hora`, `Tyajyam`, `KalsarpaResult`, `AshtakavargaResult`,
`FriendshipTables`, `AspectResult`. The ~20 field-access snippets omit it, so
their two tabs differ only in the import line. All named types are already
exported from `src/index.ts:13-49`, so typed snippets are copy-pasteable today
with no API change.

**Version has one source of truth.** `example/entry.ts` adds `version` to the
`vpv` global by importing the manifest — esbuild inlines JSON imports natively,
so this needs no `--define` flag and no shell quoting in the npm script:

```ts
import pkg from "../package.json";

const vpv: Record<string, unknown> = { /* … */, version: pkg.version };
```

`snippets.js` reads `window.vpv.version` at call time with a hardcoded `0.4.0`
fallback so it can never throw. Bumping the version updates every URL in the demo
with no edits to example code.

### 3. Language toggle

`state.lang` joins the existing `state` object (`example/app.js:15-23`), default
`"ts"`, persisted to `localStorage` key `vpv-demo-lang` behind a `try/catch`
(it throws in some privacy modes), read once at startup.

Placement: a segmented `TypeScript | JavaScript` control in `header.top`,
right-aligned opposite the title, reusing the existing `.tabs button` styling.

**Toggling must not recompute.** Every compute is a WASM run, so a language flip
must not trigger one. `section()` pushes each rendered code element onto a
module-level registry:

```js
var snippetRegistry = [];   // { code: <code> element, spec }
```

Toggling iterates the registry, rewrites `textContent` from
`snippetFor(spec, state.lang)`, swaps the class between `language-ts` and
`language-javascript`, and re-runs `hljs.highlightElement`. No WASM call, no chart
teardown, no scroll jump.

`clear()` — already called on every recompute and tab switch — also resets the
registry, so detached nodes do not accumulate across re-renders.

`index.html` additionally loads `languages/javascript.min.js`; highlight.js treats
TypeScript and JavaScript as separate grammars, so the JS tab would otherwise
render unstyled.

The toggle re-renders nothing else and is fully independent of the tab and Apply
flows.

### 4. Top invocation band

A band between `header.top` and the `.controls` form, so it is the first thing
under the title and reads as "here is how to get this" before any output.

Four tabs, one code block, one copy button:

| Tab | Shows |
|---|---|
| npm | `npm install vpv-panchangam` + `import { computeDetailedPanchang } from "vpv-panchangam";` |
| jsDelivr | ESM import from `https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs` |
| unpkg | same line on `unpkg.com` |
| `<script type="module">` | the literal tag to paste into a `<head>`, including the inline `import` and `window.vpv = vpv;` |

One tab visible at a time keeps the band roughly six lines tall instead of thirty,
and reuses the same tab-strip visual language as the language toggle and the
Panchang/Kundali tabs. The alternative — a `<details>` with all four stacked — is
simpler markup but permanently pushes the demo down by half a screen.

**Copy button:** `navigator.clipboard.writeText` behind a `try/catch`, swapping
to "Copied" for ~1.2s. On failure it falls back to selecting the text, since
clipboard access is not guaranteed on every origin.

**Version is pinned to the exact build** (`@0.4.0`, not `@0.4` or `@latest`).
The URL hardcodes a `/dist/browser/` path, so a floating range would break the
moment a release moves that file.

**Deliberately independent of the language toggle.** Switching to JavaScript does
not re-order or emphasise the `<script>` tab; that would couple two unrelated
controls for a small gain.

### 5. README

**Fix the stale package name.** Seven occurrences of `vedic-panchanga` (the v0.2.0
name) in `README.md`: the H1 title, `npm install`, and five `import` lines. All
become `vpv-panchangam`. This lands in the same change as the CDN block —
otherwise the banner shows one package name and the README tells the reader to
install another.

**Replace the vague "Browser usage" prose** (`README.md:39-44`, three sentences
ending in "no extra configuration needed") with a **Browser / CDN** section
carrying the same four load methods as the demo's top band, plus one paragraph
explaining *why* the URL has a `/dist/browser/` path: the npm entry point is
CommonJS, so a CDN cannot load it directly, and `dist/browser/` is the ESM bundle
with the WASM sidecar beside it. Without that sentence someone will "simplify" the
URL back to a bare package name.

Also cross-link the live demo and note the version pinning, so the README and the
demo's top band do not drift.

**Drive-by:** `src/index.ts:2` — the file header comment also says
`vedic-panchanga`. One word; it propagates into the emitted `dist/index.js` and
`dist/index.d.ts` comments that users see in editor tooltips.

## Files touched

| File | Change |
|---|---|
| `package.json` | add `build:browser`; extend `prepublishOnly`; update `example:build` path |
| `scripts/copy-wasm.cjs` | new — generalised from `copy-demo-wasm.cjs` |
| `scripts/copy-demo-wasm.cjs` | deleted, replaced by the above |
| `src/index.ts` | header comment name fix (line 2) |
| `example/entry.ts` | expose `version` (from an imported `package.json`) on the `vpv` global |
| `example/snippets.js` | new — snippet composition + invocation band copy |
| `example/app.js` | snippet specs, language state, registry, toggle wiring |
| `example/index.html` | invocation band markup, language toggle, `javascript.min.js` |
| `README.md` | package name fix + Browser/CDN section |
| `example/README.md` | document the toggle and the invocation band |

## Error handling

- `localStorage` read/write wrapped in `try/catch`; falls back to in-memory state.
- `navigator.clipboard` wrapped in `try/catch`; falls back to text selection.
- `window.vpv.version` read defensively with a `0.4.0` fallback, so a stale or
  missing demo bundle cannot break snippet rendering.
- Snippet composition is pure string building — no failure path beyond the
  fallbacks above.

## Testing

The existing `vitest` suite is unaffected: no `src/` runtime behaviour changes
(the only `src/` edit is a comment). ESLint runs over `src/`; Prettier over
`src/` and `test/`.

Verification is browser-side and is explicit work, not assumption:

1. `npm run build:browser` emits both `dist/browser/` files.
2. A plain HTML page loading the **published CDN URL** produces a correct panchang
   and a correct chart.
3. The WASM sidecar resolves over the CDN. Record whether Emscripten falls back
   from `instantiateStreaming` — jsDelivr may serve `.wasm` as
   `application/octet-stream`, which triggers an `arrayBuffer` fallback that works
   but logs a console warning. This is a note for the README, not a defect.
4. Toggle TypeScript → JavaScript on the demo: every snippet swaps, no recompute
   occurs, no scroll jump, both grammars highlight.
5. Reload: the language choice persists.
6. All four invocation tabs render and copy.
7. `npm test` and `npm run lint` still pass.

## Risks

| Risk | Mitigation |
|---|---|
| `.wasm` served with a non-WASM content-type from a CDN | Emscripten falls back to `arrayBuffer`; verified in step 3 and documented |
| Two esbuild bundles drift apart | Both build from `src/index.ts` in `prepublishOnly` / `example:build`; verified in steps 1–2 |
| Snippet URLs show a stale version | Version injected at build time from `package.json`, with a literal fallback |
| 25 snippet specs are a large diff in a 1,892-line file | Snippet composition is isolated in `snippets.js`; `app.js` edits are mechanical |
