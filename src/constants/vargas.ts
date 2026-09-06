// Varga (divisional chart) definitions

// 17 vargas (D1–D60 incl. D11 Rudramsa) — order matches backend/vargas.py
export const VARGA_ORDER = [
  1, 2, 3, 4, 7, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60,
] as const;

// Sign quality: 1=movable (chara), 2=fixed (sthira), 3=dual (dwi-swabhava)
// Keys are sign IDs 1-12
export const SIGN_QUALITY: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 1,
  5: 2,
  6: 3,
  7: 1,
  8: 2,
  9: 3,
  10: 1,
  11: 2,
  12: 3,
};

// Sign element: 1=fire, 2=earth, 3=air, 4=water
export const SIGN_ELEMENT: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 1,
  6: 2,
  7: 3,
  8: 4,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
};

// D30 Trimshamsa — uneven segment degree breakpoints
export const D30_BREAKS_ODD = [0, 5, 10, 18, 25, 30];
export const D30_BREAKS_EVEN = [0, 5, 12, 20, 25, 30];

// D30 sign result per part (0-indexed) for odd / even D1 signs
export const D30_SIGNS_ODD = [1, 11, 9, 3, 7]; // Ar, Aq, Sg, Ge, Li
export const D30_SIGNS_EVEN = [2, 6, 12, 10, 8]; // Ta, Vi, Pi, Cp, Sc
