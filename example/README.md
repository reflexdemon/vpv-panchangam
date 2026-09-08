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

Every panel includes the exact TypeScript snippet (with the current inputs) so
each feature can be copied back into real code.

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