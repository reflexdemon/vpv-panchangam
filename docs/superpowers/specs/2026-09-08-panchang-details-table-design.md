# Panchang for date — details table — Design

**Date:** 2026-09-08
**Status:** Approved (summary table + expandable sequences)

## Goal

Add a new **"Panchang for date"** section in the panchang view that shows a clean summary table of all five core response fields, plus four expandable sequence sub-tables — replacing the four standalone "… sequence (next 5)" sections.

## Data shape (`p.panchang`)

- `tithi`, `nakshatra`, `yoga`, `karana` — each `PanchangItem | null` with `{ index, name, starts_at?, ends_at }`.
- `tithi_sequence`, `nakshatra_sequence`, `yoga_sequence`, `karana_sequence` — `PanchangItem[]` (typically 4–5 entries for the day).
- `paksha` — string ("Shukla Paksha" | "Krishna Paksha").

## Design

Insert a new section **"Panchang for date"** immediately after the existing "Panchang (now)" section (`:697`), then remove the four standalone `forEach` sequence sections (`:699-718`).

### Section content (single `div` box)

1. **2-column summary table** — `table(["Field", "Value"], rows)`:
   - **Tithi** — `item.name + " · " + fmtTzAuto(starts_at) + " → " + fmtTzAuto(ends_at)` (or "—" if null)
   - **Nakshatra** — same format
   - **Yoga** — same format
   - **Karana** — same format
   - **Paksha** — `p.panchang.paksha` (string)

2. **Four `<details>` blocks** (native expand/collapse, same pattern as `jsonToggle`):
   - `<summary>` text: e.g. `"Tithi sequence (next 5)"`.
   - Inside: `table(["#", "Name", "Starts", "Ends"], seq)` where `seq = p.panchang[kind + "_sequence"].slice(0, 5)`, rows formatted as `[item.index, item.name, fmtTzAuto(item.starts_at), fmtTzAuto(item.ends_at)]` — identical to today's existing sequence sections.
   - One per kind: tithi, nakshatra, yoga, karana.

Section call:
```
section(view, "Panchang for date", box,
  panelSnippet(panchangCall(), "p.panchang.tithi, p.panchang.nakshatra, p.panchang.yoga, p.panchang.karana, p.panchang.paksha"),
  p.panchang);
```

### Removed

The four standalone sequence sections (`:699-718`) — subsumed into the new section's `<details>` blocks.

### Unchanged

- Section 1 (header), 2 (Sun & Moon), 3 (Vara & Paksha), 4 (Panchang now), 5+ (Rashi & Nakshatra, etc.), all later sections.
- No changes to `timelineBar`, `clockDial`, CSS, or `/tmp/demo-check.js`.

## Verification

- `node --check example/app.js`, `npm run example:build`, vitest 464, tsc clean.
- Local probe suite (glance, gowri, json panchang 1, hora, nalla, alljson panchang, summary) all PASS, errors `[]`.
- Deploy + live summary PASS (jsonOk, clocks, handMoved, tzOk, errors `[]`).