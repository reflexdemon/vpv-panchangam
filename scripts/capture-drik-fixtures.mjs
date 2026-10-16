// scripts/capture-drik-fixtures.mjs  (capture tooling — never run by `npm test`)
//
// Fetches drikpanchang.com day-panchang pages for every location x date in
// test/fixtures/drik/manifest.json, parses each page into a DrikReference
// object, writes one JSON per page to test/fixtures/drik/pages/, and stamps
// manifest.json `capturedAt`.
//
// Polite by design: browser User-Agent (plain curl gets HTTP 403), >=1.5 s
// between requests, and a hard per-run request cap. Run with:
//   node scripts/capture-drik-fixtures.mjs [--force]
//
// `--force` re-fetches pages whose JSON already exists; by default existing
// files are skipped (resume-safe).
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://www.drikpanchang.com/panchang/day-panchang.html";
const OUT = resolve("test/fixtures/drik/pages");
const MANIFEST = resolve("test/fixtures/drik/manifest.json");
const POLITENESS_MS = 2000;
const MAX_REQUESTS_PER_RUN = 40;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function stripTags(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

// The page marks values with an info icon (U+24D8 CIRCLED LATIN SMALL LETTER
// D); it carries no data, so drop it from parsed values.
function cleanValue(text) {
  return stripTags(text).replace(/\u24D8/g, "").replace(/\s+/g, " ").trim();
}

// Extract top-level <div class="...">…</div> blocks for one class name,
// honouring nested divs. Returns the inner HTML of each block.
function extractDivBlocks(html, cls) {
  const blocks = [];
  const openRe = new RegExp(`<div[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, "g");
  let m;
  while ((m = openRe.exec(html))) {
    let depth = 1;
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = m.index + m[0].length;
    let t;
    let end = -1;
    while ((t = tagRe.exec(html))) {
      depth += t[0].startsWith("</") ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    if (end === -1) break;
    blocks.push(html.slice(m.index + m[0].length, end));
    openRe.lastIndex = tagRe.lastIndex;
  }
  return blocks;
}

function isKeyCell(openTag) {
  return /\bdpTableKey\b/.test(openTag);
}

// Ordered [key, value] cell pairs for one dpTableRow block. A row holds two
// side-by-side pairs; an empty key means "continuation of the previous label
// in the same column" (e.g. next Tithi / next Karana).
function rowPairs(rowHtml) {
  const cellRe = /<div[^>]*class="([^"]*)"[^>]*>/gi;
  const cells = [];
  let m;
  while ((m = cellRe.exec(rowHtml))) {
    const innerStart = m.index + m[0].length;
    let depth = 1;
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = innerStart;
    let t;
    let end = -1;
    while ((t = tagRe.exec(rowHtml))) {
      depth += t[0].startsWith("</") ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    if (end === -1) break;
    cells.push({ key: isKeyCell(m[1]), html: rowHtml.slice(innerStart, end) });
    cellRe.lastIndex = tagRe.lastIndex;
  }
  const pairs = [];
  for (let i = 0; i + 1 < cells.length; i += 2) {
    if (!cells[i].key) continue;
    pairs.push({
      label: cleanValue(cells[i].html),
      value: cleanValue(cells[i + 1].html),
    });
  }
  return pairs;
}

function toLocalISO(timeText, pageDate) {
  const m = timeText.match(/(\d{1,2}):(\d{2})\s*([AP])\.?\s*M/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10) % 12;
  if (/p/i.test(m[3])) hh += 12;
  const mm = m[2];
  let date = pageDate;
  const roll = timeText.match(/,\s*([A-Za-z]{3})\s*(\d{1,2})\b/);
  if (roll) {
    let year = parseInt(pageDate.slice(0, 4), 10);
    const pageMonth = parseInt(pageDate.slice(5, 7), 10);
    const month = MONTHS[roll[1].toLowerCase()];
    if (month === undefined) return null;
    const day = String(parseInt(roll[2], 10)).padStart(2, "0");
    if (pageMonth === 12 && month === 1) year += 1;
    if (pageMonth === 1 && month === 12) year -= 1;
    date = `${year}-${String(month).padStart(2, "0")}-${day}`;
  }
  return `${date}T${String(hh).padStart(2, "0")}:${mm}:00`;
}

// "Shashthi upto 05:54 AM , Oct 17" -> { name, endsAt }; "Saptami" -> { name, endsAt: null }
function parseUpto(value, pageDate) {
  const m = (value || "").match(/^(.*?)\s+upto\s+(.+)$/i);
  if (!m) return { name: value || null, endsAt: null };
  return { name: m[1].trim() || null, endsAt: toLocalISO(m[2], pageDate) };
}

function parseSamvat(value) {
  const m = (value || "").match(/^(\d+)\s*(.*)$/);
  return { num: m ? parseInt(m[1], 10) : NaN, name: (m && m[2].trim()) || "" };
}

// Split a window cell into its raw "A to B" ranges, keeping rollover dates
// (", Oct 17") verbatim. Falls back to the whole value (e.g. "Whole Day"
// style entries) when no range pattern matches.
function splitWindows(values) {
  const joined = values.filter(Boolean).join(" ");
  const re =
    /(\d{1,2}:\d{2}\s*[AP]\s*M(?:\s*,\s*[A-Za-z]{3}\s*\d{1,2})?)\s*to\s*(\d{1,2}:\d{2}\s*[AP]\s*M(?:\s*,\s*[A-Za-z]{3}\s*\d{1,2})?)/gi;
  const out = [];
  let m;
  while ((m = re.exec(joined))) out.push(`${m[1].trim()} to ${m[2].trim()}`);
  if (out.length === 0 && joined.trim()) out.push(joined.trim());
  return out;
}

export function parseDrikPage(html, { timezone, date, slug = "", locationName = "", name = null } = {}) {
  if (!timezone || !date) throw new Error("parseDrikPage requires { timezone, date }");
  const title = stripTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  const expected = name ?? locationName;
  if (expected && !title.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`title check failed: ${JSON.stringify(title)} does not contain ${JSON.stringify(expected)}`);
  }

  // Label -> all raw values in document order. Continuation cells (empty key)
  // attach to the previous label in the same row column.
  const valuesByLabel = new Map();
  const lastByCol = [];
  for (const rowHtml of extractDivBlocks(html, "dpTableRow")) {
    const pairs = rowPairs(rowHtml);
    pairs.forEach((p, col) => {
      const label = p.label || lastByCol[col];
      if (!label) return;
      lastByCol[col] = label;
      if (!valuesByLabel.has(label)) valuesByLabel.set(label, []);
      if (p.value) valuesByLabel.get(label).push(p.value);
    });
  }
  const first = (label) => valuesByLabel.get(label)?.[0] ?? null;
  const all = (label) => valuesByLabel.get(label) ?? [];

  const tithi = parseUpto(first("Tithi"), date);
  const nakshatra = parseUpto(first("Nakshatra"), date);
  const yoga = parseUpto(first("Yoga"), date);
  const karana = parseUpto(first("Karana"), date);
  const nextName = (label) => {
    const rest = all(label).slice(1);
    if (rest.length === 0) return null;
    return parseUpto(rest[0], date).name;
  };

  const vikram = parseSamvat(first("Vikram Samvat"));
  const shaka = parseSamvat(first("Shaka Samvat"));
  const gujarati = parseSamvat(first("Gujarati Samvat"));
  const kali = parseInt((first("Kaliyuga") || "").match(/\d+/)?.[0] ?? "NaN", 10);

  const single = (label) => first(label) || null;

  const raw = {};
  for (const [label, values] of valuesByLabel) raw[label] = values[values.length - 1] ?? "";

  return {
    slug,
    date,
    timezone,
    locationName,
    sunrise: first("Sunrise") ? toLocalISO(first("Sunrise"), date) : null,
    sunset: first("Sunset") ? toLocalISO(first("Sunset"), date) : null,
    moonrise: first("Moonrise") ? toLocalISO(first("Moonrise"), date) : null,
    moonset: first("Moonset") ? toLocalISO(first("Moonset"), date) : null,
    tithi: { name: tithi.name, endsAt: tithi.endsAt, next: nextName("Tithi") },
    nakshatra: { name: nakshatra.name, endsAt: nakshatra.endsAt, next: nextName("Nakshatra") },
    yoga: { name: yoga.name, endsAt: yoga.endsAt, next: nextName("Yoga") },
    karana: { name: karana.name, endsAt: karana.endsAt, next: nextName("Karana") },
    paksha: first("Paksha"),
    vara: first("Weekday"),
    vikramSamvat: vikram.num,
    vikramName: vikram.name,
    shakaSamvat: shaka.num,
    shakaName: shaka.name,
    gujaratiSamvat: gujarati.num,
    chandramasaPurnimanta: (all("Chandramasa")[0] || "").replace(/\s*-\s*Purnimanta\s*$/i, "").trim() || null,
    chandramasaAmanta:
      (all("Chandramasa")[1] || "").replace(/\s*-\s*Amanta\s*$/i, "").trim() || null,
    kaliyugaYears: kali,
    windows: {
      brahmaMuhurta: single("Brahma Muhurta"),
      pratahSandhya: single("Pratah Sandhya"),
      abhijit: single("Abhijit"),
      vijayaMuhurta: single("Vijaya Muhurta"),
      godhuli: single("Godhuli Muhurta"),
      sayahnaSandhya: single("Sayahna Sandhya"),
      amritKalam: splitWindows(all("Amrit Kalam")),
      nishita: single("Nishita Muhurta"),
      rahuKalam: single("Rahu Kalam"),
      yamaganda: single("Yamaganda"),
      gulikai: single("Gulikai Kalam"),
      varjyam: splitWindows(all("Varjyam")),
      durMuhurtam: splitWindows(all("Dur Muhurtam")),
    },
    raw,
  };
}

function ddmmyyyy(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function main() {
  const force = process.argv.includes("--force");
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const { locations, dates } = manifest;
  const total = locations.length * dates.length;
  if (total > MAX_REQUESTS_PER_RUN) {
    throw new Error(`matrix needs ${total} requests, over hard cap ${MAX_REQUESTS_PER_RUN}; reduce scope first`);
  }
  await mkdir(OUT, { recursive: true });
  let requests = 0;
  let fetched = 0;
  let first = true;
  for (const loc of locations) {
    for (const date of dates) {
      const file = resolve(OUT, `${loc.slug}-${date}.json`);
      if (!force) {
        try {
          await readFile(file, "utf8");
          console.log(`skip (exists) ${loc.slug} ${date}`);
          continue;
        } catch {
          // not captured yet — fetch below
        }
      }
      if (requests >= MAX_REQUESTS_PER_RUN) {
        throw new Error(`hit hard cap of ${MAX_REQUESTS_PER_RUN} requests; re-run to resume`);
      }
      if (!first) await sleep(POLITENESS_MS);
      first = false;
      const url = `${BASE}?geoname-id=${loc.geonameId}&date=${ddmmyyyy(date)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      });
      requests += 1;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const pageHtml = await res.text();
      const ref = parseDrikPage(pageHtml, {
        timezone: loc.timezone,
        date,
        slug: loc.slug,
        locationName: loc.name,
        name: loc.name,
      });
      await writeFile(file, JSON.stringify(ref, null, 2) + "\n");
      fetched += 1;
      console.log(`ok ${loc.slug} ${date} (${requests} requests)`);
    }
  }
  manifest.capturedAt = new Date().toISOString();
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`done: fetched=${fetched} requests=${requests} capturedAt=${manifest.capturedAt}`);
}

const invokedAsMain =
  Boolean(process.argv[1]) &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedAsMain) {
  await main();
}
