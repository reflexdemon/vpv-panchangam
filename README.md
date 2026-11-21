# Interactive browser demo

Live showcase of every `vpv-panchangam` feature, driven from the source build
(via `esbuild`, exposed as the global `vpv`). All calculations run locally in
the browser using the Swiss Ephemeris WebAssembly build — nothing is sent to a
server.

The page has two tabs:

- **Panchang** — sunrise/sunset, vara, tithi/nakshatra/yoga/karana
  (current + sequences), rashi & nakshatra, all calendars (Lunar / Kali /
  National Civil / Tamil), ritu & ayana, auspicious & inauspicious windows,
  Udaya Lagna, Chandra/Tara balam, Shool/Vasa, Ganda Mula & Ravi Yoga,
  Gowri Panchangam, Hora, Nalla Neram, Tyajyam, and a combined
  "day-at-a-glance" muhurta timeline.
- **Kundali** — birth details, full planet table (retrograde, combust,
  exaltation, digbala, …), D1 in a South-Indian fixed-sign grid *and* an
  ECharts sidereal wheel, all bar charts for the divisional vargas (D1 → D60),
  Ashtakavarga, Vimshottari dasha timeline, Jaimini karakas, Kalsarpa,
  friendship tables and the Drishti aspect edges.

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
`<script type="module">` tag.

- **npm** — the pinned install command: `npm install vpv-panchangam@<version>`,
  followed by the bare-specifier `import { … } from "vpv-panchangam"` that a
  plain `npm install` produces.
- **jsDelivr** / **unpkg** — no-build-step ESM imports pinned to the exact
  browser bundle (`…/dist/browser/vpv-panchangam.mjs`).
- **`<script type="module">`** — the same pinned URL inside a module tag.

The version is injected from `package.json` at build time, so the snippets the
band renders (npm pinned, CDN URLs, script tag) always carry the current version
— never a hardcoded one, and never the stale fallback. The referenced build must
actually be published at that version for the URLs to resolve, so the exact
version must be bumped here by hand at release time.

## Run locally

```sh
npm install
npm run demo            # build example/dist + serve http://localhost:8080
npm run demo:watch      # rebuild on source change (hot) + serve
```

Open <http://localhost:8080>. The demo must be served over HTTP (the WASM
ephemeris fetches `swisseph.wasm`), not opened as a `file://` document.

## Auto-deploy to GitHub Pages

The workflow `.github/workflows/deploy-demo.yml` publishes `example/` to the
`gh-pages` branch on every push to `main`.

One-time setup (required for it to work):

1. Repository → **Settings → Pages**.
2. Under **Build and deployment / Source**, choose **Deploy from a branch**.
3. Branch: `gh-pages`, folder: `/ (root)` → **Save**.
4. The next push to `main` (or a manual *Actions → Deploy demo → Run workflow*)
   publishes the demo to `https://<owner>.github.io/<repo>/`.

Uses `peaceiris/actions-gh-pages@v4` with the built-in `GITHUB_TOKEN`, so no
deploy keys are needed.