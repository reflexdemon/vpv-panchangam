// WASM browser ephemeris adapter — @swisseph/browser.
// Filled in by the BrowserEphemeris task.

import type {
  CalcResult,
  EphemerisInitOptions,
  HousesResult,
  IEphemeris,
} from "./types";

export class BrowserEphemeris implements IEphemeris {
  get initialized(): boolean {
    return false;
  }
  init(_options?: EphemerisInitOptions): Promise<void> | void {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  setAyanamsa(_ayanamsa: string): void {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  getSiderealFlag(_ayanamsa?: string): number {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  julday(_year: number, _month: number, _day: number, _hour: number): number {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  revjul(_jd: number): [number, number, number, number] {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  calcUt(_jd: number, _planet: number, _flags?: number): CalcResult {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  housesEx(
    _jd: number,
    _lat: number,
    _lon: number,
    _hsys?: string,
    _flags?: number,
  ): HousesResult {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  riseTrans(
    _jd: number,
    _body: number,
    _geopos: [number, number, number],
    _which: number,
  ): number | null {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  getAyanamsaUt(_jd: number): number {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  solEclipseWhenGlob(_jd: number, _flags?: number): unknown {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  lunEclipseWhen(_jd: number, _flags?: number): unknown {
    throw new Error("BrowserEphemeris not implemented yet");
  }
  isoWeekday(_jd: number): number {
    throw new Error("BrowserEphemeris not implemented yet");
  }
}
