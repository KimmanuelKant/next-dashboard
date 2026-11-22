// src/lib/tableUrl.test.ts
import { describe, expect, it } from "vitest";
import { decodeSorting, encodeSorting, viewSlug, withTableState } from "./tableUrl";

describe("viewSlug", () => {
  it("turns a view's name into its name in the address", () => {
    expect(viewSlug("League race")).toBe("league-race");
    expect(viewSlug("Transfers, chips and value")).toBe("transfers-chips-and-value");
    expect(viewSlug("")).toBe("");
  });
});

describe("sorting in the address", () => {
  const columnIds = new Set(["netScore", "teamName"]);

  it("survives a round trip", () => {
    const sorting = [
      { id: "netScore", desc: true },
      { id: "teamName", desc: false },
    ];
    expect(encodeSorting(sorting)).toBe("-netScore,teamName");
    expect(decodeSorting("-netScore,teamName", columnIds)).toEqual(sorting);
  });

  it("ignores a missing value and a column the table does not have", () => {
    expect(decodeSorting(null, columnIds)).toBeNull();
    expect(decodeSorting("", columnIds)).toBeNull();
    expect(decodeSorting("-noSuchColumn", columnIds)).toBeNull();
  });
});

describe("withTableState", () => {
  const defaults = { view: "overview", sort: "position" };

  it("adds the view and sorting and keeps the visitor's team", () => {
    expect(
      withTableState("?team=42", { view: "captaincy", sort: "-captaincyPointsLost" }, defaults)
    ).toBe("?team=42&view=captaincy&sort=-captaincyPointsLost");
  });

  it("leaves out whatever matches the table's default", () => {
    expect(withTableState("?view=bench&sort=-benchPoints", defaults, defaults)).toBe("");
    expect(withTableState("?team=42&view=bench", { view: "", sort: "position" }, defaults)).toBe(
      "?team=42"
    );
  });
});
