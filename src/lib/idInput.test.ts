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

  it("reads invite codes and auto-join links as codes", () => {
    expect(idInputProblem("sfcd6q")).toBe("code");
    expect(idInputProblem(" 4abc9z ")).toBe("code");
    expect(
      idInputProblem("https://fantasy.premierleague.com/leagues/auto-join/sfcd6q"),
    ).toBe("code");
  });

  it("does not read short names as codes", () => {
    expect(idInputProblem("Lads24")).toBe("name");
    expect(idInputProblem("office")).toBe("name");
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

  it("tells a pasted invite code it is not the ID, in either box", () => {
    expect(idInputError("sfcd6q", "league")).toContain("invite code");
    expect(idInputError("sfcd6q", "team")).toContain("How to find your League ID");
  });

  it("keeps the general message for other entries", () => {
    expect(idInputError("", "league")).toBe(
      "Enter the league number, or paste the league URL from the FPL site.",
    );
  });
});
