// Planet-related constants

export const DASHA_SEQUENCE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;

export const DASHA_YEARS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

export const DASHA_TOTAL_YEARS = 120;

// Nakshatra lord cycle (0-indexed, repeats every 9)
export const NAKSHATRA_LORD_CYCLE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;

// Planet order used for chart building (Sun=0 through Pluto, then Ketu derived)
export const PLANET_ORDER: Array<{ name: string; abbr: string }> = [
  { name: "Sun", abbr: "Su" },
  { name: "Moon", abbr: "Mo" },
  { name: "Mars", abbr: "Ma" },
  { name: "Mercury", abbr: "Me" },
  { name: "Jupiter", abbr: "Ju" },
  { name: "Venus", abbr: "Ve" },
  { name: "Saturn", abbr: "Sa" },
  { name: "Rahu", abbr: "Ra" },
  { name: "Ketu", abbr: "Ke" },
  { name: "Uranus", abbr: "Ur" },
  { name: "Neptune", abbr: "Ne" },
  { name: "Pluto", abbr: "Pl" },
];

// Planets that can be combust (Sun / Rahu / Ketu never are)
export const COMBUST_PLANETS = new Set([
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
]);
export const COMBUST_ORB = 5.0; // degrees

// ─── Ayanamsa ─────────────────────────────────────────────────────────────────
// SE_SIDM_* values as found in swisseph 0.5.x npm package
export const enum SideralMode {
  FAGAN_BRADLEY = 0,
  LAHIRI = 1,
  DE_LUCE = 2,
  RAMAN = 3,
  USHASHASHI = 4,
  KRISHNAMURTI = 5,
  TRUE_CITRA = 27,
  TRUE_REVATI = 28, // closest available to SIDM_LAHIRI_ICRC
}

export const AYANAMSA_MAP: Record<
  string,
  { mode: SideralMode | null; label: string }
> = {
  lahiri: { mode: SideralMode.LAHIRI, label: "N.C. Lahiri (Chitrapaksha)" },
  kp_new: { mode: SideralMode.KRISHNAMURTI, label: "K.P. New (Krishnamurti)" },
  kp_old: { mode: SideralMode.KRISHNAMURTI, label: "K.P. Old (Krishnamurti)" },
  raman: { mode: SideralMode.RAMAN, label: "B.V. Raman" },
  kp_khullar: {
    mode: SideralMode.TRUE_CITRA,
    label: "K.P. Khullar (True Chitrapaksha)",
  },
  sayan: { mode: null, label: "Sayana (Tropical)" },
  manoj: { mode: SideralMode.TRUE_REVATI, label: "Manoj (Lahiri ICRC)" },
};

// ─── BAV Rules ────────────────────────────────────────────────────────────────
// For each planet (receiver), for each contributor (Sun..Saturn + Asc),
// an array of house offsets that award a BAV point.
// Source: backend/calculator.py BAV_RULES
export const BAV_RULES: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Asc: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [3, 6, 7, 8, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Asc: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Asc: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Asc: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Asc: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Asc: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Asc: [1, 3, 4, 6, 10, 11],
  },
};

export const BAV_CONTRIBUTORS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Asc",
] as const;

// ─── Exaltation / Debilitation / Own Sign / Moolatrikona ─────────────────────
// sign IDs are 1-12; degree is position within sign (0-30)
export const EXALTATION: Record<string, { sign: number; degree: number }> = {
  Sun: { sign: 1, degree: 10 }, // Aries 10°
  Moon: { sign: 2, degree: 3 }, // Taurus 3°
  Mars: { sign: 10, degree: 28 }, // Capricorn 28°
  Mercury: { sign: 6, degree: 15 }, // Virgo 15°
  Jupiter: { sign: 4, degree: 5 }, // Cancer 5°
  Venus: { sign: 12, degree: 27 }, // Pisces 27°
  Saturn: { sign: 7, degree: 20 }, // Libra 20°
  Rahu: { sign: 2, degree: 0 }, // Taurus (various traditions)
  Ketu: { sign: 8, degree: 0 }, // Scorpio
};

export const DEBILITATION: Record<string, { sign: number; degree: number }> = {
  Sun: { sign: 7, degree: 10 },
  Moon: { sign: 8, degree: 3 },
  Mars: { sign: 4, degree: 28 },
  Mercury: { sign: 12, degree: 15 },
  Jupiter: { sign: 10, degree: 5 },
  Venus: { sign: 6, degree: 27 },
  Saturn: { sign: 1, degree: 20 },
  Rahu: { sign: 8, degree: 0 },
  Ketu: { sign: 2, degree: 0 },
};

// Own signs for each planet (can have multiple)
export const OWN_SIGNS: Record<string, number[]> = {
  Sun: [5],
  Moon: [4],
  Mars: [1, 8],
  Mercury: [3, 6],
  Jupiter: [9, 12],
  Venus: [2, 7],
  Saturn: [10, 11],
};

// Moolatrikona sign and degree range [start, end] within sign
export const MOOLATRIKONA: Record<
  string,
  { sign: number; start: number; end: number }
> = {
  Sun: { sign: 5, start: 0, end: 20 },
  Moon: { sign: 2, start: 4, end: 30 },
  Mars: { sign: 1, start: 0, end: 12 },
  Mercury: { sign: 6, start: 16, end: 20 },
  Jupiter: { sign: 9, start: 0, end: 10 },
  Venus: { sign: 7, start: 0, end: 15 },
  Saturn: { sign: 11, start: 0, end: 20 },
};

// Digbala (directional strength) signs
export const DIGBALA_SIGNS: Record<string, number> = {
  Sun: 10, // Capricorn (MC)
  Moon: 4, // Cancer (IC)
  Mars: 10, // Capricorn
  Mercury: 1, // Aries (ASC)
  Jupiter: 1, // Aries
  Venus: 4, // Cancer
  Saturn: 7, // Libra (DSC)
};

// Pushkara Bhaga: specific degrees (within sign, 1-30) per sign
// (degree-level auspicious point)
export const PUSHKARA_BHAGA: Record<number, number[]> = {
  1: [21],
  2: [14],
  3: [7],
  4: [12],
  5: [18],
  6: [8],
  7: [20],
  8: [24],
  9: [16],
  10: [19],
  11: [28],
  12: [9],
};

// Pushkara Navamsa: navamsa signs that are pushkara
export const PUSHKARA_NAVAMSA_SIGNS = new Set([1, 2, 4, 5, 7, 8, 10, 11]);

// Mrityu Bhaga (death degree): specific degree per sign per planet
export const MRITYU_BHAGA: Record<string, Record<number, number>> = {
  Sun: {
    1: 20,
    2: 9,
    3: 12,
    4: 6,
    5: 8,
    6: 24,
    7: 16,
    8: 17,
    9: 22,
    10: 2,
    11: 3,
    12: 23,
  },
  Moon: {
    1: 26,
    2: 12,
    3: 13,
    4: 25,
    5: 24,
    6: 11,
    7: 26,
    8: 14,
    9: 13,
    10: 25,
    11: 5,
    12: 12,
  },
  Mars: {
    1: 18,
    2: 28,
    3: 16,
    4: 14,
    5: 16,
    6: 27,
    7: 28,
    8: 18,
    9: 16,
    10: 14,
    11: 13,
    12: 21,
  },
  Mercury: {
    1: 15,
    2: 14,
    3: 8,
    4: 13,
    5: 16,
    6: 18,
    7: 7,
    8: 20,
    9: 17,
    10: 22,
    11: 5,
    12: 2,
  },
  Jupiter: {
    1: 5,
    2: 11,
    3: 29,
    4: 29,
    5: 10,
    6: 15,
    7: 15,
    8: 9,
    9: 16,
    10: 14,
    11: 19,
    12: 15,
  },
  Venus: {
    1: 9,
    2: 24,
    3: 11,
    4: 15,
    5: 11,
    6: 8,
    7: 10,
    8: 4,
    9: 22,
    10: 12,
    11: 18,
    12: 27,
  },
  Saturn: {
    1: 14,
    2: 16,
    3: 19,
    4: 2,
    5: 7,
    6: 25,
    7: 24,
    8: 22,
    9: 5,
    10: 3,
    11: 26,
    12: 20,
  },
};

// Gandanta degrees: last 3.2° of water signs (Cancer=4, Scorpio=8, Pisces=12)
// and first 3.2° of fire signs (Aries=1, Leo=5, Sagittarius=9)
// A planet within 3.2° (1 nakshatra pada) of these junctions is gandanta.
export const GANDANTA_JUNCTIONS: Array<{
  sign: number;
  edge: "start" | "end";
  orb: number;
}> = [
  { sign: 1, edge: "start", orb: 3.2 }, // Aries start
  { sign: 4, edge: "end", orb: 3.2 }, // Cancer end
  { sign: 5, edge: "start", orb: 3.2 }, // Leo start
  { sign: 8, edge: "end", orb: 3.2 }, // Scorpio end
  { sign: 9, edge: "start", orb: 3.2 }, // Sagittarius start
  { sign: 12, edge: "end", orb: 3.2 }, // Pisces end
];
