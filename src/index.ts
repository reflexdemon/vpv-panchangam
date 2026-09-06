/**
 * vedic-panchanga — public API barrel export
 */

// Public API functions
export { computeDetailedPanchang } from "./api/get-panchang";
export { computeChart } from "./api/calculate";

// Error classes
export { PanchangError, ChartError } from "./types";

// Types
export type {
  Locale,
  Planet,
  AyanamsaId,
  VargaNumber,
  NamedEntity,
  TimeWindow,
  GeoLocation,
  BirthInfo,
  PlanetPosition,
  PanchangItem,
  Vara,
  SunSign,
  MoonSign,
  NakshatraPada,
  Chandrabalam,
  Tarabalam,
  VargaChart,
  Mahadasha,
  Antardasha,
  Pratyantar,
  Karaka,
  FriendshipTables,
  KalsarpaResult,
  AshtakavargaResult,
  AspectEdge,
  AspectResult,
  GowriSegment,
  GowriPanchanga,
  HoraSegment,
  Hora,
  Tyajyam,
  TamilCalendar,
  PanchangResponse,
  ChartResponse,
  LocaleTable,
} from "./types";

// Locale tables and resolver
export {
  en,
  hi,
  ta,
  TABLES as localeTables,
  resolveName,
  resolveNamedEntity,
  getLocaleTable,
} from "./locales";

// EphemerisService (for advanced usage / testing)
export { EphemerisService } from "./ephemeris";
