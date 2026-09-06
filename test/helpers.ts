/** Reference locations used across test suites */

export const KELOWNA = {
  latitude: 49.886,
  longitude: -119.496,
  timezone: "America/Vancouver",
};

export const UJJAIN = {
  latitude: 23.1765,
  longitude: 75.7885,
  timezone: "Asia/Kolkata",
};

export const ALPHARETTA = {
  latitude: 34.07538,
  longitude: -84.29409,
  timezone: "America/New_York",
};

/** Returns true when |a - b| <= tol */
export function approxEqual(a: number, b: number, tol = 1e-4): boolean {
  return Math.abs(a - b) <= tol;
}

/** ISO string for a local wall-clock date+time in a given IANA timezone */
export function localToUtc(date: string, time: string, timezone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mn] = time.split(":").map(Number);
  // Build a Date by formatting a UTC candidate and comparing
  // Intl offset — simple but correct for modern JS engines
  const iso = `${date}T${time}:00`;
  const local = new Date(iso);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  // Approximate: use the offset at the nominal local time
  const parts = formatter.formatToParts(local);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const tzYear = get("year");
  const tzMonth = get("month");
  const tzDay = get("day");
  const tzHour = get("hour");
  const tzMin = get("minute");
  const offsetMs =
    local.getTime() -
    Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour === 24 ? 0 : tzHour, tzMin);
  return new Date(Date.UTC(y, mo - 1, d, h, mn) + offsetMs);
}
