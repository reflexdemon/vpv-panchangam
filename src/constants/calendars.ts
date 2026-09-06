// Calendar-related constants

export const KALI_START_JD = 588465.5; // Julian Day of Kali Yuga epoch (Feb 18, 3102 BCE)
export const RATA_DIE_EPOCH_JD = 1721424.5; // JD of Jan 1, 1 CE

// Disha Shool (inauspicious direction) per ISO weekday (1=Mon..7=Sun)
export const DISHA_SHOOL: Record<number, string> = {
  1: "East",
  2: "North",
  3: "North",
  4: "South",
  5: "West",
  6: "East",
  7: "West",
};

// Rahu Vasa (Rahu's abode direction) per ISO weekday
export const RAHU_VASA: Record<number, string> = {
  1: "North-West",
  2: "North",
  3: "South-East",
  4: "South",
  5: "East",
  6: "West",
  7: "South-West",
};

// Chandra Vasa (Moon's abode direction) per Moon sign index (1-12)
export const CHANDRA_VASA: Record<number, string> = {
  1: "West",
  2: "South",
  3: "West",
  4: "North",
  5: "East",
  6: "West",
  7: "South",
  8: "East",
  9: "North",
  10: "East",
  11: "West",
  12: "South",
};

// Good Chandrabalam offsets from birth rashi (0-11)
export const GOOD_CHANDRA_OFFSETS = new Set([0, 2, 5, 6, 9, 10]);

// Good Tarabalam offsets from birth nakshatra (0-26)
export const GOOD_TARA_OFFSETS = new Set([
  0, 1, 3, 5, 7, 8, 9, 10, 12, 14, 16, 17, 18, 19, 21, 23, 25, 26,
]);

// Rashi names (Sanskrit, 0-indexed; index 0 = Mesha/Aries)
export const RASHI_NAMES = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrishchika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
];

// Chandra Masa (lunar month) indexed by Sun sign id (0-11, Aries=0)
// Sun in Aries → Vaishakha lunar month
export const CHANDRA_MASA_BY_SUNSIGN = [
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashwin",
  "Kartika",
  "Margashirsha",
  "Pausha",
  "Magha",
  "Phalguna",
  "Chaitra",
];

// Sign → Drik Ritu (tropical-based)
export const SIGN_TO_DRIK_RITU: Record<number, string> = {
  1: "Vasant",
  2: "Grishma",
  3: "Grishma",
  4: "Varsha",
  5: "Varsha",
  6: "Sharad",
  7: "Sharad",
  8: "Hemant",
  9: "Hemant",
  10: "Shishir",
  11: "Shishir",
  12: "Vasant",
};

// Sign → Vedic Ritu (sidereal-based, same mapping)
export const SIGN_TO_VEDIC_RITU: Record<number, string> = {
  1: "Vasant",
  2: "Grishma",
  3: "Grishma",
  4: "Varsha",
  5: "Varsha",
  6: "Sharad",
  7: "Sharad",
  8: "Hemant",
  9: "Hemant",
  10: "Shishir",
  11: "Shishir",
  12: "Vasant",
};

// Ayana: Uttarayana = Capricorn (10) through Gemini (3); Dakshinayana = Cancer (4) through Sagittarius (9)
export const UTTARAYANA_SIGNS = new Set([10, 11, 12, 1, 2, 3]);

// Tamil months (nirayana solar) indexed by sign id 1-12
export const TAMIL_MONTHS_BY_SIGN: Record<number, { en: string; ta: string }> =
  {
    1: { en: "Chithirai", ta: "சித்திரை" },
    2: { en: "Vaikasi", ta: "வைகாசி" },
    3: { en: "Aani", ta: "ஆனி" },
    4: { en: "Aadi", ta: "ஆடி" },
    5: { en: "Aavani", ta: "ஆவணி" },
    6: { en: "Purattasi", ta: "புரட்டாசி" },
    7: { en: "Aippasi", ta: "ஐப்பசி" },
    8: { en: "Karthigai", ta: "கார்த்திகை" },
    9: { en: "Margazhi", ta: "மார்கழி" },
    10: { en: "Thai", ta: "தை" },
    11: { en: "Maasi", ta: "மாசி" },
    12: { en: "Panguni", ta: "பங்குனி" },
  };

// National Civil Calendar (Indian) month names and day counts
export const NATIONAL_CIVIL_MONTHS = [
  { name: "Chaitra", days: 30 }, // 31 in leap year
  { name: "Vaishakha", days: 31 },
  { name: "Jyaistha", days: 31 },
  { name: "Asadha", days: 31 },
  { name: "Sravana", days: 31 },
  { name: "Bhadra", days: 31 },
  { name: "Asvina", days: 30 },
  { name: "Kartika", days: 30 },
  { name: "Agrahayana", days: 30 },
  { name: "Pausa", days: 30 },
  { name: "Magha", days: 30 },
  { name: "Phalguna", days: 30 },
];
