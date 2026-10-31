import { describe, it } from "vitest";
import { computeDetailedPanchang } from "../src/index";
import { loadFixtures, localHm } from "./drik-helpers";

describe("array windows count check", () => {
  it("all three arrays", async () => {
    const fixtures = loadFixtures();
    let fails = 0;
    for (const f of fixtures) {
      const r = await computeDetailedPanchang(f.date, f.latitude, f.longitude, f.timezone, "en");
      const page = f.page as any;
      const tz = (page.displayTimezone ?? f.timezone) as string;

      const fxV: string[] = page.windows?.varjyam ?? [];
      const fxA: string[] = page.windows?.amritKalam ?? [];
      const fxD: string[] = page.windows?.durMuhurtam ?? [];
      const actV = r.inauspicious_timings.varjyam ?? [];
      const actA = r.auspicious_timings.amrit_kalam ?? [];
      const actD = r.inauspicious_timings.dur_muhurtam ?? [];
      const showW = (w: any) => localHm(w.start, tz)+'–'+localHm(w.end, tz);

      if (actV.length !== fxV.length || actA.length !== fxA.length || actD.length !== fxD.length) {
        console.log(`${f.slug} ${f.date}: V exp=${fxV.length} act=${actV.length}[${actV.map(showW).join('|')}] A exp=${fxA.length} act=${actA.length}[${actA.map(showW).join('|')}] D exp=${fxD.length} act=${actD.length}[${actD.map(showW).join('|')}]`);
        console.log(`  fixture: V=[${fxV.join('|')}] A=[${fxA.join('|')}] D=[${fxD.join('|')}]`);
        fails++;
      }
    }
    console.log(`Fails: ${fails}`);
  });
});
