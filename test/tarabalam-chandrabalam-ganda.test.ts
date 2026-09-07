import { describe, it, expect } from 'vitest';
import { computeTarabalam, isTaraGood } from '../src/calculations/tarabalam';
import { computeChandrabalam, isChandraGood } from '../src/calculations/chandrabalam';
import { detectGandaMula, detectRaviYoga } from '../src/calculations/ganda-mula-ravi-yoga';
import { GOOD_TARA_OFFSETS, GOOD_CHANDRA_OFFSETS } from '../src/constants/calendars';

// ─── Tarabalam ────────────────────────────────────────────────────────────────

describe('isTaraGood', () => {
  it('birth nakshatra itself (offset 0) is always good', () => {
    for (let b = 0; b < 27; b++) {
      expect(isTaraGood(b, b)).toBe(true);
    }
  });

  it('offset 1 is good', () => {
    expect(isTaraGood(1, 0)).toBe(true);
  });

  it('offset 2 is NOT good', () => {
    expect(isTaraGood(2, 0)).toBe(false);
  });

  it('offset 3 is good', () => {
    expect(isTaraGood(3, 0)).toBe(true);
  });

  it('handles wrap-around correctly (nak 26 + offset 2 = 28%27 = 1)', () => {
    // birthNak=25, currentNak=0 → offset=(0-25+27)%27=2 → NOT good
    expect(isTaraGood(0, 25)).toBe(false);
  });

  it('consistent with GOOD_TARA_OFFSETS', () => {
    for (let offset = 0; offset < 27; offset++) {
      expect(isTaraGood(offset, 0)).toBe(GOOD_TARA_OFFSETS.has(offset));
    }
  });
});

describe('computeTarabalam', () => {
  const namesFn = (i: number) => `Nak${i}`;

  it('returns exactly 18 good nakshatras', () => {
    const result = computeTarabalam(0, namesFn);
    expect(result.good_nakshatras.length).toBe(18);
  });

  it('birth nakshatra is always in the list (offset 0)', () => {
    for (let b = 0; b < 27; b++) {
      const result = computeTarabalam(b, namesFn);
      const found = result.good_nakshatras.find(n => n.index === b);
      expect(found).toBeDefined();
    }
  });

  it('nakshatra name is resolved via namesFn', () => {
    const result = computeTarabalam(0, namesFn);
    for (const entry of result.good_nakshatras) {
      expect(entry.nakshatra).toBe(`Nak${entry.index}`);
    }
  });

  it('all indices are in range 0-26', () => {
    const result = computeTarabalam(0, namesFn);
    for (const entry of result.good_nakshatras) {
      expect(entry.index).toBeGreaterThanOrEqual(0);
      expect(entry.index).toBeLessThanOrEqual(26);
    }
  });

  it('count is always 18 regardless of birth nakshatra', () => {
    for (let b = 0; b < 27; b++) {
      expect(computeTarabalam(b, namesFn).good_nakshatras.length).toBe(18);
    }
  });
});

// ─── Chandrabalam ─────────────────────────────────────────────────────────────

describe('isChandraGood', () => {
  it('birth sign itself (offset 0) is always good', () => {
    for (let b = 1; b <= 12; b++) {
      expect(isChandraGood(b, b)).toBe(true);
    }
  });

  it('offset 1 (next sign) is NOT good', () => {
    expect(isChandraGood(2, 1)).toBe(false);
  });

  it('offset 2 is good', () => {
    expect(isChandraGood(3, 1)).toBe(true);
  });

  it('consistent with GOOD_CHANDRA_OFFSETS', () => {
    for (let offset = 0; offset < 12; offset++) {
      expect(isChandraGood(offset + 1, 1)).toBe(GOOD_CHANDRA_OFFSETS.has(offset));
    }
  });
});

describe('computeChandrabalam', () => {
  const namesFn = (i: number) => `Sign${i + 1}`;

  it('returns exactly 6 good rashis', () => {
    for (let b = 1; b <= 12; b++) {
      const result = computeChandrabalam(b, namesFn);
      expect(result.good_rashis.length).toBe(6);
    }
  });

  it('birth sign is always included', () => {
    for (let b = 1; b <= 12; b++) {
      const result = computeChandrabalam(b, namesFn);
      const found = result.good_rashis.find(r => r.index === b);
      expect(found).toBeDefined();
    }
  });

  it('rashi name is resolved via namesFn', () => {
    const result = computeChandrabalam(1, namesFn);
    for (const entry of result.good_rashis) {
      // 0-indexed namesFn → entry.index is 1-based sign_id
      expect(entry.rashi).toBe(namesFn(entry.index - 1));
    }
  });

  it('all index values are 1-12', () => {
    const result = computeChandrabalam(1, namesFn);
    for (const entry of result.good_rashis) {
      expect(entry.index).toBeGreaterThanOrEqual(1);
      expect(entry.index).toBeLessThanOrEqual(12);
    }
  });
});

// ─── Ganda Mula ───────────────────────────────────────────────────────────────

describe('detectGandaMula', () => {
  const GANDA_MULA_INDICES = [0, 8, 9, 17, 18, 26];

  it('returns null for non-ganda-mula nakshatra', () => {
    const naks = [{ index: 1, name: 'Bharani', starts_at: 'T1', ends_at: '2024-01-01T12:00:00Z' }];
    expect(detectGandaMula(naks)).toBeNull();
  });

  it('detects Ashwini (index 0) as ganda mula', () => {
    const naks = [{ index: 0, name: 'Ashwini', ends_at: '2024-01-01T12:00:00Z' }];
    const result = detectGandaMula(naks);
    expect(result).not.toBeNull();
    expect(result!.nakshatra).toBe('Ashwini');
    expect(result!.ends_at).toBe('2024-01-01T12:00:00Z');
  });

  it('detects Ashlesha (index 8)', () => {
    const naks = [{ index: 8, name: 'Ashlesha', ends_at: '2024-01-01T18:00:00Z' }];
    expect(detectGandaMula(naks)).not.toBeNull();
  });

  it('detects Revati (index 26)', () => {
    const naks = [{ index: 26, name: 'Revati', ends_at: '2024-01-01T20:00:00Z' }];
    expect(detectGandaMula(naks)).not.toBeNull();
  });

  it('returns the first ganda mula in sequence', () => {
    const naks = [
      { index: 5, name: 'Ardra',   ends_at: '2024-01-01T08:00:00Z' },
      { index: 0, name: 'Ashwini', ends_at: '2024-01-01T20:00:00Z' }, // ganda mula
      { index: 9, name: 'Magha',   ends_at: '2024-01-02T08:00:00Z' }, // also ganda mula
    ];
    const result = detectGandaMula(naks);
    expect(result!.nakshatra).toBe('Ashwini'); // first one found
  });

  it('all 6 ganda mula indices are detected', () => {
    for (const idx of GANDA_MULA_INDICES) {
      const naks = [{ index: idx, name: `Nak${idx}`, ends_at: '2024-01-01T12:00:00Z' }];
      expect(detectGandaMula(naks)).not.toBeNull();
    }
  });

  it('returns null for empty sequence', () => {
    expect(detectGandaMula([])).toBeNull();
  });
});

// ─── Ravi Yoga ───────────────────────────────────────────────────────────────

describe('detectRaviYoga', () => {
  const SUNRISE = '2024-01-07T07:00:00Z';
  const SUNSET  = '2024-01-07T17:00:00Z';

  it('Sunday (7) + Pushya (7) → Ravi Yoga present', () => {
    const result = detectRaviYoga(7, 7, SUNRISE, SUNSET);
    expect(result).not.toBeNull();
    expect(result!.start).toBe(SUNRISE);
    expect(result!.end).toBe(SUNSET);
  });

  it('Sunday (7) + Swati (14) → Ravi Yoga present', () => {
    const result = detectRaviYoga(14, 7, SUNRISE, SUNSET);
    expect(result).not.toBeNull();
  });

  it('Sunday (7) + Shravana (21) → Ravi Yoga present', () => {
    const result = detectRaviYoga(21, 7, SUNRISE, SUNSET);
    expect(result).not.toBeNull();
  });

  it('Sunday (7) + Ashwini (0) → no Ravi Yoga', () => {
    const result = detectRaviYoga(0, 7, SUNRISE, SUNSET);
    expect(result).toBeNull();
  });

  it('Monday (1) + Rohini (3) → Ravi Yoga present', () => {
    const result = detectRaviYoga(3, 1, SUNRISE, SUNSET);
    expect(result).not.toBeNull();
  });

  it('Tuesday (2) + Pushya (7) → no Ravi Yoga', () => {
    const result = detectRaviYoga(7, 2, SUNRISE, SUNSET);
    expect(result).toBeNull();
  });
});
