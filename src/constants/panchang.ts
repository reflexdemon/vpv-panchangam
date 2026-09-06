// Tithi, nakshatra, yoga, karana, vara constants (language-agnostic)

export const NAK_SPAN = 360.0 / 27; // ~13.3333...
export const SIGN_SPAN = 30.0;

// Rahu Kalam, Yamaganda, Gulika: segment number (1-8) within the 8-part day
// keyed by ISO weekday: 1=Mon .. 7=Sun
export const RAHU_KAAL_SEGMENT: Record<number, number> = {
  1: 2,
  2: 7,
  3: 5,
  4: 6,
  5: 4,
  6: 3,
  7: 8,
};
export const YAMAGANDA_SEGMENT: Record<number, number> = {
  1: 4,
  2: 3,
  3: 2,
  4: 1,
  5: 7,
  6: 6,
  7: 5,
};
export const GULIKA_SEGMENT: Record<number, number> = {
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 1,
  7: 7,
};

// Fixed karanas (half-tithi index space 0-59)
export const FIXED_KARANA_INDICES = {
  KIMSTUGHNA: 0,
  SHAKUNI: 57,
  CHATUSHPADA: 58,
  NAGA: 59,
};

// Movable karana names in cycle order (repeats indices 1-56)
export const MOVABLE_KARANA_NAMES = [
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Gara",
  "Vanija",
  "Vishti",
];

/**
 * Karana name from half-tithi index (0-59).
 * 0 = Kimstughna (fixed), 1-56 = movable cycle, 57-59 = Shakuni/Chatushpada/Naga.
 */
export function karanaName(halfIndex: number): string {
  if (halfIndex === 0) return "Kimstughna";
  if (halfIndex >= 1 && halfIndex <= 56) {
    return MOVABLE_KARANA_NAMES[(halfIndex - 1) % 7];
  }
  if (halfIndex === 57) return "Shakuni";
  if (halfIndex === 58) return "Chatushpada";
  if (halfIndex === 59) return "Naga";
  return "Unknown";
}

/**
 * Tithi descriptive name (Shukla/Krishna prefix + base name).
 * Index 1-14 = Shukla, 15 = Purnima, 16-29 = Krishna, 30 = Amavasya.
 */
export function tithiName(index: number): string {
  const BASE = [
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
  ];
  if (index === 15) return "Purnima";
  if (index === 30) return "Amavasya";
  if (index >= 1 && index <= 14) return `Shukla ${BASE[index - 1]}`;
  if (index >= 16 && index <= 29) return `Krishna ${BASE[index - 16]}`;
  return "Unknown";
}
