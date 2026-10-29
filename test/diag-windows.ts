import { loadFixtures, minuteDelta, localHm } from "./drik-helpers";
import { computeDetailedPanchang } from "../src/index";

const SINGLE_WINDOWS = [
  { key: "brahmaMuhurta", get: (r: any) => r.auspicious_timings.brahma_muhurta },
  { key: "pratahSandhya", get: (r: any) => r.auspicious_timings.pratah_sandhya },
  { key: "abhijit", get: (r: any) => r.auspicious_timings.abhijit },
  { key: "vijayaMuhurta", get: (r: any) => r.auspicious_timings.vijay_muhurta },
  { key: "godhuli", get: (r: any) => r.auspicious_timings.godhuli_muhurta },
  { key: "sayahnaSandhya", get: (r: any) => r.auspicious_timings.sayahna_sandhya },
  { key: "nishita", get: (r: any) => r.auspicious_timings.nishita_muhurta },
  { key: "rahuKalam", get: (r: any) => r.inauspicious_timings.rahu_kalam },
  { key: "yamaganda", get: (r: any) => r.inauspicious_timings.yamaganda },
  { key: "gulikai", get: (r: any) => r.inauspicious_timings.gulika_kalam },
];

function expectedHm(raw: string): string {
  const iso = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const hm = raw.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
  if (hm) return `${hm[1].padStart(2, "0")}:${hm[2]}`;
  const h12 = raw.match(/(\d{1,2}):(\d{2})\s*([AP])M/i);
  if (h12) {
    let h = Number(h12[1]) % 12;
    if (h12[3].toUpperCase() === "P") h += 12;
    return `${String(h).padStart(2, "0")}:${h12[2]}`;
  }
  throw new Error("unparseable: " + raw);
}

async function run() {
  const fixtures = loadFixtures();
  for (const f of fixtures) {
    const page = f.page as any;
    const tz = page.displayTimezone ?? f.timezone;
    const result = await computeDetailedPanchang(
      f.date, f.latitude, f.longitude, f.timezone, "en"
    );
    for (const w of SINGLE_WINDOWS) {
      const raw = page.windows?.[w.key] as string | undefined;
      const actual = w.get(result);
      if (raw == null && actual == null) continue;
      if (raw == null || actual == null) {
        console.log(`${f.city} ${f.date} ${w.key}: raw=${raw}, actual=${actual}`);
        continue;
      }
      const halves = raw.split(/\s+to\s+/);
      const d1 = minuteDelta(localHm(actual.start, tz), expectedHm(halves[0]));
      const d2 = minuteDelta(localHm(actual.end, tz), expectedHm(halves[1]));
      if (d1 > 1 || d2 > 1) {
        console.log(`FAIL ${f.city} ${f.date} ${w.key}: start d=${d1} (got ${localHm(actual.start, tz)}, exp ${halves[0]}), end d=${d2} (got ${localHm(actual.end, tz)}, exp ${halves[1]})`);
      }
    }
  }
  console.log("Done");
}
run().catch(console.error);
