import { describe, it, expect } from 'vitest';
import { nakshatra_tyajyam } from '../src/calculations/tyajyam/nakshatra';
import { tithi_tyajyam } from '../src/calculations/tyajyam/tithi';
import { vara_tyajyam } from '../src/calculations/tyajyam/vara';
import { amritadi_yogam } from '../src/calculations/tyajyam/amritadi';
import { karana_tyajyam } from '../src/calculations/tyajyam/karana';
import { gowri_tyajyam } from '../src/calculations/tyajyam/gowri';
import { dosha_tyajyam } from '../src/calculations/tyajyam/dosha';
import { tithi_lagna_tyajyam } from '../src/calculations/tyajyam/tithi-lagna';
import { tamil_month_avoidables } from '../src/calculations/tyajyam/tamil-month';
import { lagna_tyajyam } from '../src/calculations/tyajyam/lagna';
import { computeTyajyam } from '../src/calculations/tyajyam';
import { NAKSHATRA_TYAJYAM_DURATION_MIN, TITHI_TYAJYAM_DURATION_MIN,
         VARA_TYAJYAM_DURATION_MIN } from '../src/constants/muhurta';

function durMin(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

function makeNakshatra(index: number, startIso: string, durationMin: number) {
  const start = new Date(startIso).getTime();
  const end = new Date(start + durationMin * 60000).toISOString();
  return { index, name: `Nak${index}`, starts_at: startIso, ends_at: end };
}

function makeTithi(index: number, startIso: string, durationMin: number) {
  const start = new Date(startIso).getTime();
  const end = new Date(start + durationMin * 60000).toISOString();
  return { index, name: `Tithi${index}`, starts_at: startIso, ends_at: end };
}

// ─── Nakshatra Tyajyam ────────────────────────────────────────────────────────

describe('nakshatra_tyajyam', () => {
  it('returns one entry per nakshatra', () => {
    const naks = [makeNakshatra(0, '2024-01-01T06:00:00Z', 600)]; // 10h nakshatra
    const result = nakshatra_tyajyam(naks);
    expect(result.length).toBe(1);
  });

  it('window duration is 96 minutes', () => {
    const naks = [makeNakshatra(0, '2024-01-01T06:00:00Z', 600)];
    const result = nakshatra_tyajyam(naks);
    expect(durMin(result[0].start, result[0].end)).toBeCloseTo(NAKSHATRA_TYAJYAM_DURATION_MIN, 0);
  });

  it('window does not exceed nakshatra end', () => {
    const naks = [makeNakshatra(0, '2024-01-01T06:00:00Z', 90)]; // only 90-min nakshatra
    const result = nakshatra_tyajyam(naks);
    // offset for Ashwini = 5/6 ratio → would start near end of 90-min nak
    expect(new Date(result[0].end).getTime())
      .toBeLessThanOrEqual(new Date(naks[0].ends_at).getTime() + 1);
  });

  it('nakshatra field is the name from input', () => {
    const naks = [makeNakshatra(5, '2024-01-01T06:00:00Z', 600)];
    const result = nakshatra_tyajyam(naks);
    expect(result[0].nakshatra).toBe('Nak5');
  });

  it('window start >= nakshatra start', () => {
    const naks = [makeNakshatra(0, '2024-01-01T06:00:00Z', 600)];
    const result = nakshatra_tyajyam(naks);
    expect(new Date(result[0].start).getTime())
      .toBeGreaterThanOrEqual(new Date(naks[0].starts_at!).getTime());
  });
});

// ─── Tithi Tyajyam ────────────────────────────────────────────────────────────

describe('tithi_tyajyam', () => {
  it('returns one entry per tithi', () => {
    const tithis = [makeTithi(1, '2024-01-01T06:00:00Z', 720)]; // 12h tithi
    const result = tithi_tyajyam(tithis);
    expect(result.length).toBe(1);
  });

  it('window duration is 96 minutes', () => {
    const tithis = [makeTithi(1, '2024-01-01T06:00:00Z', 720)];
    const result = tithi_tyajyam(tithis);
    expect(durMin(result[0].start, result[0].end)).toBeCloseTo(TITHI_TYAJYAM_DURATION_MIN, 0);
  });

  it('tithi field is set', () => {
    const tithis = [makeTithi(5, '2024-01-01T06:00:00Z', 720)];
    const result = tithi_tyajyam(tithis);
    expect(result[0].tithi).toBe('Tithi5');
  });

  it('handles Purnima (index 15)', () => {
    const tithis = [makeTithi(15, '2024-01-01T06:00:00Z', 720)];
    expect(tithi_tyajyam(tithis).length).toBe(1);
  });

  it('handles Amavasya (index 30)', () => {
    const tithis = [makeTithi(30, '2024-01-01T06:00:00Z', 720)];
    expect(tithi_tyajyam(tithis).length).toBe(1);
  });
});

// ─── Vara Tyajyam ────────────────────────────────────────────────────────────

describe('vara_tyajyam', () => {
  const SUNRISE = '2024-01-01T06:00:00Z';

  it('returns a TimeWindow for each weekday', () => {
    for (let d = 1; d <= 7; d++) {
      const w = vara_tyajyam(SUNRISE, d);
      expect(w).not.toBeNull();
    }
  });

  it('duration is 90 minutes', () => {
    for (let d = 1; d <= 7; d++) {
      const w = vara_tyajyam(SUNRISE, d)!;
      expect(durMin(w.start, w.end)).toBeCloseTo(VARA_TYAJYAM_DURATION_MIN, 0);
    }
  });

  it('Monday (1) offset = 42 nazhigai × 24min = 1008min after sunrise', () => {
    const w = vara_tyajyam(SUNRISE, 1)!;
    const offsetMin = (new Date(w.start).getTime() - new Date(SUNRISE).getTime()) / 60000;
    expect(offsetMin).toBeCloseTo(42 * 24, 0);
  });

  it('window start is after sunrise', () => {
    const w = vara_tyajyam(SUNRISE, 1)!;
    expect(new Date(w.start).getTime()).toBeGreaterThan(new Date(SUNRISE).getTime());
  });
});

// ─── Amritadi Yogam ────────────────────────────────────────────────────────────

describe('amritadi_yogam', () => {
  it('returns one entry per nakshatra', () => {
    const naks = [makeNakshatra(0, '2024-01-01T06:00:00Z', 600)];
    const result = amritadi_yogam(naks, 1); // Monday
    expect(result.length).toBe(1);
  });

  it('yogam is one of: Amrita, Siddha, Marana, Prabalarishta', () => {
    const VALID = new Set(['Amrita', 'Siddha', 'Marana', 'Prabalarishta']);
    for (let d = 1; d <= 7; d++) {
      for (let n = 0; n < 27; n++) {
        const naks = [makeNakshatra(n, '2024-01-01T06:00:00Z', 600)];
        const result = amritadi_yogam(naks, d);
        expect(VALID.has(result[0].yogam)).toBe(true);
      }
    }
  });

  it('nakshatra field is set', () => {
    const naks = [makeNakshatra(3, '2024-01-01T06:00:00Z', 600)];
    const result = amritadi_yogam(naks, 1);
    expect(result[0].nakshatra).toBe('Nak3');
  });

  it('start/end match nakshatra span', () => {
    const naks = [makeNakshatra(0, '2024-01-01T06:00:00Z', 600)];
    const result = amritadi_yogam(naks, 1);
    expect(result[0].start).toBe(naks[0].starts_at);
    expect(result[0].end).toBe(naks[0].ends_at);
  });
});

// ─── Karana Tyajyam ──────────────────────────────────────────────────────────

describe('karana_tyajyam', () => {
  it('returns only inauspicious karanas (Vishti, Chatushpada, Naga)', () => {
    const karanas = [
      { index: 6, name: 'Vishti',     starts_at: 'A', ends_at: 'B' },
      { index: 0, name: 'Bava',       starts_at: 'C', ends_at: 'D' },
      { index: 58, name: 'Chatushpada', starts_at: 'E', ends_at: 'F' },
    ];
    const result = karana_tyajyam(karanas);
    expect(result.length).toBe(2);
    expect(result.map(r => r.karana)).toEqual(['Vishti', 'Chatushpada']);
  });

  it('returns empty for all auspicious karanas', () => {
    const karanas = [{ index: 0, name: 'Bava', starts_at: 'A', ends_at: 'B' }];
    expect(karana_tyajyam(karanas).length).toBe(0);
  });

  it('karana field is set from name', () => {
    const karanas = [{ index: 59, name: 'Naga', starts_at: 'A', ends_at: 'B' }];
    const result = karana_tyajyam(karanas);
    expect(result[0].karana).toBe('Naga');
  });
});

// ─── Gowri Tyajyam ───────────────────────────────────────────────────────────

describe('gowri_tyajyam', () => {
  it('returns inauspicious Gowri segments (Soram, Visham, Rogam)', () => {
    const day = [
      { name: 'Soram',   auspicious: false, start: '2024-01-01T06:00:00Z', end: '2024-01-01T07:00:00Z' },
      { name: 'Amridha', auspicious: true,  start: '2024-01-01T07:00:00Z', end: '2024-01-01T08:00:00Z' },
      { name: 'Visham',  auspicious: false, start: '2024-01-01T08:00:00Z', end: '2024-01-01T09:00:00Z' },
    ];
    const night: any[] = [];
    const result = gowri_tyajyam(day, night);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Soram');
    expect(result[1].name).toBe('Visham');
  });

  it('period field is "day" for day segments', () => {
    const day = [{ name: 'Rogam', auspicious: false, start: 'A', end: 'B' }];
    const result = gowri_tyajyam(day, []);
    expect(result[0].period).toBe('day');
  });

  it('returns empty when all segments are auspicious', () => {
    const day = [{ name: 'Amridha', auspicious: true, start: 'A', end: 'B' }];
    expect(gowri_tyajyam(day, []).length).toBe(0);
  });
});

// ─── Dosha Tyajyam ───────────────────────────────────────────────────────────

describe('dosha_tyajyam', () => {
  const SR = '2024-01-01T06:00:00Z';
  const SS = '2024-01-01T18:00:00Z';

  it('returns solar eclipse window clipped to day', () => {
    const eclipses = [{ start: '2024-01-01T07:00:00Z', end: '2024-01-01T09:00:00Z', kind: 'solar' as const }];
    const result = dosha_tyajyam(SR, SS, eclipses, 100, 100, false, 0);
    expect(result.some(r => r.dosha === 'Solar Eclipse')).toBe(true);
  });

  it('returns Guru Asthamanam when Jupiter within 11° of Sun', () => {
    const result = dosha_tyajyam(SR, SS, [], 5, 100, false, 0); // Jupiter at 5°, Sun at 0°
    expect(result.some(r => r.dosha === 'Guru Asthamanam')).toBe(true);
  });

  it('no Guru Asthamanam when Jupiter > 11° from Sun', () => {
    const result = dosha_tyajyam(SR, SS, [], 15, 100, false, 0); // 15° away
    expect(result.some(r => r.dosha === 'Guru Asthamanam')).toBe(false);
  });

  it('Sukra Asthamanam direct when Venus within 10°', () => {
    const result = dosha_tyajyam(SR, SS, [], 100, 8, false, 0); // Venus at 8°, Sun at 0°
    expect(result.some(r => r.dosha === 'Sukra Asthamanam')).toBe(true);
  });

  it('Sukra Asthamanam retrograde when Venus within 8°', () => {
    const result = dosha_tyajyam(SR, SS, [], 100, 5, true, 0);
    expect(result.some(r => r.dosha === 'Sukra Asthamanam')).toBe(true);
  });

  it('no dosha when nothing is afflicted', () => {
    const result = dosha_tyajyam(SR, SS, [], 20, 20, false, 0);
    expect(result.length).toBe(0);
  });
});

// ─── Lagna Tyajyam ───────────────────────────────────────────────────────────

describe('lagna_tyajyam', () => {
  it('returns one entry per lagna', () => {
    const lagnas = [
      { sign: 'Aries',  rashi: 'Mesha', start: '2024-01-01T06:00:00Z', end: '2024-01-01T08:00:00Z' },
      { sign: 'Cancer', rashi: 'Karka', start: '2024-01-01T08:00:00Z', end: '2024-01-01T10:00:00Z' },
    ];
    const result = lagna_tyajyam(lagnas);
    expect(result.length).toBe(2);
  });

  it('duration is 10% of lagna duration', () => {
    const lagnas = [
      { sign: 'Aries', rashi: 'Mesha', start: '2024-01-01T06:00:00Z', end: '2024-01-01T08:00:00Z' },
    ];
    const result = lagna_tyajyam(lagnas);
    const dur = durMin(result[0].start, result[0].end);
    expect(dur).toBeCloseTo(120 * 0.10, 0); // 12 min
  });

  it('Aries is beginning-defect: tyajyam at start of lagna', () => {
    const lagnas = [
      { sign: 'Aries', rashi: 'Mesha', start: '2024-01-01T06:00:00Z', end: '2024-01-01T08:00:00Z' },
    ];
    const result = lagna_tyajyam(lagnas);
    expect(result[0].start).toBe('2024-01-01T06:00:00.000Z');
    expect(result[0].position).toBe('beginning');
  });

  it('Cancer is end-defect: tyajyam at end of lagna', () => {
    const lagnas = [
      { sign: 'Cancer', rashi: 'Karka', start: '2024-01-01T06:00:00Z', end: '2024-01-01T08:00:00Z' },
    ];
    const result = lagna_tyajyam(lagnas);
    expect(result[0].end).toBe('2024-01-01T08:00:00.000Z');
    expect(result[0].position).toBe('end');
  });
});

// ─── Tamil Month Avoidables ───────────────────────────────────────────────────

describe('tamil_month_avoidables', () => {
  it('returns null for months with no avoidables', () => {
    // Aavani has empty lists
    const result = tamil_month_avoidables('Aavani');
    expect(result).toBeNull();
  });

  it('returns avoidables for Chithirai', () => {
    const result = tamil_month_avoidables('Chithirai');
    expect(result).not.toBeNull();
    expect(result!.avoid_tithis.length).toBeGreaterThan(0);
  });

  it('has the correct shape when non-null', () => {
    const result = tamil_month_avoidables('Chithirai');
    expect(Array.isArray(result!.avoid_tithis)).toBe(true);
    expect(Array.isArray(result!.avoid_nakshatras)).toBe(true);
    expect(Array.isArray(result!.avoid_lagnas)).toBe(true);
    expect(Array.isArray(result!.windows)).toBe(true);
  });

  it('returns null for unknown month', () => {
    const result = tamil_month_avoidables('UnknownMonth');
    expect(result).toBeNull();
  });
});

// ─── computeTyajyam orchestrator ─────────────────────────────────────────────

describe('computeTyajyam', () => {
  const SUNRISE = '2024-01-01T06:00:00Z';
  const SUNSET  = '2024-01-01T18:00:00Z';

  const inputs = {
    nakshatras: [makeNakshatra(0, SUNRISE, 600)],
    tithis: [makeTithi(1, SUNRISE, 720)],
    karanas: [
      { index: 6, name: 'Vishti', starts_at: SUNRISE, ends_at: SUNSET },
    ],
    sunriseIso: SUNRISE,
    sunsetIso: SUNSET,
    weekday: 1, // Monday
    gowri: {
      day: [
        { name: 'Amridha', auspicious: true,  start: SUNRISE, end: SUNSET },
        { name: 'Soram',   auspicious: false, start: SUNRISE, end: SUNSET },
      ],
      night: [],
    },
    lagnas: [{ sign: 'Aries', rashi: 'Mesha', start: SUNRISE, end: SUNSET }],
    signNames: Array.from({ length: 12 }, (_, i) => ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][i]),
    jupiterLon: 30,
    venusLon: 30,
    venusRetro: false,
    sunLon: 0,
    eclipseWins: [],
    tamilMonthEn: 'Chithirai',
  };

  const result = computeTyajyam(inputs);

  it('returns all 10 tyajyam types', () => {
    expect(result.nakshatraTyajyam).toBeDefined();
    expect(result.tithiTyajyam).toBeDefined();
    expect(result.varaTyajyam).toBeDefined();
    expect(result.amritadiYogam).toBeDefined();
    expect(result.lagnaTyajyam).toBeDefined();
    expect(result.karanaTyajyam).toBeDefined();
    expect(result.gowriTyajyam).toBeDefined();
    expect(result.doshaTyajyam).toBeDefined();
    expect(result.tithiLagnaTyajyam).toBeDefined();
    expect(result.tamilMonthAvoidables).toBeDefined();
  });

  it('karanaTyajyam has Vishti entry', () => {
    expect(result.karanaTyajyam.length).toBe(1);
    expect(result.karanaTyajyam[0].karana).toBe('Vishti');
  });

  it('varaTyajyam is non-null', () => {
    expect(result.varaTyajyam).not.toBeNull();
  });

  it('tamilMonthAvoidables is populated for Chithirai', () => {
    expect(result.tamilMonthAvoidables).not.toBeNull();
  });
});
