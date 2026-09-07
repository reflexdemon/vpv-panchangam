import { describe, it, expect } from 'vitest';
import { getLocaleTable, resolveName, resolveNamedEntity, en, hi, ta } from '../src/locales';

describe('Locale tables — en', () => {
  const table = getLocaleTable('en');

  it('has correct code and label', () => {
    expect(table.code).toBe('en');
    expect(table.label).toBe('English');
  });

  it('has 27 nakshatras', () => {
    expect(table.nakshatras.length).toBe(27);
    expect(table.nakshatras[0]).toBe('Ashwini');
    expect(table.nakshatras[26]).toBe('Revati');
  });

  it('has 30 tithis with empty slot at index 0', () => {
    // total array length = 30 (indices 0..29; 0 is empty placeholder)
    expect(table.tithis[0]).toBe('');
    expect(table.tithis[1]).toBe('Pratipada');
    expect(table.tithis[15]).toBe('Purnima');
    expect(table.tithis[29]).toBe('Amavasya');
  });

  it('has 12 rashis and signs', () => {
    expect(table.rashis.length).toBe(12);
    expect(table.signs.length).toBe(12);
    expect(table.rashis[0]).toBe('Mesha');
    expect(table.signs[0]).toBe('Aries');
    expect(table.signs[11]).toBe('Pisces');
  });

  it('has 27 yogas', () => {
    expect(table.yogas.length).toBe(27);
    expect(table.yogas[0]).toBe('Vishkumbha');
    expect(table.yogas[26]).toBe('Vaidhriti');
  });

  it('has 7 movable karanas', () => {
    expect(table.movableKaranas.length).toBe(7);
    expect(table.movableKaranas[0]).toBe('Bava');
    expect(table.movableKaranas[6]).toBe('Vishti');
  });

  it('has 12 sign lords', () => {
    expect(table.signLords.length).toBe(12);
    expect(table.signLords[0]).toBe('Mars');   // Aries
    expect(table.signLords[4]).toBe('Sun');    // Leo
  });

  it('has 9 nakshatra lords', () => {
    expect(table.nakshatraLords.length).toBe(9);
    expect(table.nakshatraLords[0]).toBe('Ketu');
    expect(table.nakshatraLords[8]).toBe('Mercury');
  });

  it('has 8 vara entries (1-indexed, index 0 empty)', () => {
    expect(table.varas[0]).toBe('');
    expect(table.varas[1]).toBe('Somavara');
    expect(table.varas[7]).toBe('Ravivara');
    expect(table.varaEnglish[7]).toBe('Sunday');
  });

  it('has 60 samvatsaras', () => {
    expect(table.samvatsaras.length).toBe(60);
    expect(table.samvatsaras[0]).toBe('Prabhava');
    expect(table.samvatsaras[59]).toBe('Akshaya');
  });

  it('has 12 chandramasa entries', () => {
    expect(table.chandraMasa.length).toBe(12);
    expect(table.chandraMasa[0]).toBe('Chaitra');
  });

  it('has correct vargaNames for key vargas', () => {
    expect(table.vargaNames[1]).toBe('Rashi');
    expect(table.vargaNames[9]).toBe('Navamsa');
    expect(table.vargaNames[60]).toBe('Shashtyamsa');
    expect(Object.keys(table.vargaNames).length).toBe(17);
  });

  it('has correct vargaSubtitles', () => {
    expect(table.vargaSubtitles[1]).toBe('Physical Self / Body');
    expect(table.vargaSubtitles[9]).toBe('Spouse / Dharma');
    expect(Object.keys(table.vargaSubtitles).length).toBe(17);
  });

  it('has 8 gowri names', () => {
    expect(table.gowriNames.length).toBe(8);
    expect(table.gowriNames[0]).toBe('Soram');
    expect(table.gowriNames[3]).toBe('Amridha');
  });

  it('has 7 karaka titles', () => {
    expect(table.karakaTitles.length).toBe(7);
    expect(table.karakaTitles[0]).toBe('AK');
    expect(table.karakaTitles[6]).toBe('DK');
  });

  it('has 12 kalsarpa types', () => {
    expect(table.kalsarpaTypes.length).toBe(12);
    expect(table.kalsarpaTypes[0]).toBe('Anant');
    expect(table.kalsarpaTypes[11]).toBe('Sheshnag');
  });

  it('has 12 drikRitu / vedicRitu entries', () => {
    expect(table.drikRitu.length).toBe(12);
    expect(table.vedicRitu.length).toBe(12);
  });

  it('has 8 directions', () => {
    expect(table.directions.length).toBe(8);
    expect(table.directions[0]).toBe('East');
    expect(table.directions[4]).toBe('West');
  });

  it('has 12 nirayana/shaka month entries', () => {
    expect(table.nirayanaMonths.length).toBe(12);
    expect(table.shakaMonths.length).toBe(12);
  });
});

describe('Locale tables — hi', () => {
  const table = getLocaleTable('hi');
  it('has code hi and Devanagari label', () => {
    expect(table.code).toBe('hi');
    expect(table.label).toBe('हिन्दी');
  });
  it('first nakshatra is in Devanagari', () => {
    expect(table.nakshatras[0]).toBe('अश्विनी');
  });
  it('has same counts as en', () => {
    expect(table.nakshatras.length).toBe(27);
    expect(table.samvatsaras.length).toBe(60);
    expect(Object.keys(table.vargaNames).length).toBe(17);
  });
});

describe('Locale tables — ta', () => {
  const table = getLocaleTable('ta');
  it('has code ta and Tamil label', () => {
    expect(table.code).toBe('ta');
    expect(table.label).toBe('தமிழ்');
  });
  it('first nakshatra is in Tamil', () => {
    expect(table.nakshatras[0]).toBe('அஸ்வினி');
  });
  it('has same counts as en', () => {
    expect(table.nakshatras.length).toBe(27);
    expect(table.samvatsaras.length).toBe(60);
    expect(Object.keys(table.vargaNames).length).toBe(17);
  });
});

describe('resolveName', () => {
  it('resolves nakshatra names by index', () => {
    expect(resolveName(0, 'nakshatras', 'en')).toBe('Ashwini');
    expect(resolveName(0, 'nakshatras', 'hi')).toBe('अश्विनी');
    expect(resolveName(0, 'nakshatras', 'ta')).toBe('அஸ்வினி');
  });
  it('resolves signs by index', () => {
    expect(resolveName(0, 'signs', 'en')).toBe('Aries');
    expect(resolveName(11, 'signs', 'en')).toBe('Pisces');
  });
  it('resolves vargaNames by numeric key', () => {
    expect(resolveName(9, 'vargaNames', 'en')).toBe('Navamsa');
  });
  it('returns empty string for out-of-range index', () => {
    expect(resolveName(99, 'nakshatras', 'en')).toBe('');
  });
  it('defaults to en locale', () => {
    expect(resolveName(0, 'nakshatras')).toBe('Ashwini');
  });
});

describe('resolveNamedEntity', () => {
  it('returns id + resolved name', () => {
    const entity = resolveNamedEntity(0, 'nakshatras', 'en');
    expect(entity.id).toBe(0);
    expect(entity.name).toBe('Ashwini');
  });
  it('works with hi locale', () => {
    const entity = resolveNamedEntity(0, 'nakshatras', 'hi');
    expect(entity.name).toBe('अश्विनी');
  });
});

describe('Locale direct imports', () => {
  it('en.ts exports match getLocaleTable("en")', () => {
    expect(en.nakshatras[0]).toBe('Ashwini');
    expect(en.code).toBe('en');
  });
  it('hi.ts exports match getLocaleTable("hi")', () => {
    expect(hi.code).toBe('hi');
  });
  it('ta.ts exports match getLocaleTable("ta")', () => {
    expect(ta.code).toBe('ta');
  });
});
