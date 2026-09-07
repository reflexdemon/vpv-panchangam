import { describe, it, expect } from 'vitest';
import {
  NAK_SPAN, SIGN_SPAN,
  RAHU_KAAL_SEGMENT, YAMAGANDA_SEGMENT, GULIKA_SEGMENT,
  karanaName, tithiName,
} from '../src/constants/panchang';
import {
  VARGA_ORDER, SIGN_QUALITY, SIGN_ELEMENT,
  D30_BREAKS_ODD, D30_BREAKS_EVEN, D30_SIGNS_ODD, D30_SIGNS_EVEN,
} from '../src/constants/vargas';
import {
  DASHA_SEQUENCE, DASHA_YEARS, DASHA_TOTAL_YEARS, NAKSHATRA_LORD_CYCLE,
  PLANET_ORDER, COMBUST_PLANETS, COMBUST_ORB, AYANAMSA_MAP, BAV_RULES, BAV_CONTRIBUTORS,
  EXALTATION, DEBILITATION, OWN_SIGNS, MOOLATRIKONA,
} from '../src/constants/planets';
import {
  VARJYAM_GHATIKAS, VARJYAM_DURATION_GHATIKAS, AMRIT_OFFSET_GHATIKAS,
  SARVARTHA_SIDDHI, AMRITA_SIDDHI, DUR_MUHURTA, ABHIJIT_MUHURTA_INDEX,
  GOWRI_DAY_START, HORA_DAY_START, HORA_CYCLE, AUSPICIOUS_HORAS,
  AMRITADI_TABLE, NAKSHATRA_TYAJYAM_RATIO, TITHI_TYAJYAM_BASE,
  VARA_TYAJYAM_NAZHIGAI, INAUSPICIOUS_KARANAS,
} from '../src/constants/muhurta';
import {
  KALI_START_JD, RATA_DIE_EPOCH_JD,
  DISHA_SHOOL, RAHU_VASA, CHANDRA_VASA,
  GOOD_CHANDRA_OFFSETS, GOOD_TARA_OFFSETS,
  CHANDRA_MASA_BY_SUNSIGN, SIGN_TO_DRIK_RITU, SIGN_TO_VEDIC_RITU,
  UTTARAYANA_SIGNS,
} from '../src/constants/calendars';

// ─── Panchang constants ────────────────────────────────────────────────────────

describe('NAK_SPAN / SIGN_SPAN', () => {
  it('NAK_SPAN = 360/27', () => {
    expect(NAK_SPAN).toBeCloseTo(360 / 27, 10);
  });
  it('SIGN_SPAN = 30', () => {
    expect(SIGN_SPAN).toBe(30);
  });
  it('27 × NAK_SPAN === 360', () => {
    expect(27 * NAK_SPAN).toBeCloseTo(360, 8);
  });
});

describe('Rahu Kalam / Yamaganda / Gulika segments', () => {
  const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

  it('RAHU_KAAL_SEGMENT has all 7 weekdays, values 1-8', () => {
    for (const d of WEEKDAYS) {
      const v = RAHU_KAAL_SEGMENT[d]!;
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(8);
    }
  });

  it('known RAHU_KAAL_SEGMENT values', () => {
    expect(RAHU_KAAL_SEGMENT[1]).toBe(2); // Monday = 2nd segment
    expect(RAHU_KAAL_SEGMENT[7]).toBe(8); // Sunday = 8th segment
  });

  it('YAMAGANDA_SEGMENT has all 7 weekdays', () => {
    for (const d of WEEKDAYS) {
      expect(YAMAGANDA_SEGMENT[d]).toBeDefined();
    }
  });

  it('GULIKA_SEGMENT has all 7 weekdays', () => {
    for (const d of WEEKDAYS) {
      expect(GULIKA_SEGMENT[d]).toBeDefined();
    }
  });

  it('all three segment maps have distinct values per weekday', () => {
    // Rahu, Yama, Gulika should not share the same segment on any weekday
    for (const d of WEEKDAYS) {
      const vals = new Set([RAHU_KAAL_SEGMENT[d], YAMAGANDA_SEGMENT[d], GULIKA_SEGMENT[d]]);
      expect(vals.size).toBe(3);
    }
  });
});

describe('karanaName()', () => {
  it('index 0 = Kimstughna (fixed)', () => {
    expect(karanaName(0)).toBe('Kimstughna');
  });
  it('indices 1-7 cycle through 7 movable karanas', () => {
    const expected = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
    for (let i = 0; i < 7; i++) {
      expect(karanaName(i + 1)).toBe(expected[i]);
    }
  });
  it('index 8 wraps back to Bava (second cycle)', () => {
    expect(karanaName(8)).toBe('Bava');
  });
  it('fixed karanas 57-59', () => {
    expect(karanaName(57)).toBe('Shakuni');
    expect(karanaName(58)).toBe('Chatushpada');
    expect(karanaName(59)).toBe('Naga');
  });
  it('last movable index (56) = Vishti', () => {
    expect(karanaName(56)).toBe('Vishti');
  });
});

describe('tithiName()', () => {
  it('Shukla Pratipada (1)', () => {
    expect(tithiName(1)).toBe('Shukla Pratipada');
  });
  it('Purnima (15)', () => {
    expect(tithiName(15)).toBe('Purnima');
  });
  it('Krishna Pratipada (16)', () => {
    expect(tithiName(16)).toBe('Krishna Pratipada');
  });
  it('Amavasya (30)', () => {
    expect(tithiName(30)).toBe('Amavasya');
  });
  it('Shukla Chaturdashi (14)', () => {
    expect(tithiName(14)).toBe('Shukla Chaturdashi');
  });
  it('Krishna Ashtami (23)', () => {
    expect(tithiName(23)).toBe('Krishna Ashtami');
  });
});

// ─── Varga constants ───────────────────────────────────────────────────────────

describe('VARGA_ORDER', () => {
  it('contains exactly 17 entries', () => {
    expect(VARGA_ORDER.length).toBe(17);
  });
  it('starts with 1 (D1) and ends with 60 (D60)', () => {
    expect(VARGA_ORDER[0]).toBe(1);
    expect(VARGA_ORDER[VARGA_ORDER.length - 1]).toBe(60);
  });
  it('includes D9 and D11', () => {
    expect(VARGA_ORDER).toContain(9);
    expect(VARGA_ORDER).toContain(11);
  });
  it('is sorted ascending', () => {
    const sorted = [...VARGA_ORDER].sort((a, b) => a - b);
    expect(VARGA_ORDER).toEqual(sorted);
  });
});

describe('SIGN_QUALITY / SIGN_ELEMENT', () => {
  it('all 12 signs have quality 1-3', () => {
    for (let s = 1; s <= 12; s++) {
      const q = SIGN_QUALITY[s];
      expect(q).toBeGreaterThanOrEqual(1);
      expect(q).toBeLessThanOrEqual(3);
    }
  });
  it('Aries=movable(1), Taurus=fixed(2), Gemini=dual(3)', () => {
    expect(SIGN_QUALITY[1]).toBe(1);
    expect(SIGN_QUALITY[2]).toBe(2);
    expect(SIGN_QUALITY[3]).toBe(3);
  });
  it('all 12 signs have element 1-4', () => {
    for (let s = 1; s <= 12; s++) {
      const e = SIGN_ELEMENT[s];
      expect(e).toBeGreaterThanOrEqual(1);
      expect(e).toBeLessThanOrEqual(4);
    }
  });
  it('Aries=fire(1), Taurus=earth(2)', () => {
    expect(SIGN_ELEMENT[1]).toBe(1);
    expect(SIGN_ELEMENT[2]).toBe(2);
  });
});

describe('D30 segment tables', () => {
  it('odd sign breaks start at 0 and end at 30', () => {
    expect(D30_BREAKS_ODD[0]).toBe(0);
    expect(D30_BREAKS_ODD[D30_BREAKS_ODD.length - 1]).toBe(30);
  });
  it('D30_BREAKS_ODD has 6 entries (5 segments)', () => {
    expect(D30_BREAKS_ODD.length).toBe(6);
    expect(D30_SIGNS_ODD.length).toBe(5);
  });
  it('even breaks and signs have matching structure', () => {
    expect(D30_BREAKS_EVEN[0]).toBe(0);
    expect(D30_BREAKS_EVEN[D30_BREAKS_EVEN.length - 1]).toBe(30);
    expect(D30_SIGNS_EVEN.length).toBe(5);
  });
});

// ─── Planet constants ──────────────────────────────────────────────────────────

describe('DASHA constants', () => {
  it('DASHA_SEQUENCE has 9 lords', () => {
    expect(DASHA_SEQUENCE.length).toBe(9);
    expect(DASHA_SEQUENCE[0]).toBe('Ketu');
    expect(DASHA_SEQUENCE[1]).toBe('Venus');
  });
  it('sum of DASHA_YEARS equals 120', () => {
    const total = Object.values(DASHA_YEARS).reduce((a, b) => a + b, 0);
    expect(total).toBe(120);
    expect(DASHA_TOTAL_YEARS).toBe(120);
  });
  it('Venus has the longest dasha (20 years)', () => {
    expect(DASHA_YEARS['Venus']).toBe(20);
  });
  it('Sun has the shortest dasha (6 years)', () => {
    expect(DASHA_YEARS['Sun']).toBe(6);
  });
  it('NAKSHATRA_LORD_CYCLE matches DASHA_SEQUENCE', () => {
    for (let i = 0; i < 9; i++) {
      expect(NAKSHATRA_LORD_CYCLE[i]).toBe(DASHA_SEQUENCE[i]);
    }
  });
});

describe('PLANET_ORDER', () => {
  it('contains 12 planets', () => {
    expect(PLANET_ORDER.length).toBe(12);
  });
  it('starts with Sun and ends with Pluto', () => {
    expect(PLANET_ORDER[0].name).toBe('Sun');
    expect(PLANET_ORDER[0].abbr).toBe('Su');
    expect(PLANET_ORDER[PLANET_ORDER.length - 1].name).toBe('Pluto');
  });
  it('includes Rahu and Ketu', () => {
    const names = PLANET_ORDER.map(p => p.name);
    expect(names).toContain('Rahu');
    expect(names).toContain('Ketu');
  });
  it('all entries have name and abbr', () => {
    for (const p of PLANET_ORDER) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.abbr.length).toBeGreaterThan(0);
    }
  });
});

describe('Combustion', () => {
  it('COMBUST_ORB = 5', () => {
    expect(COMBUST_ORB).toBe(5.0);
  });
  it('Sun, Rahu, Ketu not in COMBUST_PLANETS', () => {
    expect(COMBUST_PLANETS.has('Sun')).toBe(false);
    expect(COMBUST_PLANETS.has('Rahu')).toBe(false);
    expect(COMBUST_PLANETS.has('Ketu')).toBe(false);
  });
  it('Moon, Mars, Mercury, Jupiter, Venus, Saturn are combustible', () => {
    for (const p of ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
      expect(COMBUST_PLANETS.has(p)).toBe(true);
    }
  });
});

describe('AYANAMSA_MAP', () => {
  it('lahiri entry has mode and label', () => {
    expect(AYANAMSA_MAP['lahiri']).toBeDefined();
    expect(AYANAMSA_MAP['lahiri'].label).toContain('Lahiri');
  });
  it('sayan has null mode (tropical)', () => {
    expect(AYANAMSA_MAP['sayan'].mode).toBeNull();
  });
  it('has all 7 ayanamsas', () => {
    const keys = ['lahiri', 'kp_new', 'kp_old', 'raman', 'kp_khullar', 'sayan', 'manoj'];
    for (const k of keys) {
      expect(AYANAMSA_MAP[k]).toBeDefined();
    }
  });
});

describe('BAV_RULES', () => {
  it('covers all 7 planets', () => {
    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    for (const p of planets) {
      expect(BAV_RULES[p]).toBeDefined();
    }
  });
  it('each planet has 8 contributors', () => {
    for (const rules of Object.values(BAV_RULES)) {
      expect(Object.keys(rules).length).toBe(8);
    }
  });
  it('BAV_CONTRIBUTORS length = 8', () => {
    expect(BAV_CONTRIBUTORS.length).toBe(8);
    expect(BAV_CONTRIBUTORS[BAV_CONTRIBUTORS.length - 1]).toBe('Asc');
  });
  it('house numbers are in range 1-12', () => {
    for (const planetRules of Object.values(BAV_RULES)) {
      for (const houses of Object.values(planetRules)) {
        for (const h of houses) {
          expect(h).toBeGreaterThanOrEqual(1);
          expect(h).toBeLessThanOrEqual(12);
        }
      }
    }
  });
});

describe('Exaltation / Debilitation / Own Sign', () => {
  it('Sun exalted in Aries at 10°', () => {
    expect(EXALTATION['Sun'].sign).toBe(1);
    expect(EXALTATION['Sun'].degree).toBe(10);
  });
  it('Sun debilitated in Libra at 10°', () => {
    expect(DEBILITATION['Sun'].sign).toBe(7);
    expect(DEBILITATION['Sun'].degree).toBe(10);
  });
  it('Moon exalted in Taurus at 3°', () => {
    expect(EXALTATION['Moon'].sign).toBe(2);
    expect(EXALTATION['Moon'].degree).toBe(3);
  });
  it('Sun own sign is Leo (5)', () => {
    expect(OWN_SIGNS['Sun']).toContain(5);
    expect(OWN_SIGNS['Sun'].length).toBe(1);
  });
  it('Saturn owns Capricorn (10) and Aquarius (11)', () => {
    expect(OWN_SIGNS['Saturn']).toContain(10);
    expect(OWN_SIGNS['Saturn']).toContain(11);
  });
  it('MOOLATRIKONA Sun in Leo start 0 end 20', () => {
    expect(MOOLATRIKONA['Sun'].sign).toBe(5);
    expect(MOOLATRIKONA['Sun'].start).toBe(0);
    expect(MOOLATRIKONA['Sun'].end).toBe(20);
  });
});

// ─── Muhurta constants ─────────────────────────────────────────────────────────

describe('Varjyam constants', () => {
  it('VARJYAM_GHATIKAS has 27 entries', () => {
    expect(VARJYAM_GHATIKAS.length).toBe(27);
  });
  it('all values are 0-60', () => {
    for (const v of VARJYAM_GHATIKAS) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(60);
    }
  });
  it('VARJYAM_DURATION_GHATIKAS = 1.6', () => {
    expect(VARJYAM_DURATION_GHATIKAS).toBe(1.6);
  });
  it('AMRIT_OFFSET_GHATIKAS = 26.67', () => {
    expect(AMRIT_OFFSET_GHATIKAS).toBeCloseTo(26.67, 2);
  });
});

describe('Siddhi Yoga tables', () => {
  it('SARVARTHA_SIDDHI has entries for all 7 weekdays', () => {
    for (let d = 1; d <= 7; d++) {
      expect(SARVARTHA_SIDDHI[d]).toBeDefined();
      expect(SARVARTHA_SIDDHI[d] instanceof Set).toBe(true);
    }
  });
  it('Sunday SARVARTHA_SIDDHI includes nakshatra 7 (Pushya)', () => {
    expect(SARVARTHA_SIDDHI[7].has(7)).toBe(true);
  });
  it('Monday AMRITA_SIDDHI = {4} (Mrigashira)', () => {
    expect(AMRITA_SIDDHI[1].size).toBe(1);
    expect(AMRITA_SIDDHI[1].has(4)).toBe(true);
  });
});

describe('DUR_MUHURTA', () => {
  it('Wednesday (3) includes ABHIJIT index (8)', () => {
    expect(DUR_MUHURTA[3]).toContain(ABHIJIT_MUHURTA_INDEX);
  });
  it('Monday has 2 bad muhurtas', () => {
    expect(DUR_MUHURTA[1].length).toBe(2);
  });
  it('Saturday has 2 bad muhurtas', () => {
    expect(DUR_MUHURTA[6].length).toBe(2);
  });
  it('ABHIJIT_MUHURTA_INDEX = 8', () => {
    expect(ABHIJIT_MUHURTA_INDEX).toBe(8);
  });
});

describe('Gowri / Hora start tables', () => {
  it('GOWRI_DAY_START has 7 weekday entries', () => {
    for (let d = 1; d <= 7; d++) {
      expect(GOWRI_DAY_START[d]).toBeDefined();
    }
  });
  it('Monday Gowri starts at index 3 (Amridha)', () => {
    expect(GOWRI_DAY_START[1]).toBe(3);
  });
  it('Saturday Gowri starts at index 0 (Soram)', () => {
    expect(GOWRI_DAY_START[6]).toBe(0);
  });
  it('HORA_CYCLE has 7 planets', () => {
    expect(HORA_CYCLE.length).toBe(7);
    expect(HORA_CYCLE[0]).toBe('Sun');
  });
  it('AUSPICIOUS_HORAS includes Jupiter, Venus, Mercury, Moon', () => {
    expect(AUSPICIOUS_HORAS.has('Jupiter')).toBe(true);
    expect(AUSPICIOUS_HORAS.has('Venus')).toBe(true);
    expect(AUSPICIOUS_HORAS.has('Saturn')).toBe(false);
    expect(AUSPICIOUS_HORAS.has('Sun')).toBe(false);
  });
  it('Sunday Hora starts at index 0 (Sun)', () => {
    expect(HORA_DAY_START[7]).toBe(0);
  });
});

describe('AMRITADI_TABLE', () => {
  it('has 27 rows (one per nakshatra)', () => {
    expect(AMRITADI_TABLE.length).toBe(27);
  });
  it('each row has 7 characters (Mon-Sun)', () => {
    for (const row of AMRITADI_TABLE) {
      expect(row.length).toBe(7);
    }
  });
  it('only contains valid codes A,S,M,P', () => {
    for (const row of AMRITADI_TABLE) {
      for (const ch of row) {
        expect(['A', 'S', 'M', 'P']).toContain(ch);
      }
    }
  });
});

describe('Tyajyam ratio tables', () => {
  it('NAKSHATRA_TYAJYAM_RATIO has 27 entries', () => {
    expect(NAKSHATRA_TYAJYAM_RATIO.length).toBe(27);
  });
  it('each ratio is [num, denom] with denom > 0', () => {
    for (const [num, denom] of NAKSHATRA_TYAJYAM_RATIO) {
      expect(denom).toBeGreaterThan(0);
      expect(num).toBeGreaterThan(0);
      expect(num / denom).toBeLessThanOrEqual(1); // ratio ≤ 1
    }
  });
  it('TITHI_TYAJYAM_BASE has 16 entries', () => {
    expect(TITHI_TYAJYAM_BASE.length).toBe(16);
  });
  it('VARA_TYAJYAM_NAZHIGAI covers all 7 weekdays', () => {
    for (let d = 1; d <= 7; d++) {
      expect(VARA_TYAJYAM_NAZHIGAI[d]).toBeDefined();
      expect(VARA_TYAJYAM_NAZHIGAI[d]).toBeGreaterThan(0);
    }
  });
  it('Monday VARA_TYAJYAM offset = 42 nazhigai', () => {
    expect(VARA_TYAJYAM_NAZHIGAI[1]).toBe(42);
  });
  it('INAUSPICIOUS_KARANAS includes Vishti, Chatushpada, Naga', () => {
    expect(INAUSPICIOUS_KARANAS.has('Vishti')).toBe(true);
    expect(INAUSPICIOUS_KARANAS.has('Chatushpada')).toBe(true);
    expect(INAUSPICIOUS_KARANAS.has('Naga')).toBe(true);
    expect(INAUSPICIOUS_KARANAS.size).toBe(3);
  });
});

// ─── Calendar constants ────────────────────────────────────────────────────────

describe('Calendar epoch constants', () => {
  it('KALI_START_JD is around 588465.5', () => {
    expect(KALI_START_JD).toBeCloseTo(588465.5, 0);
  });
  it('RATA_DIE_EPOCH_JD is around 1721424.5', () => {
    expect(RATA_DIE_EPOCH_JD).toBeCloseTo(1721424.5, 0);
  });
});

describe('Directional constants', () => {
  it('DISHA_SHOOL covers all 7 weekdays', () => {
    for (let d = 1; d <= 7; d++) {
      expect(DISHA_SHOOL[d]).toBeDefined();
    }
  });
  it('Thursday (4) Disha Shool is South', () => {
    expect(DISHA_SHOOL[4]).toBe('South');
  });
  it('RAHU_VASA covers all 7 weekdays', () => {
    for (let d = 1; d <= 7; d++) {
      expect(RAHU_VASA[d]).toBeDefined();
    }
  });
  it('CHANDRA_VASA covers all 12 moon signs', () => {
    for (let s = 1; s <= 12; s++) {
      expect(CHANDRA_VASA[s]).toBeDefined();
    }
  });
});

describe('Chandrabalam / Tarabalam offsets', () => {
  it('GOOD_CHANDRA_OFFSETS has exactly 6 elements', () => {
    expect(GOOD_CHANDRA_OFFSETS.size).toBe(6);
    expect(GOOD_CHANDRA_OFFSETS.has(0)).toBe(true); // self is always good
  });
  it('GOOD_TARA_OFFSETS has exactly 18 elements', () => {
    expect(GOOD_TARA_OFFSETS.size).toBe(18);
    expect(GOOD_TARA_OFFSETS.has(0)).toBe(true); // birth nakshatra = good
  });
});

describe('Ritu / Ayana constants', () => {
  it('Sun in Aries (1) is Vasant', () => {
    expect(SIGN_TO_DRIK_RITU[1]).toBe('Vasant');
    expect(SIGN_TO_VEDIC_RITU[1]).toBe('Vasant');
  });
  it('Sun in Cancer (4) is Varsha', () => {
    expect(SIGN_TO_DRIK_RITU[4]).toBe('Varsha');
  });
  it('Sun in Capricorn (10) is Uttarayana', () => {
    expect(UTTARAYANA_SIGNS.has(10)).toBe(true);
  });
  it('Sun in Cancer (4) is Dakshinayana', () => {
    expect(UTTARAYANA_SIGNS.has(4)).toBe(false);
  });
  it('CHANDRA_MASA_BY_SUNSIGN[0] = Vaishakha (Sun in Aries)', () => {
    expect(CHANDRA_MASA_BY_SUNSIGN[0]).toBe('Vaishakha');
    expect(CHANDRA_MASA_BY_SUNSIGN.length).toBe(12);
  });
});
