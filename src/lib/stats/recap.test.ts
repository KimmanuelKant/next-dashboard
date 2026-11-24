// src/lib/stats/recap.test.ts
import { describe, expect, it } from "vitest";
import type { GameweekHighlight } from "./gameweekStats";
import { gameweekRecap, teamList } from "./recap";

const record = (
  kind: GameweekHighlight["kind"],
  teams: string[],
  value: number,
  detail?: string
): GameweekHighlight => ({ kind, teams, value, standout: 2, detail });

describe("teamList", () => {
  it("names up to three teams, and counts the rest", () => {
    expect(teamList(["Ann"])).toBe("Ann");
    expect(teamList(["Ann", "Bo"])).toBe("Ann and Bo");
    expect(teamList(["Ann", "Bo", "Cy"])).toBe("Ann, Bo and Cy");
    expect(teamList(["Ann", "Bo", "Cy", "Di"])).toBe("Ann, Bo and 2 others");
  });
});

describe("gameweekRecap", () => {
  const highlights = [
    record("winner", ["Ann FC"], 74),
    record("bench", ["Bo United"], 1),
    record("swing", ["Cy Town"], 12.6, "Saka"),
    record("transfersBackfired", ["Bo United"], 6),
  ];

  it("tells the gameweek's records, one line each", () => {
    expect(
      gameweekRecap({ leagueName: "Test League", gw: 10, live: false, highlights, averageScore: 55, captainsLeft: 0 })
    ).toEqual([
      "Test League, GW10:",
      "Ann FC won with 74 (FPL average 55).",
      "Bo United left 1 pt on the bench.",
      "Saka won Cy Town 12.6 pts against the league.",
      "Bo United lost 6 pts on transfers, after hits.",
    ]);
  });

  it("says nothing is won yet while the gameweek is played, and who has a captain to play", () => {
    const lines = gameweekRecap({
      leagueName: "Test League",
      gw: 11,
      live: true,
      highlights: [record("winner", ["Ann FC", "Bo United"], 60), record("lowest", ["Cy Town"], 30)],
      averageScore: null,
      captainsLeft: 3,
    });
    expect(lines).toEqual([
      "Test League, GW11 so far:",
      "Ann FC and Bo United top so far with 60.",
      "Cy Town bottom so far with 30.",
      "3 teams still have their captain to play.",
    ]);
  });

  it("says a shared win is shared", () => {
    const [, line] = gameweekRecap({
      leagueName: "L",
      gw: 1,
      live: false,
      highlights: [record("winner", ["Ann FC", "Bo United"], 60)],
      averageScore: null,
      captainsLeft: 0,
    });
    expect(line).toBe("Ann FC and Bo United shared the win with 60.");
  });
});
