import { describe, it, expect } from 'vitest';
import {
  computeMahadashas, computeAntardashas, computePratyantars, enrichWithAntardashas,
} from '../src/calculations/dasha';
import { DASHA_SEQUENCE, DASHA_YEARS, DASHA_TOTAL_YEARS } from '../src/constants/planets';

const DAYS_PER_YEAR = 365.25;
const BIRTH = new Date('1990-03-15T03:00:00Z');

function sumYears(items: Array<{ years: number }>): number {
  return items.reduce((s, d) => s + d.years, 0);
}

// ─── computeMahadashas ────────────────────────────────────────────────────────

describe('computeMahadashas', () => {
  it('returns exactly 9 mahadashas', () => {
    const dashas = computeMahadashas(0, BIRTH);
    expect(dashas.length).toBe(9);
  });

  it('total years of 9 dashas = 120', () => {
    const dashas = computeMahadashas(0, BIRTH);
    expect(sumYears(dashas)).toBeCloseTo(120, 2);
  });

  it('first dasha starts at birth date', () => {
    const dashas = computeMahadashas(0, BIRTH);
    expect(dashas[0].start).toBe(BIRTH.toISOString().replace('.000Z', 'Z'));
  });

  it('each dasha end equals next dasha start', () => {
    const dashas = computeMahadashas(0, BIRTH);
    for (let i = 0; i < 8; i++) {
      expect(dashas[i].end).toBe(dashas[i + 1].start);
    }
  });

  it('Moon longitude = 0° (Ashwini, Ketu lord): first lord is Ketu', () => {
    const dashas = computeMahadashas(0, BIRTH);
    expect(dashas[0].lord).toBe('Ketu');
  });

  it('balance years for first dasha ≤ full dasha years', () => {
    const dashas = computeMahadashas(0, BIRTH);
    const firstLord = dashas[0].lord;
    expect(dashas[0].years).toBeLessThanOrEqual(DASHA_YEARS[firstLord]!);
    expect(dashas[0].years).toBeGreaterThan(0);
  });

  it('lords follow DASHA_SEQUENCE from birth nakshatra lord', () => {
    // Moon at 0° → nakshatra 0 (Ashwini) → lord index 0 (Ketu)
    const dashas = computeMahadashas(0, BIRTH);
    const startIdx = DASHA_SEQUENCE.indexOf(dashas[0].lord as any);
    expect(startIdx).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 9; i++) {
      const expectedLord = DASHA_SEQUENCE[(startIdx + i) % 9];
      expect(dashas[i].lord).toBe(expectedLord);
    }
  });

  it('dasha years match DASHA_YEARS except the balance year', () => {
    const dashas = computeMahadashas(0, BIRTH);
    // From 2nd dasha onward, full years
    for (let i = 1; i < 9; i++) {
      expect(dashas[i].years).toBeCloseTo(DASHA_YEARS[dashas[i].lord]!, 4);
    }
  });

  it('works for Moon in mid-nakshatra (partial balance)', () => {
    // Moon at 6.666° = mid-point of Ashwini (NAK_SPAN = 13.333)
    // Balance = 7 * (1 - 0.5) = 3.5 years
    const moonLon = 360 / 27 / 2; // exactly half of Ashwini
    const dashas = computeMahadashas(moonLon, BIRTH);
    expect(dashas[0].lord).toBe('Ketu');
    expect(dashas[0].years).toBeCloseTo(3.5, 1);
  });

  it('handles Moon at start of Venus nakshatra', () => {
    // Bharani (nakshatra 1) is lorded by Venus (index 1 in NAKSHATRA_LORD_CYCLE)
    const moonLon = 360 / 27 + 0.01; // just past Ashwini into Bharani
    const dashas = computeMahadashas(moonLon, BIRTH);
    expect(dashas[0].lord).toBe('Venus');
  });

  it('all lords are valid planet names', () => {
    const dashas = computeMahadashas(45, BIRTH);
    for (const d of dashas) {
      expect(DASHA_SEQUENCE).toContain(d.lord as any);
    }
  });
});

// ─── computeAntardashas ───────────────────────────────────────────────────────

describe('computeAntardashas', () => {
  const moonDashas = computeMahadashas(0, BIRTH);
  const md = moonDashas[0]!;

  it('returns exactly 9 antardashas', () => {
    const ads = computeAntardashas(md);
    expect(ads.length).toBe(9);
  });

  it('sum of antardasha years equals mahadasha years', () => {
    const ads = computeAntardashas(md);
    expect(sumYears(ads)).toBeCloseTo(md.years, 4);
  });

  it('antardashas are contiguous', () => {
    const ads = computeAntardashas(md);
    for (let i = 0; i < 8; i++) {
      expect(ads[i].end).toBe(ads[i + 1].start);
    }
  });

  it('first antardasha starts at mahadasha start', () => {
    const ads = computeAntardashas(md);
    expect(ads[0].start).toBe(md.start);
  });

  it('last antardasha ends at mahadasha end', () => {
    const ads = computeAntardashas(md);
    expect(ads[ads.length - 1].end).toBe(md.end);
  });

  it('antardasha years proportional to DASHA_YEARS', () => {
    const ads = computeAntardashas(moonDashas[1]!); // Venus MD
    // Venus AD in Venus MD = 20 * 20 / 120 ≈ 3.333 years
    const venusAd = ads.find(a => a.lord === 'Venus');
    expect(venusAd).toBeDefined();
    expect(venusAd!.years).toBeCloseTo(20 * 20 / 120, 2);
  });

  it('antardasha lords are valid', () => {
    const ads = computeAntardashas(md);
    for (const ad of ads) {
      expect(DASHA_SEQUENCE).toContain(ad.lord as any);
    }
  });
});

// ─── computePratyantars ───────────────────────────────────────────────────────

describe('computePratyantars', () => {
  const moonDashas = computeMahadashas(0, BIRTH);
  const md = moonDashas[0]!;
  const ads = computeAntardashas(md);
  const ad = ads[0]!;

  it('returns 9 pratyantars', () => {
    const pds = computePratyantars(ad);
    expect(pds.length).toBe(9);
  });

  it('sum of pratyantar years equals antardasha years', () => {
    const pds = computePratyantars(ad);
    expect(sumYears(pds)).toBeCloseTo(ad.years, 6);
  });

  it('pratyantars are contiguous', () => {
    const pds = computePratyantars(ad);
    for (let i = 0; i < 8; i++) {
      expect(pds[i].end).toBe(pds[i + 1].start);
    }
  });

  it('first pratyantar starts at antardasha start', () => {
    const pds = computePratyantars(ad);
    expect(pds[0].start).toBe(ad.start);
  });
});

// ─── enrichWithAntardashas ───────────────────────────────────────────────────

describe('enrichWithAntardashas', () => {
  const dashas = computeMahadashas(0, BIRTH);

  it('each mahadasha gets 9 antardashas', () => {
    const enriched = enrichWithAntardashas(dashas);
    for (const d of enriched) {
      expect(d.antardashas!.length).toBe(9);
    }
  });

  it('returns same 9 top-level entries', () => {
    const enriched = enrichWithAntardashas(dashas);
    expect(enriched.length).toBe(9);
  });

  it('without pratyantars, antardashas have no pratyantars', () => {
    const enriched = enrichWithAntardashas(dashas, false);
    for (const d of enriched) {
      for (const ad of d.antardashas!) {
        expect(ad.pratyantars).toBeUndefined();
      }
    }
  });

  it('with pratyantars, each antardasha has 9 pratyantars', () => {
    const enriched = enrichWithAntardashas(dashas, true);
    for (const d of enriched) {
      for (const ad of d.antardashas!) {
        expect(ad.pratyantars!.length).toBe(9);
      }
    }
  });
});
