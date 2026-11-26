// src/lib/beeswarm.test.ts
import { describe, expect, it } from "vitest";
import { beeswarm } from "./beeswarm";

const overlaps = (xs: number[], ys: number[], radius: number) =>
  xs.some((x, i) =>
    xs.some((x2, j) => j > i && Math.hypot(x - x2, ys[i] - ys[j]) < radius * 2 + 1 - 1e-6)
  );

describe("beeswarm", () => {
  it("keeps dots that are far apart on the centre line", () => {
    expect(beeswarm([0, 50, 100], 5)).toEqual([0, 0, 0]);
  });

  it("stacks equal scores into a column without overlaps", () => {
    const xs = [40, 40, 40, 40];
    const ys = beeswarm(xs, 5);
    expect(overlaps(xs, ys, 5)).toBe(false);
    // One on the line, then alternately above and below it.
    expect([...ys].sort((a, b) => a - b)).toEqual([-22, -11, 0, 11]);
  });

  it("never overlaps in a crowded league", () => {
    const xs = Array.from({ length: 100 }, (_, i) => 100 + ((i * 37) % 60) * 3);
    const ys = beeswarm(xs, 6);
    expect(overlaps(xs, ys, 6)).toBe(false);
  });

  it("puts the named dot on the centre line among equal scores", () => {
    const ys = beeswarm([40, 40, 40], 5, [2]);
    expect(ys[2]).toBe(0);
  });
});
