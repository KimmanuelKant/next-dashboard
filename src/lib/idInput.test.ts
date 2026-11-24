// src/lib/idInput.test.ts
import { describe, expect, it } from "vitest";
import { idInputError, idInputProblem } from "./idInput";

describe("idInputProblem", () => {
  it("reads typed names as names, in any alphabet", () => {
    expect(idInputProblem("Office League 2026")).toBe("name");
    expect(idInputProblem("  Salah's Army ")).toBe("name");
    expect(idInputProblem("ليغ الأصدقاء")).toBe("name");
  });

  it("reads web addresses without an ID as addresses", () => {
    expect(idInputProblem("https://fantasy.premierleague.com/my-team")).toBe("url");
    expect(idInputProblem("fantasy.premierleague.com/leagues")).toBe("url");
    expect(idInputProblem("www.myfpl.net")).toBe("url");
  });

  it("tells an empty box and stray symbols apart from names", () => {
    expect(idInputProblem("   ")).toBe("empty");
    expect(idInputProblem("#123")).toBe("other");
    expect(idInputProblem("12345678901")).toBe("other");
  });
});

describe("idInputError", () => {
  it("points a typed name to where the number is", () => {
    expect(idInputError("Office League", "league")).toContain("How to find your League ID");
    expect(idInputError("Office League", "team")).toContain("How to find your Team ID");
  });

  it("keeps the general message for other entries", () => {
    expect(idInputError("", "league")).toBe(
      "Enter the league number, or paste the league URL from the FPL site.",
    );
  });
});
