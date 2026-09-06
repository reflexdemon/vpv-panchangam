// Muhurta-related constants

// Varjyam starting ghatika (out of 60) per nakshatra index 0-26 (Ashwini=0)
// Source: backend/advanced_panchang.py VARJYAM_GHATIKAS
export const VARJYAM_GHATIKAS = [
  50, 24, 30, 40, 14, 21, 30, 20, 32, 30, 20, 18, 21, 20, 14, 14, 10, 14, 56,
  24, 20, 10, 10, 18, 16, 24, 30,
];
export const VARJYAM_DURATION_GHATIKAS = 1.6; // ~38.4 min

// Amrit Kalam = (Varjyam + 26.67) mod 60
export const AMRIT_OFFSET_GHATIKAS = 26.67;
export const AMRIT_KALAM_DURATION_GHATIKAS = 1.6;

// Sarvartha Siddhi Yoga: ISO weekday → set of nakshatra indices (0-26)
export const SARVARTHA_SIDDHI: Record<number, Set<number>> = {
  1: new Set([3, 4, 7, 17]), // Mon
  2: new Set([0, 2, 8, 25]), // Tue
  3: new Set([0, 2, 3, 4, 12, 16]), // Wed
  4: new Set([0, 6, 7, 16, 26]), // Thu
  5: new Set([0, 6, 16, 21, 26]), // Fri
  6: new Set([3, 14, 21]), // Sat
  7: new Set([0, 7, 10, 11, 12, 18, 20, 25]), // Sun
};

// Amrita Siddhi Yoga: ISO weekday → nakshatra index
export const AMRITA_SIDDHI: Record<number, Set<number>> = {
  1: new Set([4]), // Mon + Mrigashira
  2: new Set([0]), // Tue + Ashwini
  3: new Set([16]), // Wed + Anuradha
  4: new Set([7]), // Thu + Pushya
  5: new Set([26]), // Fri + Revati
  6: new Set([3]), // Sat + Rohini
  7: new Set([12]), // Sun + Hasta
};

// Dur Muhurta: ISO weekday → muhurta indices (1-15) within the day
// Source: backend/panchang_constants.py DUR_MUHURTA
export const DUR_MUHURTA: Record<number, number[]> = {
  1: [9, 12], // Mon
  2: [4], // Tue
  3: [8], // Wed (coincides with Abhijit — suppressed that day)
  4: [6], // Thu
  5: [4], // Fri
  6: [1, 2], // Sat
  7: [14], // Sun
};

export const ABHIJIT_MUHURTA_INDEX = 8; // 8th muhurta of 15

// Gowri Panchangam: day-start index (into GOWRI_NAMES) per ISO weekday
export const GOWRI_DAY_START: Record<number, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 7,
  5: 2,
  6: 0,
  7: 1,
};

// Hora: day-start index (into HORA_CYCLE) per ISO weekday
export const HORA_DAY_START: Record<number, number> = {
  1: 3,
  2: 6,
  3: 2,
  4: 5,
  5: 1,
  6: 4,
  7: 0,
};

export const HORA_CYCLE = [
  "Sun",
  "Venus",
  "Mercury",
  "Moon",
  "Saturn",
  "Jupiter",
  "Mars",
] as const;

export const AUSPICIOUS_HORAS = new Set([
  "Jupiter",
  "Venus",
  "Mercury",
  "Moon",
]);

// Amritadi Yogam table: 27 nakshatras × 7 weekday columns (Mon-Sun).
// Each char: A=Amrita, S=Siddha, M=Marana, P=Prabalarishta
export const AMRITADI_TABLE = [
  "SSMAASS", // 0  Ashwini
  "SSSSSSP", // 1  Bharani
  "MSAMSSS", // 2  Krittika
  "AASMMAS", // 3  Rohini
  "SSSMSSS", // 4  Mrigashira
  "SMSMSSS", // 5  Ardra
  "ASSASSS", // 6  Punarvasu
  "SSSSMSS", // 7  Pushya
  "SSSSMMS", // 8  Ashlesha
  "MSSAMAM", // 9  Magha
  "SSASSSS", // 10 Purva Phalguni
  "SAAMSMA", // 11 Uttara Phalguni
  "SSMSAMS", // 12 Hasta
  "PSSSSMS", // 13 Chitra
  "ASSASSS", // 14 Swati
  "MMSSSSM", // 15 Vishakha
  "SSSSSSM", // 16 Anuradha
  "SMSPMSM", // 17 Jyeshtha
  "SAMSASA", // 18 Mula
  "MSASPSS", // 19 Purva Ashadha
  "MPASSSA", // 20 Uttara Ashadha
  "ASSSMSA", // 21 Shravana
  "SSPSSSM", // 22 Dhanishta
  "SMSMSAS", // 23 Shatabhisha
  "MMASSMS", // 24 Purva Bhadrapada
  "SASSSSA", // 25 Uttara Bhadrapada
  "SSMSSPA", // 26 Revati
] as const;

// Nakshatra tyajyam offset ratio [numerator, denominator] per nakshatra (0-26)
export const NAKSHATRA_TYAJYAM_RATIO: Array<[number, number]> = [
  [5, 6],
  [2, 5],
  [1, 2],
  [2, 3],
  [7, 30],
  [7, 20],
  [1, 2],
  [1, 3],
  [8, 15],
  [1, 2],
  [1, 3],
  [3, 10],
  [11, 30],
  [14, 15],
  [7, 30],
  [7, 30],
  [1, 6],
  [7, 30],
  [1, 3],
  [2, 5],
  [1, 3],
  [1, 6],
  [1, 6],
  [3, 10],
  [4, 15],
  [2, 5],
  [1, 2],
];
export const NAKSHATRA_TYAJYAM_DURATION_MIN = 96;

// Tithi tyajyam ratio [num, denom] base (indices 0-15: Pratipada..Purnima/Amavasya)
export const TITHI_TYAJYAM_BASE: Array<[number, number]> = [
  [2, 5],
  [1, 5],
  [11, 12],
  [1, 12],
  [9, 10],
  [9, 10],
  [31, 60],
  [1, 3],
  [1, 12],
  [11, 20],
  [1, 60],
  [1, 4],
  [13, 30],
  [7, 60],
  [29, 60],
  [1, 10],
];
export const TITHI_TYAJYAM_DURATION_MIN = 96;

// Vara tyajyam offset in nazhigai per ISO weekday (1 nazhigai = 24 min)
export const VARA_TYAJYAM_NAZHIGAI: Record<number, number> = {
  1: 42,
  2: 31,
  3: 42,
  4: 31,
  5: 21,
  6: 14,
  7: 32,
};
export const VARA_TYAJYAM_DURATION_MIN = 90;

// Inauspicious karanas — their full span is treated as Karana Tyajyam
export const INAUSPICIOUS_KARANAS = new Set(["Vishti", "Chatushpada", "Naga"]);

// Lagna defect position per sign name (for Lagna Tyajyam)
export const LAGNA_DEFECT_POSITION: Record<string, string> = {
  Aries: "beginning",
  Taurus: "beginning",
  Virgo: "beginning",
  Sagittarius: "beginning",
  Gemini: "middle",
  Leo: "middle",
  Libra: "middle",
  Aquarius: "middle",
  Cancer: "end",
  Scorpio: "end",
  Capricorn: "end",
  Pisces: "end",
};
export const LAGNA_DEFECT_RATIO = 0.1;

// Asthamanam (combustion) orbs for Dosha Tyajyam
export const GURU_ASTHAMANAM_ORB = 11;
export const SUKRA_ASTHAMANAM_ORB_DIRECT = 10;
export const SUKRA_ASTHAMANAM_ORB_RETRO = 8;
