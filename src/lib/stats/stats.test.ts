// src/lib/stats/stats.test.ts
import { describe, expect, it } from "vitest";
import {
  LeagueSnapshot,
  LiveFixture,
  ManagerGameweek,
  Pick,
  PICK_CAPTAIN,
  PICK_NONE,
  PICK_VICE,
  Player,
} from "@/lib/fpl/types";
import {
  computeSales,
  computeSeasonHighlights,
  computeStreaks,
  computeTeamStats,
  effectiveCaptain,
} from "./teamStats";
import { computePlayerStats } from "./playerStats";
import {
  CHART_SERIES,
  computeLeagueHistory,
  DEFAULT_SERIES,
  scoresAgainstWeekAverage,
} from "./leagueHistory";
import { computeGameweekHighlights, computeGameweekStats } from "./gameweekStats";
import { pointsAfterSale, reviewCaptaincy, transferOutcomes } from "./decisions";
import { EVERY_RECORD, pickHighlights, teamRecord, TeamRecord } from "./records";
import { liveGameweek, projectTeam, provisionalBonus } from "./live";
import { leagueGameweek, playerSwings } from "./leagueGameweek";
import { leagueMatches } from "./matches";

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
        averageScore: null,
        highestScore: null,
        mostCaptained: null,
      })),
    },
    currentGw: 3,
    gameweekIds: [1, 2, 3],
    points: { 1: points, 2: points, 3: points },
    // P13 is booked in GW1; P2 (always benched) is sent off in GW1; P14 has a bad GW3.
    incidents: { 1: { 13: [1, 0, 0, 0], 2: [0, 1, 0, 0] }, 2: {}, 3: { 14: [0, 0, 1, 1] } },
    minutes: { 1: {}, 2: {}, 3: {} },
    liveFixtures: null,
    liveUpdatedAt: null,
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

  it("measures each team's gap to the leader", () => {
    expect(computeTeamStats(snapshot()).map((team) => team.gapToLeader)).toEqual([0, 100, 200]);
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
    expect(annRow.totals).toEqual([70, 126, 200]);
    expect(boRow.totals).toEqual([null, 130, 180]);
    expect(annRow.overallRanks).toEqual([4999, 4998, 4997]);
    expect(boRow.overallRanks).toEqual([null, 4998, 4997]);
  });

  it("draws the chart series from the history", () => {
    const series = (id: string) => CHART_SERIES.find((s) => s.id === id)!.values(history);
    expect(DEFAULT_SERIES.id).toBe("position");
    expect(series("position")).toEqual(history.rows.map((row) => row.positions));
    // GW2: Bo leads Ann by 4. GW3: Ann leads Bo by 20.
    expect(series("gap-to-leader")).toEqual([
      [0, -4, 0],
      [null, 0, -20],
      [null, null, null],
    ]);
    // Averages over the teams with a total that week: 70, 128, 190.
    expect(series("vs-average")).toEqual([
      [0, -2, 10],
      [null, 2, -10],
      [null, null, null],
    ]);
    // Ids are names in the page address: unique, and in its alphabet.
    expect(history.rows[0].chips).toEqual(["3xc", "wildcard", "3xc"]);
    expect(history.rows[1].chips).toEqual([null, "bboost", "freehit"]);
    const ids = CHART_SERIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/));
  });

  it("measures every score against the league's average that week", () => {
    const { averages, against } = scoresAgainstWeekAverage(history);
    // GW1: only Ann had joined, so the average is her score alone.
    expect(averages).toEqual([70, 68, 62]);
    expect(against).toEqual([
      [0, -12, 12],
      [null, 12, -12],
      [null, null, null],
    ]);
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

describe("transferOutcomes", () => {
  const transfer = (gw: number, playerIn: number, playerOut: number) => ({
    gw, playerIn, playerOut, inCost: 50, outCost: 50,
  });
  const score = (id: number) => id;

  it("judges each transfer of the gameweek by its points", () => {
    const outcomes = transferOutcomes([transfer(2, 9, 3), transfer(3, 8, 5)], 3, score);
    expect(outcomes).toEqual([{ playerIn: 8, playerOut: 5, gain: 3 }]);
  });

  it("joins a player bought and sold again before the deadline into one transfer", () => {
    // On a wildcard: P8 for P3, then P12 for P8; P4 out for P9, then back for P9.
    const outcomes = transferOutcomes(
      [transfer(3, 8, 3), transfer(3, 9, 4), transfer(3, 12, 8), transfer(3, 4, 9)],
      3,
      score
    );
    expect(outcomes).toEqual([{ playerIn: 12, playerOut: 3, gain: 9 }]);
  });
});

describe("pointsAfterSale", () => {
  const transfer = (gw: number, playerIn: number, playerOut: number) => ({
    gw, playerIn, playerOut, inCost: 50, outCost: 50,
  });
  const gameweeks = [1, 2, 3, 4, 5, 6, 7, 8];
  // A player scores his id each gameweek; the squad is never checked unless a test says so.
  const score = (_gw: number, id: number) => id;
  const nowhere = () => false;

  it("counts a sold player's points from the sale to the latest gameweek", () => {
    expect(pointsAfterSale([transfer(6, 9, 3)], gameweeks, new Set(), score, nowhere)).toEqual([
      { playerId: 3, gw: 6, points: 3 * 3 }, // GW6, 7 and 8
    ]);
  });

  it("stops counting when the player is bought back, and counts a second sale afresh", () => {
    const sales = pointsAfterSale(
      [transfer(2, 9, 3), transfer(5, 3, 9), transfer(7, 10, 3)],
      gameweeks,
      new Set(),
      score,
      nowhere
    );
    expect(sales).toEqual([
      { playerId: 3, gw: 2, points: 3 * 3 }, // GW2-4, back for GW5
      { playerId: 9, gw: 5, points: 9 * 4 }, // GW5-8
      { playerId: 3, gw: 7, points: 3 * 2 }, // GW7-8
    ]);
  });

  it("leaves out Free Hit transfers, wildcard chains and weeks the player was back on a Free Hit", () => {
    const sales = pointsAfterSale(
      [
        // Wildcard for GW2: P8 in for P3, then P12 in for P8. P8 was never in the squad.
        transfer(2, 8, 3),
        transfer(2, 12, 8),
        // Free Hit in GW4: P3 back for the week, P5 out for the week.
        transfer(4, 3, 5),
      ],
      gameweeks,
      new Set([4]),
      score,
      (gw, id) => gw === 4 && id === 3
    );
    expect(sales).toEqual([{ playerId: 3, gw: 2, points: 3 * 6 }]); // GW2-8 but GW4
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

  it("counts the hits whose transfers gained more than they cost", () => {
    // Ann's GW2 hit bought nothing; Bo took none.
    expect([ann.hitWeeks, ann.hitsPaidOff]).toEqual([1, 0]);
    expect([bo.hitWeeks, bo.hitsPaidOff]).toEqual([0, 0]);
    // Bo's +3 transfer pays for a 2-point hit, not for a 4-point one.
    for (const [cost, paidOff] of [[2, 1], [4, 0]]) {
      const withHit = snapshot();
      withHit.histories[200].gameweeks[1].transfersCost = cost;
      const boNow = computeTeamStats(withHit)[1];
      expect([boNow.hitWeeks, boNow.hitsPaidOff]).toEqual([1, paidOff]);
    }
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

  it("finds the sold player who scored most since: seller's remorse", () => {
    // Bo sold P13 for GW3, where he scored 13.
    expect(bo.sellersRemorse).toEqual({ name: "P13", gw: 3, points: 13 });
    expect(ann.sellersRemorse).toBeNull();
    expect(cy.sellersRemorse).toBeNull();
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

  it("compares each score with the league's average, leaving out a manager without a team", () => {
    // Ann 74 and Bo 50 average 62; Cy had no team.
    expect([ann.vsAverage, bo.vsAverage, cy.vsAverage]).toEqual([12, -12, null]);
  });

  it("marks the vice captain stepping in", () => {
    expect([ann.viceStepIn, bo.viceStepIn, cy.viceStepIn]).toEqual([false, false, false]);
    // In GW2 Ann's captain did not play and FPL gave the vice captain x2.
    expect(computeGameweekStats(snapshot(), 2)[0].viceStepIn).toBe(true);
  });

  it("leaves the projected position change out of a finished gameweek", () => {
    expect(ann.projectedPositionChange).toBeNull();
  });

  it("measures the gap to the leader and to the team above on the total", () => {
    // Totals 200, 180 and 0 (Cy has no history; the standings say 0).
    expect([ann.total, bo.total, cy.total]).toEqual([200, 180, 0]);
    expect([ann.gapToLeader, bo.gapToLeader, cy.gapToLeader]).toEqual([0, 20, 200]);
    expect([ann.gapToAbove, bo.gapToAbove, cy.gapToAbove]).toEqual([null, 20, 180]);
    // After GW2 Bo led Ann 130 to 126.
    const [annThen, boThen] = computeGameweekStats(snapshot(), 2);
    expect([annThen.gapToLeader, annThen.gapToAbove, boThen.gapToAbove]).toEqual([4, 4, null]);
  });

  it("lists cards, own goals and missed penalties of the players who count", () => {
    // P14 scored an own goal and missed a penalty in GW3; both teams start him.
    expect([ann.mishaps, ann.mishapCount]).toEqual([["P14 (own goal, missed penalty)"], 2]);
    expect([bo.mishapCount, cy.mishapCount]).toEqual([2, 0]);
  });

  it("lists starters who blanked or were not replaced, once minutes are known", () => {
    // No minutes at all: nobody can be said not to have played.
    expect([ann.blanks, ann.notReplaced]).toEqual([[], []]);
    // Everyone played but P3. P1 (in goal) scored 1 point; P2, on the bench, 2.
    const withMinutes = snapshot();
    withMinutes.minutes[3] = Object.fromEntries(
      players.filter((p) => p.id !== 3).map((p) => [p.id, 90])
    );
    const [annNow] = computeGameweekStats(withMinutes);
    expect(annNow.blanks).toEqual(["P1"]);
    // FPL's final picks have P3 still in the eleven: nobody came on for him.
    expect(annNow.notReplaced).toEqual(["P3"]);
  });

  it("finds the players who swung the gameweek for and against each team", () => {
    // Ann tripled P14 where Bo doubled him: (3 − 2.5) × 14 = +7. Ann did not
    // have Bo's P16: (0 − 0.5) × 16 = −8.
    expect([ann.swingGain, ann.swingLoss]).toEqual([
      { name: "P14", count: 7 },
      { name: "P16", count: -8 },
    ]);
    expect([bo.swingGain, bo.swingLoss]).toEqual([
      { name: "P16", count: 8 },
      { name: "P14", count: -7 },
    ]);
    expect([cy.swingGain, cy.swingLoss]).toEqual([null, null]);
  });

  it("adds up the swings to the score against the league's average", () => {
    // From the picks, Ann scores 112 and Bo 101: 5.5 either side of 106.5.
    const league = leagueGameweek(snapshot(), 3);
    const total = (teamId: number) =>
      [...playerSwings(league, teamId).values()].reduce((sum, swing) => sum + swing, 0);
    expect([total(100), total(200), total(300)]).toEqual([5.5, -5.5, 0]);
  });

  it("judges each transfer by this gameweek's points, before and after the hit", () => {
    // Bo bought P16 (16 points) for P13 (13). Ann made no transfers.
    expect([bo.transferGain, bo.transferGainAfterHit, bo.transferOutcomes]).toEqual([
      3,
      3,
      ["P16 for P13 (+3)"],
    ]);
    expect([ann.transferGain, ann.transferGainAfterHit, ann.transferOutcomes]).toEqual([
      null,
      null,
      [],
    ]);
    // With a 4-point hit, the transfer did not pay for itself.
    const withHit = snapshot();
    withHit.histories[200].gameweeks[1].transfersCost = 4;
    expect(computeGameweekStats(withHit)[1].transferGainAfterHit).toBe(-1);
  });

  it("counts the points of players no other team counts on", () => {
    // Bo does not have P13; Ann does not have P16.
    expect([ann.uniquePoints, ann.uniquePlayers]).toEqual([13, ["P13 (13)"]]);
    expect([bo.uniquePoints, bo.uniquePlayers]).toEqual([16, ["P16 (16)"]]);
    expect([cy.uniquePoints, cy.uniquePlayers]).toEqual([null, []]);
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

describe("computeGameweekStats for an earlier gameweek", () => {
  it("reports that gameweek's scores, teams and chips", () => {
    const [ann, bo] = computeGameweekStats(snapshot(), 2);
    expect([ann.score, ann.hit, ann.netScore]).toEqual([60, 4, 56]);
    expect([ann.captain, ann.chip]).toEqual(["P13", null]);
    expect([bo.netScore, bo.captain, bo.chip]).toEqual([80, "P14", "Bench Boost"]);
    expect([bo.leagueGameweekRank, ann.leagueGameweekRank]).toEqual([1, 2]);
  });

  it("works out the league positions from the running totals", () => {
    // After GW2 Bo led with 130 to Ann's 126. Ann had been first after GW1,
    // when she was alone in the league; Bo has no earlier position to compare.
    const [ann, bo] = computeGameweekStats(snapshot(), 2);
    expect([bo.position, bo.positionChange]).toEqual([1, null]);
    expect([ann.position, ann.positionChange, ann.positionTied]).toEqual([2, -1, false]);
  });

  it("leaves out managers who had not joined yet", () => {
    const rows = computeGameweekStats(snapshot(), 1);
    expect(rows.map((row) => row.teamName)).toEqual(["Ann FC"]);
    expect([rows[0].position, rows[0].positionChange, rows[0].chip]).toEqual([
      1,
      null,
      "Triple Captain",
    ]);
  });

  it("returns nothing for a gameweek that has not been played", () => {
    expect(computeGameweekStats(snapshot(), 9)).toEqual([]);
  });

  // In GW2 Ann's captain P13 did not play. FPL's final picks show P7 in his
  // place and P13 on the bench, with the armband passed to P8.
  const withSubs = (): LeagueSnapshot => {
    const base = snapshot();
    const ann = base.picks[2][100]!;
    const picks = ann.picks.map(([id, multiplier, role]): Pick =>
      id === 13 ? [7, 1, PICK_NONE] : id === 7 ? [13, 0, PICK_CAPTAIN] : [id, multiplier, role]
    );
    return {
      ...base,
      picks: {
        ...base.picks,
        2: { ...base.picks[2], 100: { ...ann, picks, autoSubs: [[7, 13]] }, 200: { ...base.picks[2][200]!, autoSubs: [] } },
      },
    };
  };

  it("lists the automatic substitutions FPL made, and what they added", () => {
    const [ann, bo] = computeGameweekStats(withSubs(), 2);
    expect(ann.automaticSubs).toEqual(["P7 for P13", "Armband to P8"]);
    // P7's 7 points, and P8's second 8 with the armband.
    expect(ann.automaticSubPoints).toBe(7 + 8);
    expect([bo.automaticSubs, bo.automaticSubPoints]).toEqual([[], 0]);
  });

  it("does not know the substitutions when the picks were cached without them", () => {
    const [ann] = computeGameweekStats(snapshot(), 2);
    expect([ann.automaticSubs, ann.automaticSubPoints]).toEqual([[], null]);
  });

  it("compares the score with FPL's average and the captain with FPL's most captained", () => {
    const base = snapshot();
    const withFpl: LeagueSnapshot = {
      ...base,
      bootstrap: {
        ...base.bootstrap,
        gameweeks: base.bootstrap.gameweeks.map((g) =>
          g.id === 2 ? { ...g, averageScore: 50, highestScore: 120, mostCaptained: 14 } : g
        ),
      },
    };
    const [ann, bo] = computeGameweekStats(withFpl, 2);
    // Ann 56 after her hit, Bo 80.
    expect([ann.vsGlobalAverage, bo.vsGlobalAverage]).toEqual([6, 30]);
    // Ann's armband went to P8 (8 x 2) where P14 scored 14 x 2; Bo captained P14.
    expect([ann.vsMostCaptained, bo.vsMostCaptained]).toEqual([16 - 28, 0]);
    // Without FPL's figures, nothing to compare with.
    expect([computeGameweekStats(base, 2)[0].vsGlobalAverage, computeGameweekStats(base, 2)[0].vsMostCaptained])
      .toEqual([null, null]);
  });
});

/** A record without its standout score, which the tests below check apart. */
const facts = (records: TeamRecord<string>[]) =>
  records.map(({ kind, teams, value }) => ({ kind, teams, value }));

describe("teamRecord and pickHighlights", () => {
  const league = (...values: number[]) =>
    values.map((value, i) => ({ teamName: "ABCDEFGH"[i], value }));
  const byValue = (row: { value: number }) => row.value;

  it("measures the gap to the median in units of the league's spread", () => {
    // Median 2; the average distance from it is 8 / 4 = 2.
    expect(teamRecord("x", league(10, 2, 2, 2), byValue)?.standout).toBe(4);
  });

  it("uses the gap worth noticing when the league is spread less than that", () => {
    expect(teamRecord("x", league(10, 2, 2, 2), byValue, { scale: 4 })?.standout).toBe(2);
  });

  it("makes a shared record stand out less", () => {
    // Median 6, spread 4: a gap of one spread, shared by two teams.
    const shared = teamRecord("x", league(10, 10, 2, 2), byValue);
    expect(shared?.teams).toEqual(["A", "B"]);
    expect(shared?.standout).toBeCloseTo(1 / Math.SQRT2);
  });

  it("gives no standout to a record every team holds", () => {
    expect(teamRecord("x", league(3, 3, 3), byValue)?.standout).toBe(0);
  });

  const record = (kind: string, standout: number) => ({ kind, teams: ["A"], value: 1, standout });

  it("puts the pinned records first, then the rest by standout, up to the limit", () => {
    const records = [record("a", 2), record("b", 5), record("pin", 0), record("c", 3)];
    expect(pickHighlights(records, { pinned: ["pin"], max: 3 }).map((r) => r.kind)).toEqual([
      "pin",
      "b",
      "c",
    ]);
    expect(pickHighlights(records).map((r) => r.kind)).toEqual(["b", "c", "a"]);
  });

  it("gives cards only to records that stand out, but always shows the minimum", () => {
    const records = [record("a", 1), record("b", 5), record("c", 1.5), record("d", 0.5), record("e", 2)];
    // b, e and c earn a card; a and d do not.
    expect(pickHighlights(records).map((r) => r.kind)).toEqual(["b", "e", "c"]);
    expect(pickHighlights(records, { min: 4 }).map((r) => r.kind)).toEqual(["b", "e", "c", "a"]);
    // A quiet week: one record stands out, the closest to it make up three.
    const quiet = [record("a", 1), record("b", 0.2), record("pin", 0), record("c", 1.6)];
    expect(pickHighlights(quiet, { pinned: ["pin"] }).map((r) => r.kind)).toEqual(["pin", "c", "a"]);
  });
});

describe("computeGameweekHighlights", () => {
  const rows = computeGameweekStats(snapshot());
  const [ann, bo, cy] = rows;

  it("names the holder of each record, the winner first and the rest by how far they stand out", () => {
    // Nobody climbed or took a hit, so those two records are left out. The
    // lowest score is as far from the median as the winner's. The others
    // fall short of the gap worth noticing (4 points): the most unique
    // points (16 against 13) and Bo's transfer (+3 against none) stand 1.5
    // above the median, the captaincy loss 1 and the swings (8 against 7)
    // 0.5. The bench is level.
    expect(facts(computeGameweekHighlights(rows, EVERY_RECORD))).toEqual([
      { kind: "winner", teams: ["Ann FC"], value: 74 },
      { kind: "lowest", teams: ["Bo United"], value: 50 },
      { kind: "unique", teams: ["Bo United"], value: 16 },
      { kind: "transfers", teams: ["Bo United"], value: 3 },
      { kind: "captaincy", teams: ["Bo United"], value: 2 },
      { kind: "swing", teams: ["Bo United"], value: 8 },
      { kind: "swingAgainst", teams: ["Ann FC"], value: 8 },
      { kind: "bench", teams: ["Ann FC", "Bo United"], value: 3 },
    ]);
  });

  it("shows only the minimum of cards in a gameweek where nothing stands out", () => {
    // In a league of two, no record stands out enough to earn a card: the
    // winner and the two records closest to standing out make up three.
    expect(computeGameweekHighlights(rows).map((record) => record.kind)).toEqual([
      "winner",
      "lowest",
      "unique",
    ]);
  });

  it("names the player behind a swing", () => {
    const highlights = computeGameweekHighlights(rows, EVERY_RECORD);
    // Bo's P16, whom Ann did not have.
    expect(highlights.find((h) => h.kind === "swing")?.detail).toBe("P16");
  });

  it("reports the biggest climb and the biggest hit when there is one", () => {
    const highlights = facts(
      computeGameweekHighlights([ann, { ...bo, positionChange: 2, hit: 8, netScore: 42 }])
    );
    expect(highlights).toContainEqual({ kind: "climber", teams: ["Bo United"], value: 2 });
    expect(highlights).toContainEqual({ kind: "hit", teams: ["Bo United"], value: 8 });
  });

  it("has no lowest score when every team scored the same", () => {
    const kinds = computeGameweekHighlights([ann, { ...bo, netScore: ann.netScore }]).map(
      (highlight) => highlight.kind
    );
    expect(kinds).toContain("winner");
    expect(kinds).not.toContain("lowest");
  });

  it("gives no records to a manager without a team this gameweek", () => {
    expect(computeGameweekHighlights([cy])).toEqual([]);
  });
});

describe("computeSeasonHighlights", () => {
  const rows = computeTeamStats(snapshot());

  it("names the holder of each season record", () => {
    const highlights = facts(computeSeasonHighlights(rows, EVERY_RECORD));
    expect(highlights).toHaveLength(7);
    expect(highlights).toEqual(expect.arrayContaining([
      // Ann had the top score in GW1 (alone in the league) and GW3; Bo in GW2.
      { kind: "gameweekWins", teams: ["Ann FC"], value: 2 },
      { kind: "highestScore", teams: ["Bo United"], value: 80 },
      // Bo's one transfer, P13 out for P16, gained 3. Ann made none and paid a hit.
      { kind: "transfers", teams: ["Bo United"], value: 3 },
      // P13 scored 13 for GW3 after Bo sold him.
      { kind: "sellersRemorse", teams: ["Bo United"], value: 13 },
      // Ann lost 8 to her captain choices over the season, Bo 3.
      { kind: "captaincy", teams: ["Ann FC"], value: 8 },
      { kind: "bench", teams: ["Ann FC"], value: 9 },
      { kind: "yellowCards", teams: ["Ann FC"], value: 1 },
    ]));
  });

  it("leaves out a record nobody holds", () => {
    const kinds = computeSeasonHighlights(
      rows.map((row) => ({ ...row, transferGainAfterHits: -4, yellowCards: 0 }))
    ).map((highlight) => highlight.kind);
    expect(kinds).not.toContain("transfers");
    expect(kinds).not.toContain("yellowCards");
    expect(kinds).toContain("gameweekWins");
  });

  it("names the player behind seller's remorse", () => {
    const highlights = computeSeasonHighlights(rows, EVERY_RECORD);
    expect(highlights.find((h) => h.kind === "sellersRemorse")?.detail).toBe("P13");
  });

  it("returns nothing for a league without teams", () => {
    expect(computeSeasonHighlights([])).toEqual([]);
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

  it("works out what a player costs the teams that do not start him", () => {
    // P14's 14 points at an average multiplier of 2.5; nobody starts P2.
    expect(byName("P14").nonStarterCost).toBe(35);
    expect(byName("P2").nonStarterCost).toBe(0);
  });

  it("leaves the live columns empty once the gameweek is finished", () => {
    expect([byName("P1").provisionalBonus, byName("P1").liveStatus]).toEqual([null, null]);
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

// Live projection. Each player is given a club of his own (club id = player
// id), so a test can say whose match is over, being played or still to come.
const livePlayers: Player[] = players.map((p) => ({ ...p, clubId: p.id }));

function liveFixture(club: number, state: Partial<LiveFixture>): LiveFixture {
  return {
    id: club,
    homeClubId: club,
    awayClubId: 100 + club,
    kickoff: "2026-11-21T15:00:00Z",
    started: true,
    done: true,
    homeScore: 0,
    awayScore: 0,
    minutes: 90,
    bonusAdded: true,
    bps: [],
    ...state,
  };
}

/**
 * Every player has played a finished match and scored his id in points,
 * except those listed: `out` did not play in a finished match, `pending`
 * has a match still to come, and `playing` is on the pitch in a match
 * whose bonus is not yet added (where he leads the bonus points system).
 */
function liveSetup({
  out = [],
  pending = [],
  playing = [],
}: { out?: number[]; pending?: number[]; playing?: number[] } = {}) {
  const fixtures = livePlayers.map((p) =>
    pending.includes(p.id)
      ? liveFixture(p.id, { started: false, done: false, bonusAdded: false })
      : playing.includes(p.id)
      ? liveFixture(p.id, { done: false, bonusAdded: false, bps: [[p.id, 30], [99, 10]] })
      : liveFixture(p.id, {})
  );
  const scored = Object.fromEntries(
    livePlayers.map((p) => [p.id, out.includes(p.id) || pending.includes(p.id) ? 0 : p.id])
  );
  const minutes = Object.fromEntries(
    livePlayers
      .filter((p) => !out.includes(p.id) && !pending.includes(p.id))
      .map((p) => [p.id, 90])
  );
  return {
    fixtures,
    points: scored,
    minutes,
    live: liveGameweek(fixtures, scored, minutes, livePlayers),
  };
}

const sumOf = (ids: number[]) => ids.reduce((total, id) => total + id, 0);

describe("provisionalBonus", () => {
  const bonusOf = (bps: [number, number][], state: Partial<LiveFixture> = {}) =>
    Object.fromEntries(
      provisionalBonus([liveFixture(1, { done: false, bonusAdded: false, bps, ...state })])
    );

  it("gives 3, 2 and 1 to the three best scores", () => {
    expect(bonusOf([[1, 40], [2, 30], [3, 20], [4, 10]])).toEqual({ 1: 3, 2: 2, 3: 1 });
  });

  it("shares a place between players level, skipping the next place", () => {
    expect(bonusOf([[1, 40], [2, 40], [3, 20], [4, 10]])).toEqual({ 1: 3, 2: 3, 3: 1 });
    expect(bonusOf([[1, 40], [2, 30], [3, 30], [4, 10]])).toEqual({ 1: 3, 2: 2, 3: 2 });
    expect(bonusOf([[1, 40], [2, 30], [3, 20], [4, 20]])).toEqual({ 1: 3, 2: 2, 3: 1, 4: 1 });
  });

  it("gives nothing while most players are level, as in a match's first minutes", () => {
    expect(bonusOf([[1, 3], [2, 3], [3, 3], [4, 3], [5, 3]])).toEqual({});
  });

  it("gives nothing before kick-off, or once FPL has added the bonus", () => {
    expect(bonusOf([[1, 40]], { started: false })).toEqual({});
    expect(bonusOf([[1, 40]], { bonusAdded: true })).toEqual({});
  });
});

describe("projectTeam", () => {
  const starters = sumOf(STARTERS) + 13; // the captain, P13, scores twice

  it("adds nothing when every starter has played", () => {
    const projection = projectTeam(team({}), liveSetup().live);
    expect(projection.livePoints).toBe(starters);
    expect(projection.points).toBe(starters);
    expect(projection.subs).toEqual([]);
    expect(projection.playersLeft).toBe(0);
  });

  it("brings on the first substitute who keeps the formation valid", () => {
    // Both forwards miss out. P7 (a defender) can replace P13, but P14 then
    // needs a forward, so P12 is passed over for P15.
    const projection = projectTeam(team({ captain: 8 }), liveSetup({ out: [13, 14] }).live);
    expect(projection.subs).toEqual([[7, 13], [15, 14]]);
    expect(projection.points).toBe(sumOf(STARTERS) - 13 - 14 + 7 + 15 + 8);
  });

  it("replaces a goalkeeper only with the substitute goalkeeper", () => {
    const projection = projectTeam(team({}), liveSetup({ out: [1] }).live);
    expect(projection.subs).toEqual([[2, 1]]);
  });

  it("waits for a substitute whose match is still to come", () => {
    const projection = projectTeam(team({}), liveSetup({ out: [9], pending: [7] }).live);
    // P12 has played, but P7 comes first on the bench and may yet play.
    expect(projection.subs).toEqual([]);
    expect(projection.points).toBe(starters - 9);
  });

  it("passes the armband to the vice captain when the captain did not play", () => {
    const projection = projectTeam(team({}), liveSetup({ out: [13] }).live);
    expect(projection.armbandTo).toBe(8);
    expect(projection.subs).toEqual([[7, 13]]);
    expect(projection.points).toBe(sumOf(STARTERS) - 13 + 7 + 8);
  });

  it("keeps the armband with a captain whose match is still to come", () => {
    const projection = projectTeam(team({}), liveSetup({ pending: [13] }).live);
    expect(projection.armbandTo).toBeNull();
    expect(projection.playersLeft).toBe(1);
    expect(projection.left).toEqual([13]);
    expect(projection.armband).toBe(13);
  });

  it("puts a starter who is taken off in his substitute's place on the bench", () => {
    const projection = projectTeam(team({}), liveSetup({ out: [9] }).live);
    expect(projection.subs).toEqual([[7, 9]]);
    expect(projection.bench).toEqual([2, 9, 12, 15]);
  });

  it("adds provisional bonus, doubled for the captain", () => {
    const projection = projectTeam(team({}), liveSetup({ playing: [13, 3] }).live);
    expect(projection.bonus).toBe(3 * 2 + 3);
    expect(projection.points).toBe(starters + 9);
    expect(projection.playersLeft).toBe(2);
  });

  it("makes no substitutions under Bench Boost", () => {
    const projection = projectTeam(team({ chip: "bboost" }), liveSetup({ out: [9] }).live);
    expect(projection.subs).toEqual([]);
    expect(projection.points).toBe(starters - 9 + sumOf(BENCH));
  });

  it("changes nothing once FPL has made the substitutions", () => {
    // FPL brought P7 on for P13, the captain, and moved the armband to P8.
    const done = team({ captainMultiplier: 0, viceMultiplier: 2, swap: [13, 7] });
    done.picks[11] = [2, 0, PICK_NONE];
    done.picks[12] = [13, 0, PICK_CAPTAIN];
    const projection = projectTeam(done, liveSetup({ out: [13] }).live);
    expect(projection.subs).toEqual([]);
    expect(projection.armbandTo).toBeNull();
    expect(projection.points).toBe(projection.livePoints);
  });
});

describe("computeGameweekStats while the gameweek is played", () => {
  // Ann's P13 is still to play; Bo's captain P14 did not play.
  const { fixtures, points: scored, minutes } = liveSetup({ pending: [13], out: [14] });
  const base = snapshot();
  const playing: LeagueSnapshot = {
    ...base,
    bootstrap: { ...base.bootstrap, players: livePlayers },
    points: { ...base.points, 3: scored },
    minutes: { 1: {}, 2: {}, 3: minutes },
    liveFixtures: fixtures,
  };
  const [ann, bo, cy] = computeGameweekStats(playing);

  it("works the score out from the picks", () => {
    // Ann's triple captain P14 did not play; P13 has not played yet.
    expect(ann.score).toBe(sumOf(STARTERS) - 13 - 14);
    expect(ann.playersLeft).toBe(1);
  });

  it("projects the score, total and position", () => {
    // Bo: P16 is in for P13. P14, the captain, is replaced by P7 and P8
    // takes the armband.
    expect(bo.automaticSubs).toEqual(["P7 for P14", "Armband to P8"]);
    expect(bo.automaticSubPoints).toBe(7 + 8);
    expect(bo.projectedScore).toBe(bo.score + 15);
    expect(bo.projectedTotal).toBe(130 + bo.projectedScore!);
    expect(ann.projectedTotal).toBe(126 + ann.projectedScore!);
    // Ann's armband also passes to P8, but Bo overtakes: 218 against 206.
    expect([ann.projectedTotal, bo.projectedTotal]).toEqual([206, 218]);
    expect([bo.projectedPosition, ann.projectedPosition, cy.projectedPosition]).toEqual([1, 2, 3]);
  });

  it("names the players still to play, and counts the bench after the substitutions", () => {
    expect(ann.stillToPlay).toEqual(["P13"]);
    // P7 came on for P14, who takes his place on the bench with 0 points.
    expect(ann.benchPoints).toBe(2 + 0 + 12 + 15);
    expect(ann.topBenched).toEqual({ name: "P15", count: 15 });
  });

  it("lists the matches being played, and how many teams have a player in each", () => {
    const { fixtures: on, points: onPoints, minutes: onMinutes } = liveSetup({ playing: [5], pending: [13] });
    const clubs = livePlayers.map((p) => ({ id: p.id, name: p.name, shortName: p.name }));
    const now: LeagueSnapshot = {
      ...playing,
      bootstrap: { ...playing.bootstrap, clubs },
      points: { ...playing.points, 3: onPoints },
      minutes: { 1: {}, 2: {}, 3: onMinutes },
      liveFixtures: on.map((f) => (f.id === 5 ? { ...f, homeScore: 1, awayScore: 0, minutes: 63 } : f)),
    };
    const matches = leagueMatches(now, leagueGameweek(now, 3));
    // Cy has no team this gameweek: two teams to count.
    expect(matches?.teamCount).toBe(2);
    expect(matches?.matches).toEqual([
      expect.objectContaining({ home: "P5", homeScore: 1, awayScore: 0, minutes: 63, playing: true, teams: 2 }),
    ]);
  });

  it("lists the next matches to kick off between matches", () => {
    const clubs = livePlayers.map((p) => ({ id: p.id, name: p.name, shortName: p.name }));
    const between: LeagueSnapshot = { ...playing, bootstrap: { ...playing.bootstrap, clubs } };
    // P13's match is still to come; only Ann has P13 (Bo sold him for P16).
    const matches = leagueMatches(between, leagueGameweek(between, 3))?.matches;
    expect(matches?.map((m) => [m.home, m.playing, m.teams])).toEqual([["P13", false, 1]]);
    // Not while the gameweek is finished.
    expect(leagueMatches(snapshot(), leagueGameweek(snapshot(), 2))).toBeNull();
  });

  it("gives the highlight cards the projected scores", () => {
    const highlights = computeGameweekHighlights([ann, bo, cy], EVERY_RECORD);
    const winner = highlights.find((h) => h.kind === "winner");
    const lowest = highlights.find((h) => h.kind === "lowest");
    expect([winner?.teams, winner?.value]).toEqual([["Bo United"], 88]);
    expect([lowest?.teams, lowest?.value]).toEqual([["Ann FC"], 80]);
  });

  it("compares the projected position with the position before the gameweek", () => {
    // Before GW3 Bo led Ann 130 to 126, and stays ahead: no change.
    expect([bo.projectedPositionChange, ann.projectedPositionChange, cy.projectedPositionChange])
      .toEqual([0, 0, 0]);
    // With 120 after GW2, Bo was second and overtakes Ann: 208 against 206.
    const behind: LeagueSnapshot = {
      ...playing,
      histories: {
        ...playing.histories,
        200: {
          ...playing.histories[200],
          gameweeks: [week(2, 70, { totalPoints: 120 }), week(3, 50, { totalPoints: 170 })],
        },
      },
    };
    const rows = computeGameweekStats(behind);
    const [first, second, third] = rows;
    expect([first.projectedPositionChange, second.projectedPositionChange, third.projectedPositionChange])
      .toEqual([-1, 1, 0]);
    expect(facts(computeGameweekHighlights(rows))).toContainEqual({
      kind: "climber",
      teams: ["Bo United"],
      value: 1,
    });
  });

  it("compares the projected scores with their average", () => {
    // Ann 80 and Bo 88 average 84.
    expect([ann.vsAverage, bo.vsAverage, cy.vsAverage]).toEqual([-4, 4, null]);
  });

  it("marks the armband about to pass to the vice captain", () => {
    expect([ann.viceStepIn, bo.viceStepIn]).toEqual([true, true]);
  });

  it("works out swing and unique points after the projected substitutions", () => {
    // P14 counts for nobody now. P8 takes the armband: x3 for Ann, x2 for
    // Bo, an average of 2.5, and he scored 8. P7 comes on for both.
    expect([ann.swingGain, ann.swingLoss]).toEqual([
      { name: "P8", count: 4 },
      { name: "P16", count: -8 },
    ]);
    expect(bo.swingGain).toEqual({ name: "P16", count: 8 });
    // P13 is Ann's alone, and has not played yet.
    expect([ann.uniquePoints, ann.uniquePlayers]).toEqual([0, ["P13 (0)"]]);
    expect(bo.uniquePoints).toBe(16);
  });

  it("judges the transfers on the points so far", () => {
    // P13, whom Bo sold, has not played yet.
    expect(bo.transferOutcomes).toEqual(["P16 for P13 (+16)"]);
  });

  it("gives Scout the projected effective ownership and each player's state", () => {
    const scout = computePlayerStats(playing);
    const byName = (name: string) => scout.find((p) => p.name === name)!;
    expect([byName("P14").effectiveOwnership, byName("P8").effectiveOwnership]).toEqual([0, 250]);
    expect(byName("P8").nonStarterCost).toBe(20);
    expect([byName("P1").liveStatus, byName("P13").liveStatus, byName("P14").liveStatus]).toEqual([
      "Played",
      "To play",
      "Did not play",
    ]);
    expect(byName("P1").provisionalBonus).toBe(0);
  });

  it("measures the gaps on the projected totals", () => {
    // Bo 218, Ann 206, Cy 0.
    expect([bo.gapToLeader, ann.gapToLeader, cy.gapToLeader]).toEqual([0, 12, 218]);
    expect([bo.gapToAbove, ann.gapToAbove, cy.gapToAbove]).toEqual([null, 12, 206]);
  });

  it("lists blanks once their matches are over, and starters no substitute can replace", () => {
    // P1 played and scored 1; P13 has not played yet. P14 did not play, but
    // P7 comes on for him.
    expect(ann.blanks).toEqual(["P1"]);
    expect(ann.notReplaced).toEqual([]);
    // With the whole bench out as well, nobody can come on for P14.
    const benchOut = liveSetup({ out: [14, 2, 7, 12, 15] });
    const [annStuck] = computeGameweekStats({
      ...playing,
      points: { ...base.points, 3: benchOut.points },
      minutes: { 1: {}, 2: {}, 3: benchOut.minutes },
      liveFixtures: benchOut.fixtures,
    });
    expect(annStuck.notReplaced).toEqual(["P14"]);
  });

  it("does not count a starter as not replaced while a substitute may still play", () => {
    const benchPending = liveSetup({ out: [14], pending: [7, 12, 15] });
    const [annWaiting] = computeGameweekStats({
      ...playing,
      points: { ...base.points, 3: benchPending.points },
      minutes: { 1: {}, 2: {}, 3: benchPending.minutes },
      liveFixtures: benchPending.fixtures,
    });
    expect(annWaiting.notReplaced).toEqual([]);
  });

  it("counts the captain twice, or three times, among the players left", () => {
    // P13 is left, without the armband.
    expect([ann.playersLeft, ann.multipliedLeft, ann.captainLeft]).toEqual([1, 1, false]);
    // Ann's triple captain P14 still to play.
    const later = liveSetup({ pending: [14] });
    const [annLater] = computeGameweekStats({
      ...playing,
      points: { ...base.points, 3: later.points },
      minutes: { 1: {}, 2: {}, 3: later.minutes },
      liveFixtures: later.fixtures,
    });
    expect([annLater.playersLeft, annLater.multipliedLeft, annLater.captainLeft]).toEqual([
      1,
      3,
      true,
    ]);
  });

  it("gives no projected position change to a team that started this gameweek", () => {
    const started: LeagueSnapshot = {
      ...playing,
      league: {
        ...playing.league,
        managers: playing.league.managers.map((m) =>
          m.entryId === 300 ? { ...m, lastRank: 0 } : m
        ),
      },
    };
    expect(computeGameweekStats(started)[2].projectedPositionChange).toBeNull();
  });

  it("projects a manager without a team at what they have", () => {
    expect(cy.projectedScore).toBe(0);
    expect(cy.automaticSubs).toEqual([]);
  });

  it("leaves the projection out of a finished gameweek", () => {
    const [earlier] = computeGameweekStats(playing, 2);
    expect(earlier.projectedScore).toBeNull();
    expect(earlier.projectedPosition).toBeNull();
  });
});
