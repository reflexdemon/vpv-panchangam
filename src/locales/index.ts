import type { Locale, LocaleTable, NamedEntity } from "../types";
import en from "./en";
import hi from "./hi";
import ta from "./ta";

const TABLES: Record<Locale, LocaleTable> = { en, hi, ta };

export { en, hi, ta, TABLES };

export function resolveName(
  id: number,
  tableKey: keyof LocaleTable,
  locale: Locale = "en",
): string {
  const table = TABLES[locale];
  const val = table[tableKey];
  if (Array.isArray(val)) {
    return (val as string[])[id] ?? "";
  }
  return (val as Record<number, string>)[id] ?? "";
}

export function resolveNamedEntity(
  id: number,
  tableKey: keyof LocaleTable,
  locale: Locale = "en",
): NamedEntity {
  return { id, name: resolveName(id, tableKey, locale) };
}

export function getLocaleTable(locale: Locale): LocaleTable {
  return TABLES[locale];
}
