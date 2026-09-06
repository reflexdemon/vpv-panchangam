import { beforeAll } from "vitest";
import { EphemerisService } from "../src/ephemeris";

beforeAll(() => {
  const ephe = EphemerisService.getInstance();
  ephe.init();
});
