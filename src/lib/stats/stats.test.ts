// src/lib/stats/stats.test.ts
import { describe, expect, it } from "vitest";
import {
  LeagueSnapshot,
  ManagerGameweek,
  Pick,
  PICK_CAPTAIN,
  PICK_NONE,
  PICK_VICE,
  Player,
} from "@/lib/fpl/types";
import { computeStreaks, computeTeamStats, effectiveCaptain } from "./teamStats";
import { computePlayerStats } from "./playerStats";
import { computeLeagueHistory } from "./leagueHistory";

// Players 1-15: 1-2 goalkeepers, 3-7 defenders, 8-12 midfielders, 13-15 forwards.
const positionOf = (id: number) => (id <= 2 ? 1 : id <= 7 ? 2 : id <= 12 ? 3 : 4);
const players: Player[] = Array.from({ length: 16 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    name: `P${id}`,
    position: (id === 16 ? 4 : positionOf(id)) as Player["position"],
    clubId: 1,
    cost: 50,
    selectedByPercent: id === 13 ? 60 : 10,
    totalPoints: 0,
    form: 0,
  };
});

// Starting eleven: 1, 3-6, 8-11, 13-14. Bench: 2, 7, 12, 15.
const STARTERS = [1, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14];
const BENCH = [2, 7, 12, 15];

function team(options: {
  captain?: number;
  vice?: number;
  captainMultiplier?: number;
  viceMultiplier?: number;
  chip?: string | null;
  swap?: [number, number];
}): ManagerGameweek {
  const {
    captain = 13,
    vice = 8,
    captainMultiplier = 2,
    viceMultiplier = 1,
    chip = null,
    swap,
  } = options;
  const ids = [...STARTERS, ...BENCH].map((id) =>
    swap && id === swap[0] ? swap[1] : id
  );
  const picks: Pick[] = ids.map((id, index) => {
    const role = id === captain ? PICK_CAPTAIN : id === vice ? PICK_VICE : PICK_NONE;
    const benched = index >= 11 && chip !== "bboost";
    const multiplier = benched
      ? 0
      : id === captain
      ? captainMultiplier
      : id === vice
      ? viceMultiplier
      : 1;
    return [id, multiplier, role];
  });
  return { chip, picks };
}

// Every player scores their own id in points, every gameweek.
const points = Object.fromEntries(players.map((p) => [p.id, p.id]));

const week = (gw: number, pts: number, extra: Partial<Record<string, number>> = {}) => ({
  gw,
  points: pts,
  totalPoints: pts,
  rank: 1000 * gw,
  overallRank: 5000 - gw,
  bank: 5,
  value: 1000,
  transfers: 1,
  transfersCost: 0,
  benchPoints: 3,
  ...extra,
});

function snapshot(): LeagueSnapshot {
  return {
    league: {
      id: 1,
      name: "Test League",
      hasMoreManagers: false,
      managers: [
        { entryId: 100, managerName: "Ann", teamName: "Ann FC", rank: 1, lastRank: 1, total: 200, eventTotal: 60 },
        { entryId: 200, managerName: "Bo", teamName: "Bo United", rank: 2, lastRank: 2, total: 100, eventTotal: 50 },
        { entryId: 300, managerName: "Cy", teamName: "Cy Town", rank: 3, lastRank: 3, total: 0, eventTotal: 0 },
      ],
    },
    bootstrap: {
      season: "2026",
      totalManagers: 1000,
      players,
      clubs: [{ id: 1, name: "Club", shortName: "CLB" }],
      gameweeks: [1, 2, 3].map((id) => ({
        id,
        finished: id < 3,
        isCurrent: id === 3,
        deadline: "2026-08-01T00:00:00Z",
      })),
    },
    currentGw: 3,
    gameweekIds: [1, 2, 3],
    points: { 1: points, 2: points, 3: points },
    // P13 is booked in GW1; P2 (always benched) is sent off in GW1; P14 has a bad GW3.
    incidents: { 1: { 13: [1, 0, 0, 0], 2: [0, 1, 0, 0] }, 2: {}, 3: { 14: [0, 0, 1, 1] } },
    picks: {
      // Ann: triple captain in GW1, captain did not play in GW2 (vice gets x2),
      // second triple captain in GW3 with bench boost-free normal team.
      1: {
        100: team({ chip: "3xc", captainMultiplier: 3 }),
        200: null, // Bo joined in GW2
        300: null,
      },
      2: {
        100: team({ captainMultiplier: 0, viceMultiplier: 2 }),
        200: team({ chip: "bboost", captain: 14 }),
        300: null,
      },
      3: {
        100: team({ chip: "3xc", captainMultiplier: 3, captain: 14 }),
        200: team({ captain: 14, swap: [13, 16] }),
        300: null,
      },
    },
    histories: {
      100: {
        gameweeks: [
          week(1, 70, { totalPoints: 70 }),
          week(2, 60, { transfersCost: 4, totalPoints: 126 }),
          week(3, 74, { totalPoints: 200 }),
        ],
        chips: [
          { name: "3xc", gw: 1 },
          { name: "3xc", gw: 3 },
          { name: "wildcard", gw: 2 },
        ],
      },
      200: {
        gameweeks: [week(2, 80, { totalPoints: 130 }), week(3, 50, { totalPoints: 180 })],
        chips: [
          { name: "bboost", gw: 2 },
          { name: "freehit", gw: 3 },
        ],
      },
      300: { gameweeks: [], chips: [] },
    },
  };
}

describe("effectiveCaptain", () => {
  it("is the vice captain when the captain did not play", () => {
    const pick = effectiveCaptain(team({ captainMultiplier: 0, viceMultiplier: 2 }));
    expect(pick?.[0]).toBe(8);
  });

  it("is null when neither captain nor vice played", () => {
    expect(effectiveCaptain(team({ captainMultiplier: 0 }))).toBeNull();
  });
});

describe("computeTeamStats", () => {
  const [ann, bo, cy] = computeTeamStats(snapshot());

  it("reports every use of a chip", () => {
    expect(ann.tripleCaptain).toEqual([
      { gw: 1, points: 13 },
      { gw: 3, points: 14 },
    ]);
    expect(ann.wildcardsUsed).toBe(1);
    expect(ann.chipsUsed).toEqual([
      "Triple Captain (GW1)",
      "Wildcard (GW2)",
      "Triple Captain (GW3)",
    ]);
  });

  it("counts bench boost as the four bench players' points", () => {
    expect(bo.benchBoost).toEqual([{ gw: 2, points: 2 + 7 + 12 + 15 }]);
    expect(bo.freeHit).toEqual([{ gw: 3, points: 50 }]);
    expect(bo.chipPointsGained).toBe(36);
  });

  it("gives captain points to the vice captain when the captain did not play", () => {
    // GW1: P13 x3 = 39. GW2: vice P8 x2 = 16. GW3: P14 x3 = 42.
    expect(ann.totalCaptainPoints).toBe(39 + 16 + 42);
    // 97 of (200 total + 4 hits).
    expect(ann.captainPointsPercentage).toBeCloseTo((97 / 204) * 100);
  });

  it("tracks who was chosen as captain, regardless of who played", () => {
    expect(ann.mostCaptained).toEqual({ name: "P13", count: 2 });
    expect(ann.captainDiversity).toBe(2);
    expect(ann.captain).toBe("P14");
    expect(ann.viceCaptain).toBe("P8");
  });

  it("sums points by position including multipliers and excluding the bench", () => {
    // Ann's forwards: GW1 13x3 + 14, GW2 13x0 + 14, GW3 13 + 14x3.
    expect(ann.totalFWDPoints).toBe(39 + 14 + 0 + 14 + 13 + 42);
    // Goalkeeper P1 starts every week; P2 is benched.
    expect(ann.totalGKPoints).toBe(3);
  });

  it("handles a manager who joined late", () => {
    expect(bo.bestOverallRank).toBe(4997);
    expect(bo.worstOverallRank).toBe(4998);
    expect(bo.totalTransfers).toBe(2);
    expect(bo.highestGameweekScore).toBe(80);
  });

  it("handles a manager with no history without throwing", () => {
    expect(cy.overallRank).toBeNull();
    expect(cy.teamValue).toBeNull();
    expect(cy.bestOverallRank).toBeNull();
    expect(cy.mostCaptained).toBeNull();
    expect(cy.captain).toBe("");
    expect(cy.captainPointsPercentage).toBe(0);
    expect(cy.tripleCaptain).toEqual([]);
  });

  it("sums hits and bench points from history", () => {
    expect(ann.totalTransferPointsDeducted).toBe(4);
    expect(ann.pointsOnBench).toBe(9);
    expect(ann.teamValue).toBe(100);
    expect(ann.bank).toBe(0.5);
  });
});

describe("league history and squad habits", () => {
  const history = computeLeagueHistory(snapshot());
  const [ann, bo, cy] = computeTeamStats(snapshot());

  it("ranks managers week by week, skipping weeks before they joined", () => {
    const [annRow, boRow, cyRow] = history.rows;
    expect(history.gameweeks).toEqual([1, 2, 3]);
    // GW2: Bo (130) overtakes Ann (126). GW3: Ann (200) retakes the lead.
    expect(annRow.positions).toEqual([1, 2, 1]);
    expect(boRow.positions).toEqual([null, 1, 2]);
    expect(cyRow.positions).toEqual([null, null, null]);
    // Ann's GW2 score is 60 minus a 4-point hit.
    expect(annRow.scores).toEqual([70, 56, 74]);
  });

  it("counts weeks at top, weeks at bottom and gameweek wins", () => {
    expect(ann.weeksAtTop).toBe(2);
    // GW1 had one ranked team, so nobody was "bottom" that week.
    expect(ann.weeksAtBottom).toBe(1);
    expect(ann.gameweekWins).toBe(2);
    expect(bo.weeksAtTop).toBe(1);
    expect(bo.weeksAtBottom).toBe(1);
    expect(bo.gameweekWins).toBe(1);
    expect(bo.bestLeaguePosition).toBe(1);
    expect(bo.worstLeaguePosition).toBe(2);
    expect(cy.bestLeaguePosition).toBeNull();
  });

  it("finds the longest-held player and favourite club", () => {
    expect(ann.mostHeld?.count).toBe(3);
    expect(bo.mostHeld?.count).toBe(2);
    expect(ann.longestSquadStreak?.count).toBe(3);
    expect(ann.favouriteClub).toEqual({ name: "Club", count: 100 });
    expect(cy.mostHeld).toBeNull();
    expect(cy.longestSquadStreak).toBeNull();
    expect(cy.longestServingStarter).toBeNull();
  });

  it("counts incidents only for players in the starting eleven", () => {
    // Ann: P13 booked in GW1 (started); P2 sent off on the bench does not count;
    // P14 own goal and missed penalty in GW3 (started).
    expect(ann.yellowCards).toBe(1);
    expect(ann.redCards).toBe(0);
    expect(ann.ownGoals).toBe(1);
    expect(ann.penaltiesMissed).toBe(1);
    // Bo had no team in GW1; P14 started for Bo in GW3.
    expect(bo.yellowCards).toBe(0);
    expect(bo.ownGoals).toBe(1);
  });
});

describe("computeStreaks", () => {
  // Squads of three for brevity: [id, multiplier, role]; multiplier 0 = benched.
  const squad = (chip: string | null, ...picks: [number, number][]): ManagerGameweek => ({
    chip,
    picks: picks.map(([id, multiplier]) => [id, multiplier, PICK_NONE]),
  });

  it("finds the longest unbroken run in the squad, even if it has ended", () => {
    const streaks = computeStreaks([
      squad(null, [1, 1], [2, 1]),
      squad(null, [1, 1], [2, 1]),
      squad(null, [1, 1], [3, 1]),
      squad(null, [4, 1], [3, 1]),
    ]);
    // Player 1 was held for GW1-3, then sold.
    expect(streaks.longestSquad).toEqual([1, 3]);
  });

  it("restarts a run after a real gap", () => {
    const streaks = computeStreaks([
      squad(null, [1, 1], [2, 1]),
      squad(null, [3, 1], [2, 1]),
      squad(null, [1, 1], [3, 1]),
      squad(null, [1, 1], [3, 1]),
    ]);
    // Player 1: one week, sold, then two weeks. Player 3: three weeks running.
    expect(streaks.longestSquad).toEqual([3, 3]);
  });

  it("does not break a run for a player left out of a Free Hit squad", () => {
    const streaks = computeStreaks([
      squad(null, [1, 1], [2, 1]),
      squad("freehit", [8, 1], [9, 1]),
      squad(null, [1, 1], [2, 1]),
    ]);
    // Two real weeks either side of the Free Hit; the Free Hit week is not counted.
    expect(streaks.longestSquad?.[1]).toBe(2);
    expect(streaks.currentStarter?.[1]).toBe(2);
  });

  it("counts the Free Hit week for a player who is in the Free Hit squad", () => {
    const streaks = computeStreaks([
      squad(null, [1, 1], [2, 1]),
      squad("freehit", [1, 1], [9, 1]),
      squad(null, [1, 1], [2, 1]),
    ]);
    expect(streaks.longestSquad).toEqual([1, 3]);
  });

  it("reports the current starter with the longest run of starts", () => {
    const streaks = computeStreaks([
      squad(null, [1, 1], [2, 1], [3, 0]),
      squad(null, [1, 0], [2, 1], [3, 1]),
      squad(null, [1, 1], [2, 0], [3, 1]),
    ]);
    // Player 2 started twice but is benched now; player 3 has started the last two.
    expect(streaks.currentStarter).toEqual([3, 2]);
  });

  it("returns nulls for a manager with no teams", () => {
    expect(computeStreaks([])).toEqual({ longestSquad: null, currentStarter: null });
  });
});

describe("computePlayerStats", () => {
  const stats = computePlayerStats(snapshot());
  const byName = (name: string) => stats.find((p) => p.name === name)!;

  it("uses the current gameweek and only managers who have a team", () => {
    // Two managers have teams in GW3; Cy does not.
    expect(byName("P1").leagueOwnershipCount).toBe(2);
    expect(byName("P1").leagueOwnershipPercentage).toBe(100);
    expect(byName("P1").owners).toEqual(["Ann FC", "Bo United"]);
  });

  it("finds differentials", () => {
    // P13 is owned by Ann only; P16 by Bo only.
    expect(byName("P13").leagueOwnershipCount).toBe(1);
    expect(byName("P13").ownershipDifference).toBe(50 - 60);
    expect(byName("P16").owners).toEqual(["Bo United"]);
  });

  it("weights effective ownership by multiplier", () => {
    // P14: tripled by Ann, captained by Bo = 5 of 2 managers.
    expect(byName("P14").effectiveOwnership).toBe(250);
    expect(byName("P14").leagueCaptainCount).toBe(2);
    // P2 is on both benches.
    expect(byName("P2").effectiveOwnership).toBe(0);
    expect(byName("P2").leagueStartingCount).toBe(0);
  });

  it("returns nothing before the season starts", () => {
    expect(computePlayerStats({ ...snapshot(), currentGw: null })).toEqual([]);
  });
});
