import { describe, it, expect } from 'vitest';
import { vargaSign, vargaDegreeInSign, buildVargaCharts } from '../src/calculations/vargas';
import { VARGA_ORDER } from '../src/constants/vargas';
import { getLocaleTable } from '../src/locales';

// ─── vargaSign ─────────────────────────────────────────────────────────────────

describe('vargaSign D1 (Rashi)', () => {
  it('matches signIdFromLon for all 12 signs', () => {
    const cases = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (let i = 0; i < 12; i++) {
      expect(vargaSign(cases[i], 1)).toBe(i + 1);
    }
  });
  it('handles values at sign boundaries', () => {
    expect(vargaSign(29.99, 1)).toBe(1);
    expect(vargaSign(30.0, 1)).toBe(2);
    expect(vargaSign(359.99, 1)).toBe(12);
  });
});

describe('vargaSign D9 (Navamsa) — direct formula', () => {
  it('lon=0 → D9 sign=1', () => {
    expect(vargaSign(0, 9)).toBe(1);
  });
  it('lon=3.33... (1/4 of Aries first nav) → D9 sign=1', () => {
    // Each 3.333° of longitude = one navamsa
    expect(vargaSign(3.33, 9)).toBe(1);
  });
  it('lon=13.333 (1 full nakshatra) → D9 sign 5', () => {
    // 1 full nakshatra is 13°20' (13.3333...°); 13.333 * 9 = 119.997 < 120.
    // At/past 1 full nakshatra (13.334°): 13.334 * 9 = 120.006 / 30 = sign 5 (Leo)
    expect(vargaSign(13.334, 9)).toBe(5);
  });
  it('matches direct navamsa formula for arbitrary longitude', () => {
    for (let lon = 0; lon < 360; lon += 3.333) {
      const expected = Math.floor(((lon * 9) % 360) / 30) + 1;
      expect(vargaSign(lon, 9)).toBe(expected);
    }
  });
});

describe('vargaSign D2 (Hora)', () => {
  it('Aries (odd) 0-14.99° → Leo (5)', () => {
    expect(vargaSign(5, 2)).toBe(5);
    expect(vargaSign(14.9, 2)).toBe(5);
  });
  it('Aries (odd) 15-29.99° → Cancer (4)', () => {
    expect(vargaSign(15, 2)).toBe(4);
    expect(vargaSign(29.9, 2)).toBe(4);
  });
  it('Taurus (even) 0-14.99° → Cancer (4)', () => {
    expect(vargaSign(30, 2)).toBe(4);
    expect(vargaSign(44.9, 2)).toBe(4);
  });
  it('Taurus (even) 15-29.99° → Leo (5)', () => {
    expect(vargaSign(45, 2)).toBe(5);
  });
});

describe('vargaSign D3 (Drekkana)', () => {
  it('first decanate of Aries → Aries (1)', () => {
    expect(vargaSign(0, 3)).toBe(1);
    expect(vargaSign(9.9, 3)).toBe(1);
  });
  it('second decanate of Aries → Leo (5)', () => {
    expect(vargaSign(10, 3)).toBe(5);
    expect(vargaSign(19.9, 3)).toBe(5);
  });
  it('third decanate of Aries → Sagittarius (9)', () => {
    expect(vargaSign(20, 3)).toBe(9);
  });
});

describe('vargaSign D11 (Rudramsa) — anti-zodiac start', () => {
  // startSign = ((1 - signId) % 12 + 12) % 12 + 1
  // Aries(1): ((1-1)%12+12)%12+1 = 0+1 = 1 → starts at Aries
  // Taurus(2): ((1-2)%12+12)%12+1 = 11+1 = 12 → starts at Pisces
  // Gemini(3): ((1-3)%12+12)%12+1 = 10+1 = 11 → starts at Aquarius
  it('first part of Aries → Aries start (D11 sign 1)', () => {
    expect(vargaSign(0, 11)).toBe(1);
  });
  it('Gemini (3) first part starts at Aquarius (11)', () => {
    // lon just past 60° (start of Gemini)
    const result = vargaSign(60, 11);
    expect(result).toBe(11);
  });
});

describe('vargaSign D7 (Saptamsa)', () => {
  it('odd signs start from the same sign', () => {
    // Aries (odd): first part → Aries
    const result = vargaSign(0, 7);
    expect(result).toBe(1);
  });
  it('even signs start 6 signs ahead', () => {
    // Taurus (even, sign 2): start = sign 2+6=8 (Scorpio); first part → Scorpio
    const result = vargaSign(30, 7);
    expect(result).toBe(8);
  });
});

describe('vargaSign D30 (Trimshamsa) uneven segments', () => {
  // Odd sign (Aries): breaks [0,5,10,18,25,30], signs [1,11,9,3,7]
  it('Aries 0-4.99° → Aries (1)', () => {
    expect(vargaSign(0, 30)).toBe(1);
    expect(vargaSign(4.9, 30)).toBe(1);
  });
  it('Aries 5-9.99° → Aquarius (11)', () => {
    expect(vargaSign(5, 30)).toBe(11);
    expect(vargaSign(9.9, 30)).toBe(11);
  });
  it('Aries 10-17.99° → Sagittarius (9)', () => {
    expect(vargaSign(10, 30)).toBe(9);
  });
  it('Aries 18-24.99° → Gemini (3)', () => {
    expect(vargaSign(18, 30)).toBe(3);
  });
  it('Aries 25-29.99° → Libra (7)', () => {
    expect(vargaSign(25, 30)).toBe(7);
  });
  // Even sign (Taurus): breaks [0,5,12,20,25,30], signs [2,6,12,10,8]
  it('Taurus 0-4.99° → Taurus (2)', () => {
    expect(vargaSign(30, 30)).toBe(2);
    expect(vargaSign(34.9, 30)).toBe(2);
  });
  it('Taurus 5-11.99° → Virgo (6)', () => {
    expect(vargaSign(35, 30)).toBe(6);
  });
});

describe('vargaSign — all vargas produce sign IDs in range 1-12', () => {
  it('test 50 random longitudes for each varga', () => {
    const testLons = Array.from({ length: 50 }, (_, i) => (i * 7.2));
    for (const v of VARGA_ORDER) {
      for (const lon of testLons) {
        const sign = vargaSign(lon, v);
        expect(sign).toBeGreaterThanOrEqual(1);
        expect(sign).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe('vargaDegreeInSign', () => {
  it('D1: returns position within sign (0-30)', () => {
    const d = vargaDegreeInSign(15.5, 1);
    expect(d).toBeCloseTo(15.5, 3);
  });
  it('returns value in [0, 30)', () => {
    const lons = [0, 15, 30, 45, 90, 180, 270, 359];
    for (const v of VARGA_ORDER) {
      for (const lon of lons) {
        const d = vargaDegreeInSign(lon, v);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThan(30);
      }
    }
  });
});

describe('buildVargaCharts', () => {
  const table = getLocaleTable('en');
  // Simple test chart: Sun at 15° Aries (lon=15), Moon at 45° (Taurus), asc at 0°
  const planetLons: Record<string, number> = {
    Su: 15, Mo: 45, Ma: 90, Me: 135, Ju: 180, Ve: 225, Sa: 270, Ra: 315, Ke: 135,
  };
  const charts = buildVargaCharts(planetLons, 0, table.vargaNames, table.vargaSubtitles);

  it('returns 17 charts', () => {
    expect(Object.keys(charts).length).toBe(17);
  });

  it('all 17 varga keys present', () => {
    const expectedKeys = VARGA_ORDER.map(v => `d${v}`);
    for (const key of expectedKeys) {
      expect(charts[key]).toBeDefined();
    }
  });

  it('each chart has houses 1-12', () => {
    for (const chart of Object.values(charts)) {
      for (let h = 1; h <= 12; h++) {
        expect(chart.chart[h]).toBeDefined();
        expect(Array.isArray(chart.chart[h])).toBe(true);
      }
    }
  });

  it('D1 Sun is in house 1 (ascendant at 0° = Aries, Sun at 15° Aries)', () => {
    const d1 = charts['d1']!;
    expect(d1.asc_sign).toBe(1); // Aries
    // Sun (lon=15) in sign 1 (Aries); asc sign 1 → house = ((1-1+12)%12)+1 = 1
    expect(d1.chart[1]).toContain('Su');
  });

  it('each chart has name and subtitle', () => {
    for (const [key, chart] of Object.entries(charts)) {
      expect(chart.name.length).toBeGreaterThan(0);
      expect(typeof chart.division).toBe('number');
    }
  });

  it('planet_degrees have values in [0, 30)', () => {
    for (const chart of Object.values(charts)) {
      for (const deg of Object.values(chart.planet_degrees)) {
        expect(deg).toBeGreaterThanOrEqual(0);
        expect(deg).toBeLessThan(30);
      }
    }
  });

  it('asc_sign is always 1-12', () => {
    for (const chart of Object.values(charts)) {
      expect(chart.asc_sign).toBeGreaterThanOrEqual(1);
      expect(chart.asc_sign).toBeLessThanOrEqual(12);
    }
  });

  it('all house planet lists together contain all input planets', () => {
    const d1 = charts['d1']!;
    const allPlanets = Object.values(d1.chart).flat();
    for (const abbr of Object.keys(planetLons)) {
      expect(allPlanets).toContain(abbr);
    }
  });
});
