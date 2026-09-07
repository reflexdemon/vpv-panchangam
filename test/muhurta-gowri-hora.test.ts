import { describe, it, expect, beforeAll } from 'vitest';
import { EphemerisService } from '../src/ephemeris';
import {
  muhurtaWindows, brahmaMuhurta, pratahSandhya, abhijitMuhurta,
  vijayMuhurta, godhuliMuhurta, sayahnaSandhya, nishitaMuhurta,
  durMuhurtam, rahuKalam, yamaganda, gulikaKalam,
  varjyamWindow, amritKalamWindow, sarvarthaSiddhiYoga, amritaSiddhiYoga,
  bhadraWindows, muhurtaWindows as _muhurtaWindows,
} from '../src/calculations/muhurta';
import { computeGowri } from '../src/calculations/gowri';
import { computeHora } from '../src/calculations/hora';
import { computeNallaNeram } from '../src/calculations/nalla-neram';
import { computeSolarTimes } from '../src/calculations/sunrise';
import type { HoraSegment } from '../src/types';
import { KELOWNA } from './helpers';

let ephe: EphemerisService;
let sunriseJd: number;
let sunsetJd: number;
let nextSunriseJd: number;
// Kelowna 2018-06-01 is a Friday (weekday 5)
const WEEKDAY_FRIDAY = 5;

beforeAll(() => {
  ephe = EphemerisService.getInstance();
  ephe.init();
  // June 1 2018 noon UT
  const jdNoon = ephe.julday(2018, 6, 1, 12);
  const times = computeSolarTimes(jdNoon, KELOWNA.latitude, KELOWNA.longitude, ephe);
  sunriseJd     = times.sunrise      ?? jdNoon - 0.25;
  sunsetJd      = times.sunset       ?? jdNoon + 0.25;
  nextSunriseJd = times.nextSunrise  ?? sunriseJd + 1;
});

function isValidIso(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s);
}

// ─── muhurtaWindows ───────────────────────────────────────────────────────────

describe('muhurtaWindows', () => {
  it('returns 31 entries (0-indexed placeholder + 30 muhurtas)', () => {
    const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
    expect(wins.length).toBe(31);
  });

  it('index 0 is placeholder [0,0]', () => {
    const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
    expect(wins[0]).toEqual([0, 0]);
  });

  it('muhurta 1 starts at sunrise', () => {
    const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
    expect(wins[1][0]).toBeCloseTo(sunriseJd, 4);
  });

  it('day muhurtas are contiguous', () => {
    const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
    for (let i = 1; i < 15; i++) {
      expect(wins[i][1]).toBeCloseTo(wins[i + 1][0], 6);
    }
  });

  it('day muhurtas 1-15 span sunrise to sunset', () => {
    const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
    expect(wins[1][0]).toBeCloseTo(sunriseJd, 4);
    expect(wins[15][1]).toBeCloseTo(sunsetJd, 4);
  });
});

// ─── Individual muhurta windows ───────────────────────────────────────────────

describe('brahmaMuhurta', () => {
  it('returns a TimeWindow', () => {
    const w = brahmaMuhurta(sunriseJd, nextSunriseJd, ephe);
    expect(w).not.toBeNull();
    expect(isValidIso(w!.start)).toBe(true);
    expect(isValidIso(w!.end)).toBe(true);
  });

  it('ends at sunrise minus 96 minutes', () => {
    const w = brahmaMuhurta(sunriseJd, nextSunriseJd, ephe);
    const endMs   = new Date(w!.end).getTime();
    const sunriseMs = sunriseJd * 86400000 - 2440587.5 * 86400000;
    // Brahma Muhurta ends ~96min before sunrise
    const diffMs = sunriseMs - endMs;
    expect(diffMs / 60000).toBeCloseTo(96, 0);
  });

  it('duration is 96 minutes', () => {
    const w = brahmaMuhurta(sunriseJd, nextSunriseJd, ephe);
    const durMs = new Date(w!.end).getTime() - new Date(w!.start).getTime();
    expect(durMs / 60000).toBeCloseTo(96, 0);
  });
});

describe('abhijitMuhurta', () => {
  it('returns non-null on non-Wednesday', () => {
    const w = abhijitMuhurta(sunriseJd, sunsetJd, nextSunriseJd, WEEKDAY_FRIDAY, ephe);
    expect(w).not.toBeNull();
  });

  it('returns null on Wednesday (weekday 3)', () => {
    const w = abhijitMuhurta(sunriseJd, sunsetJd, nextSunriseJd, 3, ephe);
    expect(w).toBeNull();
  });

  it('is the 8th day muhurta (midday)', () => {
    const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
    const w = abhijitMuhurta(sunriseJd, sunsetJd, nextSunriseJd, WEEKDAY_FRIDAY, ephe);
    const expectedStart = new Date(wins[8][0] * 86400000 - 2440587.5 * 86400000).toISOString().slice(0, 19);
    const actualStart   = w!.start.slice(0, 19);
    expect(actualStart).toBe(expectedStart);
  });
});

describe('durMuhurtam', () => {
  it('returns 2 windows on Monday (weekday 1)', () => {
    const wins = durMuhurtam(sunriseJd, sunsetJd, nextSunriseJd, 1, ephe);
    expect(wins.length).toBe(2);
  });

  it('returns 1 window on Friday (weekday 5)', () => {
    const wins = durMuhurtam(sunriseJd, sunsetJd, nextSunriseJd, 5, ephe);
    expect(wins.length).toBe(1);
  });

  it('returns 2 windows on Saturday (weekday 6)', () => {
    const wins = durMuhurtam(sunriseJd, sunsetJd, nextSunriseJd, 6, ephe);
    expect(wins.length).toBe(2);
  });

  it('all windows have valid ISO times', () => {
    const wins = durMuhurtam(sunriseJd, sunsetJd, nextSunriseJd, 1, ephe);
    for (const w of wins) {
      expect(isValidIso(w.start)).toBe(true);
      expect(isValidIso(w.end)).toBe(true);
    }
  });
});

// ─── Inauspicious timing blocks ───────────────────────────────────────────────

describe('rahuKalam / yamaganda / gulikaKalam', () => {
  it('rahuKalam returns a TimeWindow', () => {
    const w = rahuKalam(sunriseJd, sunsetJd, WEEKDAY_FRIDAY, ephe);
    expect(w).not.toBeNull();
    expect(isValidIso(w!.start)).toBe(true);
    expect(isValidIso(w!.end)).toBe(true);
  });

  it('rahuKalam duration = 1/8 of daylight', () => {
    const w = rahuKalam(sunriseJd, sunsetJd, WEEKDAY_FRIDAY, ephe);
    const dayDurMs = (sunsetJd - sunriseJd) * 86400000;
    const winDurMs = new Date(w!.end).getTime() - new Date(w!.start).getTime();
    expect(winDurMs).toBeCloseTo(dayDurMs / 8, -3); // within ~1s
  });

  it('yamaganda returns a TimeWindow', () => {
    const w = yamaganda(sunriseJd, sunsetJd, WEEKDAY_FRIDAY, ephe);
    expect(w).not.toBeNull();
  });

  it('gulikaKalam returns a TimeWindow', () => {
    const w = gulikaKalam(sunriseJd, sunsetJd, WEEKDAY_FRIDAY, ephe);
    expect(w).not.toBeNull();
  });

  it('rahuKalam, yamaganda, gulika do not overlap on the same day', () => {
    const r = rahuKalam(sunriseJd, sunsetJd, WEEKDAY_FRIDAY, ephe)!;
    const y = yamaganda(sunriseJd, sunsetJd, WEEKDAY_FRIDAY, ephe)!;
    const g = gulikaKalam(sunriseJd, sunsetJd, WEEKDAY_FRIDAY, ephe)!;
    const rEnd   = new Date(r.end).getTime();
    const rStart = new Date(r.start).getTime();
    const yEnd   = new Date(y.end).getTime();
    const yStart = new Date(y.start).getTime();
    const gEnd   = new Date(g.end).getTime();
    const gStart = new Date(g.start).getTime();
    // No overlap: rahu and yama
    expect(Math.min(rEnd, yEnd) <= Math.max(rStart, yStart)).toBe(true);
    // No overlap: rahu and gulika
    expect(Math.min(rEnd, gEnd) <= Math.max(rStart, gStart)).toBe(true);
  });
});

// ─── Varjyam / Amrit ──────────────────────────────────────────────────────────

describe('varjyamWindow / amritKalamWindow', () => {
  // nakshatra 0 (Ashwini): varjyam ghatikas = 50, duration = 1.6 ghatikas
  const nakDurJd = 1.0; // 1 day for test
  let nakStartJd: number;
  let nakEndJd: number;

  beforeAll(() => {
    nakStartJd = sunriseJd;
    nakEndJd   = sunriseJd + nakDurJd;
  });

  it('varjyamWindow returns a TimeWindow for Ashwini (0)', () => {
    const w = varjyamWindow(0, nakStartJd, nakEndJd, ephe);
    expect(w).not.toBeNull();
    expect(isValidIso(w!.start)).toBe(true);
  });

  it('amritKalamWindow returns a TimeWindow', () => {
    const w = amritKalamWindow(0, nakStartJd, nakEndJd, ephe);
    expect(w).not.toBeNull();
  });

  it('varjyam and amrit windows have positive duration', () => {
    const v = varjyamWindow(0, nakStartJd, nakEndJd, ephe)!;
    const a = amritKalamWindow(0, nakStartJd, nakEndJd, ephe)!;
    expect(new Date(v.end).getTime()).toBeGreaterThan(new Date(v.start).getTime());
    expect(new Date(a.end).getTime()).toBeGreaterThan(new Date(a.start).getTime());
  });

  it('amrit window starts ~26.67 ghatikas after varjyam window', () => {
    // offset difference in fraction of nakshatra: 26.67/60
    const v = varjyamWindow(0, nakStartJd, nakEndJd, ephe)!;
    const a = amritKalamWindow(0, nakStartJd, nakEndJd, ephe)!;
    const vStartMs = new Date(v.start).getTime();
    const aStartMs = new Date(a.start).getTime();
    const nakDurMs = (nakEndJd - nakStartJd) * 86400000;
    // Expected diff: 26.67/60 of nakshatra duration (mod wrap)
    const expectedDiffMs = (26.67 / 60) * nakDurMs;
    // Allow for modular wrap
    const actualDiff = ((aStartMs - vStartMs) % nakDurMs + nakDurMs) % nakDurMs;
    expect(actualDiff).toBeCloseTo(expectedDiffMs, -4); // within ~1min
  });
});

// ─── Siddhi Yogas ─────────────────────────────────────────────────────────────

describe('sarvarthaSiddhiYoga / amritaSiddhiYoga', () => {
  it('returns a TimeWindow when conditions match', () => {
    // Sunday (7) + nakshatra 7 (Pushya) → match
    const w = sarvarthaSiddhiYoga(sunriseJd, sunsetJd, 7, 7, ephe);
    expect(w).not.toBeNull();
    expect(w!.start).toBeDefined();
    expect(w!.end).toBeDefined();
  });

  it('returns null when no match', () => {
    // Sunday (7) + nakshatra 5 (Ardra) → no match
    const w = sarvarthaSiddhiYoga(sunriseJd, sunsetJd, 7, 5, ephe);
    expect(w).toBeNull();
  });

  it('amritaSiddhiYoga: Monday (1) + nakshatra 4 (Mrigashira) → match', () => {
    const w = amritaSiddhiYoga(sunriseJd, sunsetJd, 1, 4, ephe);
    expect(w).not.toBeNull();
  });

  it('amritaSiddhiYoga: Monday (1) + nakshatra 0 (Ashwini) → no match', () => {
    const w = amritaSiddhiYoga(sunriseJd, sunsetJd, 1, 0, ephe);
    expect(w).toBeNull();
  });
});

// ─── bhadraWindows ────────────────────────────────────────────────────────────

describe('bhadraWindows', () => {
  it('returns Vishti karanas from sequence', () => {
    const karanas = [
      { index: 6, name: 'Vishti',  starts_at: '2024-01-01T06:00:00Z', ends_at: '2024-01-01T12:00:00Z' },
      { index: 0, name: 'Bava',    starts_at: '2024-01-01T12:00:00Z', ends_at: '2024-01-01T18:00:00Z' },
      { index: 6, name: 'Vishti',  starts_at: '2024-01-01T18:00:00Z', ends_at: '2024-01-02T00:00:00Z' },
    ];
    const bhadra = bhadraWindows(karanas);
    expect(bhadra.length).toBe(2);
    expect(bhadra[0].start).toBe('2024-01-01T06:00:00Z');
    expect(bhadra[0].end).toBe('2024-01-01T12:00:00Z');
  });

  it('returns empty array when no Vishti karanas', () => {
    const karanas = [
      { index: 0, name: 'Bava', starts_at: '2024-01-01T06:00:00Z', ends_at: '2024-01-01T18:00:00Z' },
    ];
    expect(bhadraWindows(karanas)).toEqual([]);
  });
});

// ─── Gowri Panchangam ────────────────────────────────────────────────────────

describe('computeGowri', () => {
  let gowri: ReturnType<typeof computeGowri>;

  beforeAll(() => {
    gowri = computeGowri(sunriseJd, sunsetJd, nextSunriseJd, WEEKDAY_FRIDAY, ephe);
  });

  it('day has 8 segments', () => {
    expect(gowri.day.length).toBe(8);
  });

  it('night has 8 segments', () => {
    expect(gowri.night.length).toBe(8);
  });

  it('all segment names are from GOWRI_NAMES', () => {
    const VALID = new Set(['Soram','Uthi','Visham','Amridha','Rogam','Labam','Dhanam','Sugam']);
    for (const seg of [...gowri.day, ...gowri.night]) {
      expect(VALID.has(seg.name)).toBe(true);
    }
  });

  it('Amridha, Sugam, Labam, Dhanam, Uthi are auspicious', () => {
    for (const seg of [...gowri.day, ...gowri.night]) {
      const expected = ['Amridha', 'Sugam', 'Labam', 'Dhanam', 'Uthi'].includes(seg.name);
      expect(seg.auspicious).toBe(expected);
    }
  });

  it('Friday (5): day starts at index 2 (Visham)', () => {
    // GOWRI_DAY_START[5] = 2 → GOWRI_NAMES[2] = 'Visham'
    expect(gowri.day[0].name).toBe('Visham');
    expect(gowri.day[0].auspicious).toBe(false);
  });

  it('night starts 5 positions after day (Friday: (2+5)%8=7 → Sugam)', () => {
    // nightStart = (2 + 5) % 8 = 7 → GOWRI_NAMES[7] = 'Sugam'
    expect(gowri.night[0].name).toBe('Sugam');
    expect(gowri.night[0].auspicious).toBe(true);
  });

  it('Monday (1) day starts with Amridha (auspicious)', () => {
    const mondayGowri = computeGowri(sunriseJd, sunsetJd, nextSunriseJd, 1, ephe);
    expect(mondayGowri.day[0].name).toBe('Amridha');
    expect(mondayGowri.day[0].auspicious).toBe(true);
  });

  it('Saturday (6) day starts with Soram (inauspicious)', () => {
    const satGowri = computeGowri(sunriseJd, sunsetJd, nextSunriseJd, 6, ephe);
    expect(satGowri.day[0].name).toBe('Soram');
    expect(satGowri.day[0].auspicious).toBe(false);
  });

  it('all start/end times are valid ISO strings', () => {
    for (const seg of [...gowri.day, ...gowri.night]) {
      expect(isValidIso(seg.start)).toBe(true);
      expect(isValidIso(seg.end)).toBe(true);
    }
  });

  it('day segments are contiguous', () => {
    for (let i = 0; i < 7; i++) {
      expect(gowri.day[i].end).toBe(gowri.day[i + 1].start);
    }
  });
});

// ─── Hora ─────────────────────────────────────────────────────────────────────

describe('computeHora', () => {
  let hora: ReturnType<typeof computeHora>;

  beforeAll(() => {
    hora = computeHora(sunriseJd, sunsetJd, nextSunriseJd, WEEKDAY_FRIDAY, ephe);
  });

  it('day has 12 segments', () => {
    expect(hora.day.length).toBe(12);
  });

  it('night has 12 segments', () => {
    expect(hora.night.length).toBe(12);
  });

  it('all hora names are from HORA_CYCLE', () => {
    const VALID = new Set(['Sun','Venus','Mercury','Moon','Saturn','Jupiter','Mars']);
    for (const seg of [...hora.day, ...hora.night]) {
      expect(VALID.has(seg.name)).toBe(true);
    }
  });

  it('auspicious flag matches AUSPICIOUS_HORAS', () => {
    const AUS = new Set(['Jupiter','Venus','Mercury','Moon']);
    for (const seg of [...hora.day, ...hora.night]) {
      expect(seg.auspicious).toBe(AUS.has(seg.name));
    }
  });

  it('Friday (5) day first hora is Venus (HORA_DAY_START[5]=1 → index 1 → Venus)', () => {
    // HORA_CYCLE[1] = 'Venus'
    expect(hora.day[0].name).toBe('Venus');
    expect(hora.day[0].auspicious).toBe(true);
  });

  it('Sunday (7) day first hora is Sun', () => {
    // HORA_DAY_START[7] = 0 → HORA_CYCLE[0] = 'Sun'
    const sunHora = computeHora(sunriseJd, sunsetJd, nextSunriseJd, 7, ephe);
    expect(sunHora.day[0].name).toBe('Sun');
    expect(sunHora.day[0].auspicious).toBe(false);
  });

  it('day segments are contiguous', () => {
    for (let i = 0; i < 11; i++) {
      expect(hora.day[i].end).toBe(hora.day[i + 1].start);
    }
  });

  it('all start/end times are valid ISO', () => {
    for (const seg of [...hora.day, ...hora.night]) {
      expect(isValidIso(seg.start)).toBe(true);
      expect(isValidIso(seg.end)).toBe(true);
    }
  });
});

// ─── Nalla Neram ──────────────────────────────────────────────────────────────

describe('computeNallaNeram', () => {
  it('returns auspicious hora windows when no inauspicious windows', () => {
    const horas: HoraSegment[] = [
      { name: 'Jupiter', auspicious: true,  start: '2024-01-01T08:00:00Z', end: '2024-01-01T09:00:00Z' },
      { name: 'Saturn',  auspicious: false, start: '2024-01-01T09:00:00Z', end: '2024-01-01T10:00:00Z' },
      { name: 'Venus',   auspicious: true,  start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
    ];
    const result = computeNallaNeram(horas, []);
    expect(result.length).toBe(2);
    expect(result[0].start).toBe('2024-01-01T08:00:00Z');
    expect(result[1].start).toBe('2024-01-01T10:00:00Z');
  });

  it('subtracts inauspicious window from auspicious hora', () => {
    const horas: HoraSegment[] = [
      { name: 'Jupiter', auspicious: true,
        start: '2024-01-01T08:00:00Z', end: '2024-01-01T09:00:00Z' },
    ];
    const bad = [{ start: '2024-01-01T08:30:00Z', end: '2024-01-01T09:00:00Z' }];
    const result = computeNallaNeram(horas, bad);
    expect(result.length).toBe(1);
    // Only 08:00-08:30 should remain
    expect(result[0].start).toBe('2024-01-01T08:00:00Z');
    expect(result[0].end).toBe('2024-01-01T08:30:00.000Z');
  });

  it('returns empty when inauspicious covers entire auspicious period', () => {
    const horas: HoraSegment[] = [
      { name: 'Jupiter', auspicious: true,
        start: '2024-01-01T08:00:00Z', end: '2024-01-01T09:00:00Z' },
    ];
    const bad = [{ start: '2024-01-01T07:00:00Z', end: '2024-01-01T10:00:00Z' }];
    const result = computeNallaNeram(horas, bad);
    expect(result.length).toBe(0);
  });

  it('ignores inauspicious windows that are already not auspicious', () => {
    const horas: HoraSegment[] = [
      { name: 'Saturn', auspicious: false,
        start: '2024-01-01T08:00:00Z', end: '2024-01-01T09:00:00Z' },
    ];
    const result = computeNallaNeram(horas, []);
    expect(result.length).toBe(0);
  });
});
