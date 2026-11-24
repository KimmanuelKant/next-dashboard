// src/lib/liveChanges.test.ts
import { describe, expect, it } from "vitest";
import {
  ChangeTracking,
  changesBetween,
  formatChange,
  hasNewRows,
  mergeReadings,
  readValues,
} from "./liveChanges";

interface Row {
  id: number;
  score: number | null;
  position: number;
}

const tracking: ChangeTracking<Row> = {
  rowKey: (row) => row.id,
  marked: { score: (row) => row.score },
  unmarked: { position: (row) => row.position },
};
const marked = Object.keys(tracking.marked);

describe("changes between updates", () => {
  const before = readValues<Row>(
    [
      { id: 1, score: 50, position: 1 },
      { id: 2, score: 44, position: 2 },
      { id: 3, score: 40, position: 3 },
    ],
    tracking
  );

  it("marks a changed score and highlights a row that only moved", () => {
    const after = readValues<Row>(
      [
        { id: 1, score: 50, position: 2 },
        { id: 2, score: 52, position: 1 },
        { id: 3, score: 38, position: 3 },
      ],
      tracking
    );
    const changes = changesBetween(before, after, marked);
    expect(changes.get("2")).toEqual(new Map([["score", 8]]));
    expect(changes.get("3")).toEqual(new Map([["score", -2]]));
    // Overtaken: the row is highlighted, with nothing to mark.
    expect(changes.get("1")).toEqual(new Map());
  });

  it("finds no change when nothing moved", () => {
    const again = readValues<Row>(
      [
        { id: 1, score: 50, position: 1 },
        { id: 2, score: 44, position: 2 },
        { id: 3, score: 40, position: 3 },
      ],
      tracking
    );
    expect(changesBetween(before, again, marked).size).toBe(0);
  });

  it("is no change when a row or value appears or disappears", () => {
    const after = readValues<Row>(
      [
        { id: 1, score: null, position: 1 },
        { id: 4, score: 30, position: 4 },
      ],
      tracking
    );
    expect(changesBetween(before, after, marked).size).toBe(0);
    expect(hasNewRows(before, after)).toBe(true);
    expect(hasNewRows(before, before)).toBe(false);
  });

  it("keeps the rows a filter hid when merging", () => {
    const after = readValues<Row>([{ id: 2, score: 46, position: 2 }], tracking);
    const merged = mergeReadings(before, after);
    expect([...merged.keys()]).toEqual(["1", "2", "3"]);
    expect(merged.get("2")?.get("score")).toBe(46);
  });

  it("formats the mark with a sign", () => {
    expect(formatChange(6)).toBe("+6");
    expect(formatChange(-2)).toBe("−2");
  });
});
