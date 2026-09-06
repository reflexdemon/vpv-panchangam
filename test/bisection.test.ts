import { describe, it, expect } from "vitest";
import { findAngleTime, findAllCrossings } from "../src/calculations/bisection";

describe("findAngleTime", () => {
  it("finds a simple crossing at a known point", () => {
    // angle = t * 10 deg, target 90° → t = 9
    const result = findAngleTime(0, 18, 90, (t) => t * 10);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(9, 4);
  });

  it("returns null when target is outside the range", () => {
    // angle goes 0 → 180, target 270 is never reached
    const result = findAngleTime(0, 18, 270, (t) => t * 10);
    expect(result).toBeNull();
  });

  it("returns lo boundary when angle equals target at start", () => {
    // angle at t=5 is exactly 50°
    const result = findAngleTime(5, 10, 50, (t) => t * 10);
    expect(result).toBeCloseTo(5, 6);
  });

  it("achieves better than 1e-7 precision", () => {
    const result = findAngleTime(0, 10, 45, (t) => t * 10);
    expect(result).not.toBeNull();
    expect(Math.abs(result! - 4.5)).toBeLessThan(1e-7);
  });

  it("handles angle crossing 360→0 wrap", () => {
    // angle = (350 + t*5) % 360 — crosses 0° at t=2
    const result = findAngleTime(0, 4, 0, (t) => (350 + t * 5) % 360);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(2, 3);
  });

  it("handles target near 360", () => {
    const result = findAngleTime(0, 36, 359, (t) => t * 10);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(35.9, 3);
  });
});

describe("findAllCrossings", () => {
  it("finds all 30-degree crossings in a 360-degree window", () => {
    // angle increases 1°/unit, step 30° → 12 crossings in [0, 361]
    // We use 361 to avoid the degenerate t%360==0 at exactly t=360
    const crossings = findAllCrossings(0, 361, 30, (t) => t % 360);
    expect(crossings.length).toBe(12);
    expect(crossings[0].jd).toBeCloseTo(30, 2);
    expect(crossings[11].jd).toBeCloseTo(360, 2);
  });

  it("returns correct index at each crossing", () => {
    const crossings = findAllCrossings(0, 100, 12, (t) => t % 360);
    for (const c of crossings) {
      const expected = Math.round(c.jd / 12) % 30;
      expect(c.index).toBe(expected);
    }
  });
});
