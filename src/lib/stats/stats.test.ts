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
import { computeSales, computeStreaks, computeTeamStats, effectiveCaptain } from "./teamStats";
import { computePlayerStats } from "./playerStats";
import { computeLeagueHistory } from "./leagueHistory";
import { computeGameweekStats } from "./gameweekStats";
import { reviewCaptaincy } from "./decisions";

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
    startCost: 48,
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
          week(3, 74, { totalPoints: 200, value: 1004 }),
        ],
        chips: [
          { name: "3xc", gw: 1 },
          { name: "3xc", gw: 3 },
          { name: "wildcard", gw: 2 },
        ],
        transfers: [],
      },
      200: {
        gameweeks: [week(2, 80, { totalPoints: 130 }), week(3, 50, { totalPoints: 180 })],
        chips: [
          { name: "bboost", gw: 2 },
          { name: "freehit", gw: 3 },
        ],
        // Bo sold P13 for P16 ahead of GW3.
        transfers: [{ gw: 3, playerIn: 16, playerOut: 13, inCost: 50, outCost: 51 }],
      },
      300: { gameweeks: [], chips: [], transfers: [] },
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
    expect(cy.captainPointsPercentage).toBe(0);
    expect(cy.tripleCaptain).toEqual([]);
  });

  it("sums hits and bench points from history", () => {
    expect(ann.totalTransferPointsDeducted).toBe(4);
    expect(ann.pointsOnBench).toBe(9);
    expect(ann.teamValue).toBe(100.4);
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

describe("decisions", () => {
  const [ann, bo, cy] = computeTeamStats(snapshot());

  it("measures points lost by not captaining the best starter", () => {
    // Normal captain: P13 (13) captained, P14 (14) was the best starter.
    expect(reviewCaptaincy(team({}), points).pointsLost).toBe(1);
    // Triple Captain doubles what is at stake.
    expect(reviewCaptaincy(team({ chip: "3xc", captainMultiplier: 3 }), points).pointsLost).toBe(2);
    // Captain did not play, vice (P8) took the armband: 14 - 8.
    expect(
      reviewCaptaincy(team({ captainMultiplier: 0, viceMultiplier: 2 }), points).pointsLost
    ).toBe(6);
    // Captaining the best starter loses nothing.
    expect(reviewCaptaincy(team({ captain: 14 }), points).pointsLost).toBe(0);
  });

  it("adds captaincy regret up over the season", () => {
    // Ann: GW1 2 (triple captain on P13), GW2 6 (vice took over), GW3 0.
    expect(ann.captaincyPointsLost).toBe(8);
    expect(ann.perfectCaptainWeeks).toBe(1);
    // Bo: GW2 1 (Bench Boost makes P15 a starter), GW3 2 (P16 outscored P14).
    expect(bo.captaincyPointsLost).toBe(3);
    expect(bo.perfectCaptainWeeks).toBe(0);
    expect(cy.captaincyPointsLost).toBe(0);
  });

  it("finds the biggest benched haul", () => {
    expect(ann.biggestBenchedHaul).toEqual({ label: "P15, GW1", value: 15 });
    // Bo's GW2 was a Bench Boost, so only GW3 has a bench.
    expect(bo.biggestBenchedHaul).toEqual({ label: "P15, GW3", value: 15 });
    expect(cy.biggestBenchedHaul).toBeNull();
  });

  it("scores transfers by the first gameweek", () => {
    // P16 (16) in for P13 (13).
    expect(bo.transferGain).toBe(3);
    expect(bo.transferGainAfterHits).toBe(3);
    expect(bo.bestTransfer).toEqual({ label: "P16 for P13, GW3", value: 3 });
    expect(bo.worstTransfer).toEqual({ label: "P16 for P13, GW3", value: 3 });
    // Ann made no transfers but paid a 4-point hit.
    expect(ann.transferGain).toBe(0);
    expect(ann.transferGainAfterHits).toBe(-4);
    expect(ann.bestTransfer).toBeNull();
  });

  it("finds the most profitable sale", () => {
    // P13 was in Bo's squad from the start (start price 4.8) and sold for 5.1.
    expect(bo.biggestProfitSale).toEqual({ label: "P13, GW3", value: 0.3 });
    expect(bo.totalSaleProfit).toBe(0.3);
    expect(ann.biggestProfitSale).toBeNull();
    expect(ann.totalSaleProfit).toBe(0);
  });

  it("uses the price paid when the player was bought during the season", () => {
    const startCost = () => 40;
    const sales = computeSales(
      [
        { gw: 2, playerIn: 7, playerOut: 1, inCost: 60, outCost: 39 },
        { gw: 5, playerIn: 9, playerOut: 7, inCost: 55, outCost: 64 },
        // Free Hit week: ignored entirely.
        { gw: 6, playerIn: 3, playerOut: 9, inCost: 70, outCost: 80 },
        { gw: 8, playerIn: 4, playerOut: 9, inCost: 50, outCost: 53 },
      ],
      startCost,
      new Set([6])
    );
    expect(sales).toEqual([
      { gw: 2, playerId: 1, profit: -1 }, // original squad: start price 4.0, sold 3.9
      { gw: 5, playerId: 7, profit: 4 }, // bought 6.0, sold 6.4
      { gw: 8, playerId: 9, profit: -2 }, // bought 5.5, sold 5.3
    ]);
  });

  it("leaves Free Hit transfers out of transfer outcomes", () => {
    const withFreeHit = snapshot();
    withFreeHit.picks[3][200] = { ...withFreeHit.picks[3][200]!, chip: "freehit" };
    expect(computeTeamStats(withFreeHit)[1].transferGain).toBe(0);
  });
});

describe("computeGameweekStats", () => {
  const [ann, bo, cy] = computeGameweekStats(snapshot());

  it("reports this gameweek's score, captain and chip", () => {
    expect(ann.score).toBe(74);
    expect(ann.netScore).toBe(74);
    expect(ann.captain).toBe("P14");
    expect(ann.viceCaptain).toBe("P8");
    expect(ann.captainPoints).toBe(42);
    expect(ann.chip).toBe("Triple Captain");
    expect(ann.captaincyPointsLost).toBe(0);
    expect(ann.bestPlayer).toEqual({ name: "P14", count: 42 });
    expect(ann.topBenched).toEqual({ name: "P15", count: 15 });
  });

  it("shows who came in and went out since the previous squad", () => {
    expect(bo.playersIn).toEqual(["P16"]);
    expect(bo.playersOut).toEqual(["P13"]);
    expect(ann.playersIn).toEqual([]);
    expect(bo.bestCaptain).toEqual({ name: "P16", count: 16 });
    expect(bo.captaincyPointsLost).toBe(2);
  });

  it("reports squad value and its change since the previous gameweek", () => {
    expect(ann.teamValue).toBe(100.4);
    expect(ann.valueChange).toBe(0.4);
    expect(bo.valueChange).toBe(0);
    expect(cy.teamValue).toBeNull();
    expect(cy.valueChange).toBeNull();
  });

  it("ranks the gameweek within the league and tracks position change", () => {
    expect(ann.leagueGameweekRank).toBe(1);
    expect(bo.leagueGameweekRank).toBe(2);
    expect(ann.positionChange).toBe(0);
    expect(ann.positionTied).toBe(false);
  });

  it("marks teams level on points, where one moves up and none moves down", () => {
    // Cy was third and has drawn level with Bo: FPL ranks both second.
    const level = snapshot();
    level.league.managers[2] = { ...level.league.managers[2], rank: 2, lastRank: 3 };
    const [first, second, joint] = computeGameweekStats(level);
    expect(first.positionTied).toBe(false);
    expect([second.position, second.positionTied, second.positionChange]).toEqual([2, true, 0]);
    expect([joint.position, joint.positionTied, joint.positionChange]).toEqual([2, true, 1]);
    expect(computeTeamStats(level).map((team) => team.rankTied)).toEqual([false, true, true]);
  });

  it("handles a manager without a team this gameweek", () => {
    expect(cy.leagueGameweekRank).toBeNull();
    expect(cy.captain).toBe("");
    expect(cy.chip).toBeNull();
    expect(cy.bestPlayer).toBeNull();
    expect(cy.playersIn).toEqual([]);
  });

  it("returns nothing before the season starts", () => {
    expect(computeGameweekStats({ ...snapshot(), currentGw: null })).toEqual([]);
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

  it("includes players nobody in the league owns", () => {
    const unowned = snapshot();
    unowned.bootstrap.players.push({
      id: 99, name: "Nobody", position: 3, clubId: 1, cost: 45, startCost: 45,
      selectedByPercent: 30, totalPoints: 50, form: 7,
    });
    const player = computePlayerStats(unowned).find((p) => p.name === "Nobody")!;
    expect(player.leagueOwnershipCount).toBe(0);
    expect(player.owners).toEqual([]);
    expect(player.ownershipDifference).toBe(-30);
  });

  it("returns nothing before the season starts", () => {
    expect(computePlayerStats({ ...snapshot(), currentGw: null })).toEqual([]);
  });
});
