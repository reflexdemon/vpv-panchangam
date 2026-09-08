// Demo entry: re-exports the public library surface into the browser global.
// Built as an ES module so @swisseph/browser's import.meta.url stays intact and
// its WASM sidecar resolves relative to this bundle (example/dist/swisseph.wasm).
import * as lib from "../src/index";

const vpv: Record<string, unknown> = {
  computeDetailedPanchang: lib.computeDetailedPanchang,
  computeChart: lib.computeChart,
  PanchangError: lib.PanchangError,
  ChartError: lib.ChartError,
  getLocaleTable: lib.getLocaleTable,
  localeTables: lib.localeTables,
  EphemerisService: lib.EphemerisService,
};

(globalThis as Record<string, unknown>).vpv = vpv;