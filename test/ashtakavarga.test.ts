import { describe, it, expect } from 'vitest';
import { computeAshtakavarga } from '../src/calculations/ashtakavarga';
import { BAV_RULES } from '../src/constants/planets';

// Reference chart: all planets in Aries (sign 1), ascendant in Aries
const ALL_ARIES: Record<string, number> = {
  Su: 1, Mo: 1, Ma: 1, Me: 1, Ju: 1, Ve: 1, Sa: 1,
};

describe('computeAshtakavarga — structure', () => {
  const result = computeAshtakavarga(ALL_ARIES, 1);

  it('returns bav and sav', () => {
    expect(result).toHaveProperty('bav');
    expect(result).toHaveProperty('sav');
  });

  it('bav has exactly 7 planet keys', () => {
    expect(Object.keys(result.bav).length).toBe(7);
  });

  it('each bav entry has 12 elements', () => {
    for (const [planet, pts] of Object.entries(result.bav)) {
      expect(pts.length).toBe(12);
    }
  });

  it('sav has 12 elements', () => {
    expect(result.sav.length).toBe(12);
  });

  it('all bav values are non-negative integers', () => {
    for (const pts of Object.values(result.bav)) {
      for (const p of pts) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(p)).toBe(true);
      }
    }
  });

  it('all sav values are non-negative integers', () => {
    for (const v of result.sav) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('sav[i] equals sum of all bav[planet][i]', () => {
    for (let i = 0; i < 12; i++) {
      const expected = Object.values(result.bav).reduce((s, pts) => s + pts[i]!, 0);
      expect(result.sav[i]).toBe(expected);
    }
  });

  it('total bav points per planet ≤ 8 × 12 = 96', () => {
    for (const pts of Object.values(result.bav)) {
      const total = pts.reduce((s, v) => s + v, 0);
      expect(total).toBeLessThanOrEqual(96);
    }
  });
});

describe('computeAshtakavarga — scattered chart', () => {
  const SCATTERED: Record<string, number> = {
    Su: 1, Mo: 4, Ma: 7, Me: 10, Ju: 3, Ve: 6, Sa: 9,
  };
  const result = computeAshtakavarga(SCATTERED, 2);

  it('structure is correct for scattered positions', () => {
    expect(Object.keys(result.bav).length).toBe(7);
    expect(result.sav.length).toBe(12);
  });

  it('sav is still consistent with bav', () => {
    for (let i = 0; i < 12; i++) {
      const expected = Object.values(result.bav).reduce((s, pts) => s + pts[i]!, 0);
      expect(result.sav[i]).toBe(expected);
    }
  });

  it('total SAV across all signs = sum of all BAV totals', () => {
    const savTotal = result.sav.reduce((s, v) => s + v, 0);
    const bavTotal = Object.values(result.bav)
      .reduce((s, pts) => s + pts.reduce((ss, v) => ss + v, 0), 0);
    expect(savTotal).toBe(bavTotal);
  });
});

describe('computeAshtakavarga — BAV point counts', () => {
  // Sun's BAV from itself: rules say houses [1,2,4,7,8,9,10,11] = 8 houses
  // With all planets in sign 1 (Aries), contributor Sun is also in sign 1.
  // Points go to signs at offsets from contributor sign.
  it('Sun BAV has contributions from all 8 contributors', () => {
    const result = computeAshtakavarga(ALL_ARIES, 1);
    const sunBav = result.bav['Sun'];
    // Total points should equal sum of all house-offset counts for Sun across all contributors
    const expectedTotal = Object.values(BAV_RULES['Sun']!).reduce(
      (s, houses) => s + houses.length, 0,
    );
    const actualTotal = sunBav!.reduce((s, v) => s + v, 0);
    expect(actualTotal).toBe(expectedTotal);
  });
});
