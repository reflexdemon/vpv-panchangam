import { beforeAll } from "vitest";
import { EphemerisService } from "../src/ephemeris";

beforeAll(async () => {
  const ephe = EphemerisService.getInstance();
  await ephe.init();
});
