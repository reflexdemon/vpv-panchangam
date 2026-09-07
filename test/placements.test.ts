import { describe, it, expect } from 'vitest';
import {
  isExalted, isDebilitated, isOwnSign, isMoolatrikona,
  isVargottama, isDigbala, isPushkaraBhaga, isPushkaraNavamsa,
  isMrityuBhaga, isGandanta, isCombust,
  isNeechaBhanga, computeParivartana, computeGrahaYuddha,
  applySpecialPlacements,
} from '../src/calculations/placements';
import type { PlanetPosition } from '../src/types';

function makePlanet(name: string, abbr: string, signId: number, lon: number, house = 1): PlanetPosition {
  return {
    name, abbr, longitude: lon, sign_id: signId, sign: '', sign_lord: '',
    degree_in_sign: lon - (signId - 1) * 30, dms: '', nakshatra: '', nakshatra_pada: 1,
    nakshatra_lord: '', retrograde: false, combust: false, house,
    exalted: false, debilitated: false, own_sign: false, moolatrikona: false,
    vargottama: false, digbala: false, pushkara_bhaga: false, pushkara_navamsa: false,
    mrityu_bhaga: false, gandanta: false, neecha_bhanga: false,
    parivartana: false, parivartana_with: null, graha_yuddha: false, graha_yuddha_with: null,
  };
}

// ─── Exaltation ───────────────────────────────────────────────────────────────

describe('isExalted', () => {
  it('Sun exalted in Aries at 10°', () => {
    expect(isExalted('Sun', 1, 10)).toBe(true);
  });
  it('Sun not exalted at 12° (beyond 1° orb)', () => {
    expect(isExalted('Sun', 1, 12)).toBe(false);
  });
  it('Sun not exalted in wrong sign', () => {
    expect(isExalted('Sun', 5, 10)).toBe(false);
  });
  it('Moon exalted in Taurus at 3°', () => {
    expect(isExalted('Moon', 2, 3)).toBe(true);
  });
  it('Jupiter exalted in Cancer at 5°', () => {
    expect(isExalted('Jupiter', 4, 5)).toBe(true);
  });
  it('Saturn exalted in Libra at 20°', () => {
    expect(isExalted('Saturn', 7, 20)).toBe(true);
  });
  it('Rahu is handled (Taurus at 0°)', () => {
    expect(isExalted('Rahu', 2, 0)).toBe(true);
  });
  it('unknown planet returns false', () => {
    expect(isExalted('Pluto', 1, 10)).toBe(false);
  });
});

// ─── Debilitation ─────────────────────────────────────────────────────────────

describe('isDebilitated', () => {
  it('Sun debilitated in Libra at 10°', () => {
    expect(isDebilitated('Sun', 7, 10)).toBe(true);
  });
  it('Moon debilitated in Scorpio at 3°', () => {
    expect(isDebilitated('Moon', 8, 3)).toBe(true);
  });
  it('Mars debilitated in Cancer at 28°', () => {
    expect(isDebilitated('Mars', 4, 28)).toBe(true);
  });
  it('not debilitated in correct sign but wrong degree', () => {
    expect(isDebilitated('Sun', 7, 20)).toBe(false);
  });
  it('not debilitated in wrong sign', () => {
    expect(isDebilitated('Sun', 1, 10)).toBe(false);
  });
});

// ─── Own Sign ─────────────────────────────────────────────────────────────────

describe('isOwnSign', () => {
  it('Sun in Leo (5)', () => {
    expect(isOwnSign('Sun', 5)).toBe(true);
  });
  it('Moon in Cancer (4)', () => {
    expect(isOwnSign('Moon', 4)).toBe(true);
  });
  it('Mars in Aries (1) and Scorpio (8)', () => {
    expect(isOwnSign('Mars', 1)).toBe(true);
    expect(isOwnSign('Mars', 8)).toBe(true);
  });
  it('Saturn in Capricorn (10) and Aquarius (11)', () => {
    expect(isOwnSign('Saturn', 10)).toBe(true);
    expect(isOwnSign('Saturn', 11)).toBe(true);
  });
  it('Sun not in Aries', () => {
    expect(isOwnSign('Sun', 1)).toBe(false);
  });
});

// ─── Moolatrikona ─────────────────────────────────────────────────────────────

describe('isMoolatrikona', () => {
  it('Sun in Leo (5) at 10° — within 0-20°', () => {
    expect(isMoolatrikona('Sun', 5, 10)).toBe(true);
  });
  it('Sun in Leo at 21° — outside 0-20° range', () => {
    expect(isMoolatrikona('Sun', 5, 21)).toBe(false);
  });
  it('Sun not in moolatrikona sign', () => {
    expect(isMoolatrikona('Sun', 1, 10)).toBe(false);
  });
  it('Moon in Taurus (2) at 10° — within 4-30°', () => {
    expect(isMoolatrikona('Moon', 2, 10)).toBe(true);
  });
  it('Moon in Taurus at 3° — before 4° start', () => {
    expect(isMoolatrikona('Moon', 2, 3)).toBe(false);
  });
  it('Saturn in Aquarius (11) at 10° — within 0-20°', () => {
    expect(isMoolatrikona('Saturn', 11, 10)).toBe(true);
  });
});

// ─── Vargottama ───────────────────────────────────────────────────────────────

describe('isVargottama', () => {
  it('returns boolean', () => {
    expect(typeof isVargottama(0)).toBe('boolean');
  });
  it('longitude 0° (Aries D1, D9 both sign 1) → true', () => {
    // lon=0: D1=1, D9=1 → vargottama
    expect(isVargottama(0)).toBe(true);
  });
  it('longitude 3.5° (D1=Aries=1, D9=2?) → check', () => {
    const d1 = Math.floor(3.5 / 30) + 1; // 1
    const d9 = Math.floor((3.5 * 9) % 360 / 30) + 1; // floor(31.5/30)+1 = 2
    expect(isVargottama(3.5)).toBe(d1 === d9);
  });
});

// ─── Digbala ──────────────────────────────────────────────────────────────────

describe('isDigbala', () => {
  it('Sun in Capricorn (10) has digbala', () => {
    expect(isDigbala('Sun', 10)).toBe(true);
  });
  it('Moon in Cancer (4) has digbala', () => {
    expect(isDigbala('Moon', 4)).toBe(true);
  });
  it('Jupiter in Aries (1) has digbala', () => {
    expect(isDigbala('Jupiter', 1)).toBe(true);
  });
  it('Saturn in Libra (7) has digbala', () => {
    expect(isDigbala('Saturn', 7)).toBe(true);
  });
  it('Sun in Aries — no digbala', () => {
    expect(isDigbala('Sun', 1)).toBe(false);
  });
});

// ─── Combustion ───────────────────────────────────────────────────────────────

describe('isCombust', () => {
  it('Moon within 5° of Sun is combust', () => {
    expect(isCombust('Moon', 5, 0)).toBe(true);
    expect(isCombust('Moon', 4, 0)).toBe(true);
  });
  it('Moon more than 5° from Sun is not combust', () => {
    expect(isCombust('Moon', 6, 0)).toBe(false);
    expect(isCombust('Moon', 10, 0)).toBe(false);
  });
  it('Sun is never combust', () => {
    expect(isCombust('Sun', 0, 0)).toBe(false);
  });
  it('Rahu is never combust', () => {
    expect(isCombust('Rahu', 1, 0)).toBe(false);
  });
  it('Ketu is never combust', () => {
    expect(isCombust('Ketu', 1, 0)).toBe(false);
  });
  it('Mercury combust at 3° from Sun', () => {
    expect(isCombust('Mercury', 3, 0)).toBe(true);
  });
  it('handles 360→0 wrap (Mercury at 357° with Sun at 2°)', () => {
    expect(isCombust('Mercury', 357, 2)).toBe(true);
  });
});

// ─── Gandanta ─────────────────────────────────────────────────────────────────

describe('isGandanta', () => {
  it('Aries start (sign 1) within first 3.2° is gandanta', () => {
    expect(isGandanta(1, 2)).toBe(true);
    expect(isGandanta(1, 3.1)).toBe(true);
  });
  it('Aries at 5° is not gandanta', () => {
    expect(isGandanta(1, 5)).toBe(false);
  });
  it('Cancer (4) end — last 3.2° is gandanta', () => {
    expect(isGandanta(4, 28)).toBe(true);
    expect(isGandanta(4, 29.9)).toBe(true);
  });
  it('Cancer at 25° is not gandanta', () => {
    expect(isGandanta(4, 25)).toBe(false);
  });
  it('Leo (5) start is gandanta', () => {
    expect(isGandanta(5, 1)).toBe(true);
  });
  it('Taurus is never gandanta', () => {
    expect(isGandanta(2, 0)).toBe(false);
    expect(isGandanta(2, 15)).toBe(false);
  });
});

// ─── Pushkara ─────────────────────────────────────────────────────────────────

describe('isPushkaraBhaga', () => {
  it('Aries (1) at degree 21 is pushkara bhaga', () => {
    expect(isPushkaraBhaga(1, 21)).toBe(true);
  });
  it('Aries at degree 20 is not', () => {
    expect(isPushkaraBhaga(1, 20)).toBe(false);
  });
  it('Taurus (2) at degree 14', () => {
    expect(isPushkaraBhaga(2, 14)).toBe(true);
  });
});

// ─── Neecha Bhanga ────────────────────────────────────────────────────────────

describe('isNeechaBhanga', () => {
  it('Sun debilitated in Libra; if debilitation lord (Venus) is in kendra, cancels', () => {
    // DEBILITATION.Sun = { sign:7 }. Lord of sign 7 (Libra) = Venus.
    // Place Venus in sign 7 (house 1 from Libra asc → kendra)
    const planetSigns: Record<string, number> = { Ve: 7 }; // Venus in Libra = house 1 from Libra asc
    const result = isNeechaBhanga('Sun', 7, planetSigns, 7);
    expect(result).toBe(true);
  });
  it('returns false when planet is not debilitated', () => {
    const result = isNeechaBhanga('Sun', 1, { Ve: 1 }, 1); // Sun in Aries = not debilitated
    expect(result).toBe(false);
  });
});

// ─── Parivartana ─────────────────────────────────────────────────────────────

describe('computeParivartana', () => {
  it('Sun in Capricorn + Saturn in Leo → mutual exchange', () => {
    // Sun own sign = Leo (5); Saturn own signs = Capricorn(10), Aquarius(11)
    // Sun in Capricorn (10) = Saturn's sign; Saturn in Leo (5) = Sun's sign → parivartana
    const result = computeParivartana({ Su: 10, Sa: 5 });
    expect(result['Su']).toBe('Sa');
    expect(result['Sa']).toBe('Su');
  });
  it('no exchange when not in each other\'s signs', () => {
    const result = computeParivartana({ Su: 1, Sa: 2 }); // Aries and Taurus — no exchange
    expect(result['Su']).toBeNull();
    expect(result['Sa']).toBeNull();
  });
  it('returns null for unrelated planets', () => {
    const result = computeParivartana({ Su: 3, Mo: 3 }); // Both in Gemini
    expect(result['Su']).toBeNull();
  });
});

// ─── Graha Yuddha ─────────────────────────────────────────────────────────────

describe('computeGrahaYuddha', () => {
  it('Mars and Jupiter within 0.5° → planetary war', () => {
    const result = computeGrahaYuddha([
      { abbr: 'Ma', lon: 45.0, lat: 0 },
      { abbr: 'Ju', lon: 45.4, lat: 0 },
    ]);
    expect(result['Ma']).toBe('Ju');
    expect(result['Ju']).toBe('Ma');
  });
  it('planets more than 1° apart → no war', () => {
    const result = computeGrahaYuddha([
      { abbr: 'Ma', lon: 45.0, lat: 0 },
      { abbr: 'Ju', lon: 46.5, lat: 0 },
    ]);
    expect(result['Ma']).toBeNull();
  });
  it('Sun and Moon are not eligible for yuddha', () => {
    const result = computeGrahaYuddha([
      { abbr: 'Su', lon: 0, lat: 0 },
      { abbr: 'Mo', lon: 0.5, lat: 0 },
    ]);
    expect(result['Su']).toBeNull();
    expect(result['Mo']).toBeNull();
  });
});

// ─── applySpecialPlacements ───────────────────────────────────────────────────

describe('applySpecialPlacements', () => {
  it('marks Sun exalted when in Aries at 10°', () => {
    const positions: PlanetPosition[] = [
      makePlanet('Sun', 'Su', 1, 10), // sign 1 = Aries, deg 10
    ];
    applySpecialPlacements(positions, 1, 10);
    expect(positions[0].exalted).toBe(true);
    expect(positions[0].debilitated).toBe(false);
  });

  it('marks Sun combust for Moon within 5° of Sun', () => {
    // Moon at lon 14, Sun at lon 10 → diff = 4° < 5
    const positions: PlanetPosition[] = [
      makePlanet('Sun', 'Su', 1, 10),
      makePlanet('Moon', 'Mo', 1, 14),
    ];
    applySpecialPlacements(positions, 1, 10);
    const moon = positions.find(p => p.name === 'Moon')!;
    expect(moon.combust).toBe(true);
  });

  it('marks Moon own sign in Cancer (4)', () => {
    const positions: PlanetPosition[] = [
      makePlanet('Moon', 'Mo', 4, 100), // Cancer = sign 4, lon 100
    ];
    applySpecialPlacements(positions, 4, 0);
    expect(positions[0].own_sign).toBe(true);
  });

  it('returns the same array (mutates in place)', () => {
    const positions: PlanetPosition[] = [makePlanet('Sun', 'Su', 1, 10)];
    const returned = applySpecialPlacements(positions, 1, 10);
    expect(returned).toBe(positions);
  });
});
