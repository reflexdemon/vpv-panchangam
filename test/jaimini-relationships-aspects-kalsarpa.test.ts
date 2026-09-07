import { describe, it, expect } from 'vitest';
import { computeKarakas, computeKarakamsa } from '../src/calculations/jaimini';
import {
  computeTemporalFriendships, computeCompositeRelationship, computeFriendships,
} from '../src/calculations/relationships';
import { computeAspects } from '../src/calculations/aspects';
import { computeKalsarpa } from '../src/calculations/kalsarpa';
import type { PlanetPosition } from '../src/types';

// ─── Helper to build a minimal PlanetPosition ─────────────────────────────────

function makePlanet(name: string, abbr: string, lon: number, house = 1): PlanetPosition {
  const signId = Math.floor(lon / 30) + 1;
  const degInSign = lon - (signId - 1) * 30;
  return {
    name, abbr, longitude: lon, sign_id: signId, sign: '', sign_lord: '',
    degree_in_sign: degInSign, dms: '', nakshatra: '', nakshatra_pada: 1,
    nakshatra_lord: '', retrograde: false, combust: false, house,
    exalted: false, debilitated: false, own_sign: false, moolatrikona: false,
    vargottama: false, digbala: false, pushkara_bhaga: false, pushkara_navamsa: false,
    mrityu_bhaga: false, gandanta: false, neecha_bhanga: false,
    parivartana: false, parivartana_with: null, graha_yuddha: false, graha_yuddha_with: null,
  };
}

// ─── Jaimini Karakas ──────────────────────────────────────────────────────────

describe('computeKarakas', () => {
  // Create 7 eligible planets with distinct degree_in_sign
  const positions: PlanetPosition[] = [
    makePlanet('Sun',     'Su', 28.5),  // deg 28.5 → highest → AK
    makePlanet('Moon',    'Mo', 25.0),
    makePlanet('Mars',    'Ma', 20.0),
    makePlanet('Mercury', 'Me', 15.5),
    makePlanet('Jupiter', 'Ju', 10.0),
    makePlanet('Venus',   'Ve', 5.0),
    makePlanet('Saturn',  'Sa', 1.0),   // lowest → DK
    // Rahu / Ketu excluded
    makePlanet('Rahu',    'Ra', 12.0),
    makePlanet('Ketu',    'Ke', 22.0),
  ];

  const namesFn = (id: number) => `Sign${id}`;
  const karakas = computeKarakas(positions, namesFn);

  it('returns exactly 7 karakas', () => {
    expect(karakas.length).toBe(7);
  });

  it('AK has rank 1 and highest degree_in_sign', () => {
    expect(karakas[0].rank).toBe(1);
    expect(karakas[0].abbr).toBe('AK');
    expect(karakas[0].planet).toBe('Sun');
    expect(karakas[0].degree_in_sign).toBeCloseTo(28.5, 2);
  });

  it('DK has rank 7 and lowest degree_in_sign', () => {
    expect(karakas[6].rank).toBe(7);
    expect(karakas[6].abbr).toBe('DK');
    expect(karakas[6].planet).toBe('Saturn');
  });

  it('ranks are 1-7 in order', () => {
    for (let i = 0; i < 7; i++) {
      expect(karakas[i].rank).toBe(i + 1);
    }
  });

  it('abbrs are AK AmK BK MK PK GK DK', () => {
    const expected = ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'];
    expect(karakas.map(k => k.abbr)).toEqual(expected);
  });

  it('title of rank 1 is Atmakaraka', () => {
    expect(karakas[0].title).toBe('Atmakaraka');
  });

  it('title of rank 7 is Darakaraka', () => {
    expect(karakas[6].title).toBe('Darakaraka');
  });

  it('does not include Rahu or Ketu', () => {
    const planetNames = karakas.map(k => k.planet);
    expect(planetNames).not.toContain('Rahu');
    expect(planetNames).not.toContain('Ketu');
  });

  it('each karaka has a valid sign_id (1-12)', () => {
    for (const k of karakas) {
      expect(k.sign_id).toBeGreaterThanOrEqual(1);
      expect(k.sign_id).toBeLessThanOrEqual(12);
    }
  });

  it('each karaka has a dms string', () => {
    for (const k of karakas) {
      expect(k.dms).toMatch(/\d+° \d+' \d+"/);
    }
  });
});

// ─── Relationships ────────────────────────────────────────────────────────────

describe('computeCompositeRelationship', () => {
  it('F + F → GF', () => expect(computeCompositeRelationship('F', 'F')).toBe('GF'));
  it('F + N → F',  () => expect(computeCompositeRelationship('F', 'N')).toBe('F'));
  it('N + F → F',  () => expect(computeCompositeRelationship('N', 'F')).toBe('F'));
  it('F + E → N',  () => expect(computeCompositeRelationship('F', 'E')).toBe('N'));
  it('E + F → N',  () => expect(computeCompositeRelationship('E', 'F')).toBe('N'));
  it('N + E → E',  () => expect(computeCompositeRelationship('N', 'E')).toBe('E'));
  it('E + E → GE', () => expect(computeCompositeRelationship('E', 'E')).toBe('GE'));
  it('N + N → N',  () => expect(computeCompositeRelationship('N', 'N')).toBe('N'));
});

describe('computeTemporalFriendships', () => {
  const signs: Record<string, number> = {
    Sun: 1, Moon: 4, Mars: 7, Mercury: 10, Jupiter: 3, Venus: 6, Saturn: 9,
  };
  const temporal = computeTemporalFriendships(signs);

  it('covers all 7 planets as keys', () => {
    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    for (const p of planets) {
      expect(temporal[p]).toBeDefined();
    }
  });

  it('self-relationship is always N', () => {
    for (const [planet, rels] of Object.entries(temporal)) {
      expect(rels[planet]).toBe('N');
    }
  });

  it('all values are F or E (or N for self)', () => {
    for (const rels of Object.values(temporal)) {
      for (const val of Object.values(rels)) {
        expect(['F', 'E', 'N']).toContain(val);
      }
    }
  });

  it('friendships are not symmetric by default (temporal can differ)', () => {
    // This is just structural — we verify the map is fully populated
    for (const rels of Object.values(temporal)) {
      expect(Object.keys(rels).length).toBe(7);
    }
  });
});

describe('computeFriendships', () => {
  const signs: Record<string, number> = {
    Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7,
  };
  const friendships = computeFriendships(signs);

  it('has natural, temporal, composite tables', () => {
    expect(friendships.natural).toBeDefined();
    expect(friendships.temporal).toBeDefined();
    expect(friendships.composite).toBeDefined();
  });

  it('Sun and Moon are natural friends', () => {
    expect(friendships.natural['Sun']['Moon']).toBe('F');
  });

  it('Sun and Venus are natural enemies', () => {
    expect(friendships.natural['Sun']['Venus']).toBe('E');
  });

  it('Jupiter and Mercury are natural enemies', () => {
    expect(friendships.natural['Jupiter']['Mercury']).toBe('E');
  });

  it('composite values are GF, F, N, E, or GE', () => {
    for (const rels of Object.values(friendships.composite)) {
      for (const val of Object.values(rels)) {
        expect(['GF', 'F', 'N', 'E', 'GE']).toContain(val);
      }
    }
  });
});

// ─── Aspects ──────────────────────────────────────────────────────────────────

describe('computeAspects', () => {
  const positions = [
    { name: 'Sun',    abbr: 'Su', house: 1, sign_id: 1, retrograde: false, combust: false },
    { name: 'Moon',   abbr: 'Mo', house: 3, sign_id: 3, retrograde: false, combust: false },
    { name: 'Mars',   abbr: 'Ma', house: 1, sign_id: 1, retrograde: false, combust: false },
    { name: 'Jupiter','abbr': 'Ju', house: 5, sign_id: 5, retrograde: false, combust: false },
    { name: 'Saturn', abbr: 'Sa', house: 2, sign_id: 2, retrograde: false, combust: false },
  ];

  const result = computeAspects(positions);

  it('returns aspects, by_planet, mutual', () => {
    expect(result.aspects).toBeDefined();
    expect(result.by_planet).toBeDefined();
    expect(result.mutual).toBeDefined();
  });

  it('all aspects are AspectEdge objects with required fields', () => {
    for (const edge of result.aspects) {
      expect(edge.planet).toBeDefined();
      expect(edge.from_house).toBeGreaterThanOrEqual(1);
      expect(edge.to_house).toBeGreaterThanOrEqual(1);
      expect(['standard', 'special']).toContain(edge.aspect_type);
      expect(edge.strength).toBeGreaterThan(0);
    }
  });

  it('Sun (house 1) aspects only house 7 (standard only)', () => {
    const sunEntry = result.by_planet['Su']!;
    expect(sunEntry.aspected_houses).toContain(7);
    expect(sunEntry.aspected_houses.length).toBe(1);
  });

  it('Mars (house 1) aspects houses 4, 7, 8', () => {
    const marsEntry = result.by_planet['Ma']!;
    expect(marsEntry.aspected_houses).toContain(4);
    expect(marsEntry.aspected_houses).toContain(7);
    expect(marsEntry.aspected_houses).toContain(8);
    expect(marsEntry.aspected_houses.length).toBe(3);
  });

  it('Jupiter (house 5) aspects houses 9, 11, 1', () => {
    const jupEntry = result.by_planet['Ju']!;
    expect(jupEntry.aspected_houses).toContain(9);
    expect(jupEntry.aspected_houses).toContain(11);
    expect(jupEntry.aspected_houses).toContain(1);
  });

  it('Saturn (house 2) aspects houses 4, 8, 11', () => {
    const satEntry = result.by_planet['Sa']!;
    expect(satEntry.aspected_houses).toContain(4);
    expect(satEntry.aspected_houses).toContain(8);
    expect(satEntry.aspected_houses).toContain(11);
  });

  it('Jupiter is benefic', () => {
    expect(result.by_planet['Ju']!.benefic).toBe(true);
  });

  it('Mars is not benefic', () => {
    expect(result.by_planet['Ma']!.benefic).toBe(false);
  });

  it('all aspected_houses are in range 1-12', () => {
    for (const entry of Object.values(result.by_planet)) {
      for (const h of entry.aspected_houses) {
        expect(h).toBeGreaterThanOrEqual(1);
        expect(h).toBeLessThanOrEqual(12);
      }
    }
  });

  it('strength is 100 for 7th house aspect, 75 for special', () => {
    const standardEdge = result.aspects.find(e => e.aspect_type === 'standard');
    expect(standardEdge?.strength).toBe(100);
    const specialEdge = result.aspects.find(e => e.aspect_type === 'special');
    if (specialEdge) expect(specialEdge.strength).toBe(75);
  });
});

// ─── Kalsarpa ─────────────────────────────────────────────────────────────────

describe('computeKalsarpa', () => {
  it('returns false when Rahu/Ketu missing', () => {
    const result = computeKalsarpa({ Sun: 10, Moon: 50 }, 1, 7);
    expect(result.present).toBe(false);
  });

  it('no kalsarpa when planets are scattered on both sides', () => {
    const lons: Record<string, number> = {
      Rahu: 0, Ketu: 180,
      Sun: 90, Moon: 45,   // on forward arc Rahu→Ketu
      Mars: 270,           // on reverse arc Ketu→Rahu — breaks kalsarpa
      Mercury: 50, Jupiter: 60, Venus: 70, Saturn: 80,
    };
    const result = computeKalsarpa(lons, 1, 7);
    expect(result.present).toBe(false);
  });

  it('kalsarpa present when all planets on forward arc', () => {
    // Rahu=0, Ketu=180; all visible planets between 1° and 179°
    const lons: Record<string, number> = {
      Rahu: 0, Ketu: 180,
      Sun: 10, Moon: 30, Mars: 50, Mercury: 80, Jupiter: 100, Venus: 130, Saturn: 160,
    };
    const result = computeKalsarpa(lons, 1, 7);
    expect(result.present).toBe(true);
    expect(result.direction).toBe('Forward (Rahu leading)');
  });

  it('kalsarpa present when all planets on reverse arc', () => {
    // Rahu=0, Ketu=180; all visible planets between 181° and 359°
    const lons: Record<string, number> = {
      Rahu: 0, Ketu: 180,
      Sun: 200, Moon: 220, Mars: 240, Mercury: 260, Jupiter: 280, Venus: 300, Saturn: 350,
    };
    const result = computeKalsarpa(lons, 1, 7);
    expect(result.present).toBe(true);
    expect(result.direction).toBe('Reverse (Ketu leading)');
  });

  it('kind is determined by rahu_house', () => {
    const lons: Record<string, number> = {
      Rahu: 0, Ketu: 180,
      Sun: 10, Moon: 30, Mars: 50, Mercury: 80, Jupiter: 100, Venus: 130, Saturn: 160,
    };
    const result = computeKalsarpa(lons, 1, 7);
    expect(result.kind).toBe('Anant');      // rahu_house=1 → index 0 → Anant
    expect(result.rahu_house).toBe(1);
    expect(result.ketu_house).toBe(7);
  });

  it('verdict string includes the kind name', () => {
    const lons: Record<string, number> = {
      Rahu: 0, Ketu: 180,
      Sun: 10, Moon: 30, Mars: 50, Mercury: 80, Jupiter: 100, Venus: 130, Saturn: 160,
    };
    const result = computeKalsarpa(lons, 1, 7);
    expect(result.verdict).toContain('Anant');
  });

  it('rahu_house=2 → kind=Kulik', () => {
    const lons: Record<string, number> = {
      Rahu: 0, Ketu: 180,
      Sun: 10, Moon: 30, Mars: 50, Mercury: 80, Jupiter: 100, Venus: 130, Saturn: 160,
    };
    const result = computeKalsarpa(lons, 2, 8);
    expect(result.kind).toBe('Kulik');
  });
});
