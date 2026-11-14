// src/lib/stats/teamStats.ts
// Per-manager statistics, computed from a league snapshot. Pure functions:
// no fetching, so they are easy to test.

import {
  LeagueSnapshot,
  ManagerGameweek,
  ManagerHistory,
  Pick,
  PICK_CAPTAIN,
  Player,
} from "@/lib/fpl/types";
import { computeLeagueHistory } from "./leagueHistory";
import { reviewCaptaincy, topBenched } from "./decisions";

export interface ChipUse {
  gw: number;
  points: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface TeamStats {
  rank: number;
  managerName: string;
  teamName: string;
  teamId: number;
  totalPoints: number;
  overallRank: number | null;
  totalTransfers: number;
  /** Millions. */
  teamValue: number | null;
  /** Millions. */
  bank: number | null;
  wildcardsUsed: number;
  /** Points the tripled player scored (the extra multiple gained by the chip). */
  tripleCaptain: ChipUse[];
  /** Points scored by the four bench players. */
  benchBoost: ChipUse[];
  /** The team's score in the Free Hit gameweek. */
  freeHit: ChipUse[];
  chipsUsed: string[];
  /** Triple Captain plus Bench Boost points. Free Hit has no clean "gain". */
  chipPointsGained: number;
  totalCaptainPoints: number;
  captainPointsPercentage: number;
  mostCaptained: NamedCount | null;
  captainDiversity: number;
  pointsOnBench: number;
  totalTransferPointsDeducted: number;
  highestGameweekScore: number;
  bestOverallRank: number | null;
  worstOverallRank: number | null;
  bestGameweekRank: number | null;
  worstGameweekRank: number | null;
  totalGKPoints: number;
  totalDEFPoints: number;
  totalMIDPoints: number;
  totalFWDPoints: number;
  /** Gameweeks spent in first place in this league. */
  weeksAtTop: number;
  /** Gameweeks spent in last place in this league. */
  weeksAtBottom: number;
  /** Gameweeks with the league's highest score (after hits). */
  gameweekWins: number;
  bestLeaguePosition: number | null;
  worstLeaguePosition: number | null;
  /** Club that has filled the most squad places over the season; count is the percent of all squad places. */
  favouriteClub: NamedCount | null;
  /** Player who has been in the squad for the most gameweeks in total. */
  mostHeld: NamedCount | null;
  /** Longest unbroken run of gameweeks any player has spent in the squad. */
  longestSquadStreak: NamedCount | null;
  /** Of the current starting eleven, the player who has started the most gameweeks in a row. */
  longestServingStarter: NamedCount | null;
  /** Cards, own goals and missed penalties by players who were in the starting eleven. */
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  penaltiesMissed: number;
  /** Points lost over the season by not captaining the best starter each week. */
  captaincyPointsLost: number;
  /** Gameweeks where the armband was on the highest-scoring starter. */
  perfectCaptainWeeks: number;
  /** The biggest score left on the bench in one gameweek. */
  biggestBenchedHaul: LabelledValue | null;
  /**
   * Points the players bought scored in their first gameweek, minus what the
   * players sold scored that same gameweek. Free Hit weeks are left out.
   */
  transferGain: number;
  /** Transfer gain minus the points paid in hits. */
  transferGainAfterHits: number;
  bestTransfer: LabelledValue | null;
  worstTransfer: LabelledValue | null;
  /** The sale that made the most money: selling price minus buying price, in millions. */
  biggestProfitSale: LabelledValue | null;
  /** Profit and loss on every sale this season added up, in millions. */
  totalSaleProfit: number;
}

export interface LabelledValue {
  label: string;
  value: number;
}

const CHIP_NAMES: Record<string, string> = {
  wildcard: "Wildcard",
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
  manager: "Assistant Manager",
};

export function chipLabel(name: string): string {
  return CHIP_NAMES[name] ?? name;
}

/**
 * The pick whose points were actually multiplied: the captain, or the vice
 * captain when the captain did not play. Null when neither played.
 */
export function effectiveCaptain(team: ManagerGameweek): Pick | null {
  let best: Pick | null = null;
  for (const pick of team.picks) {
    if (pick[1] >= 2 && (!best || pick[1] > best[1])) {
      best = pick;
    }
  }
  return best;
}

export interface Streaks {
  /** [playerId, gameweeks]: the longest unbroken run in the squad at any point. */
  longestSquad: [number, number] | null;
  /** [playerId, gameweeks]: the current starter with the longest unbroken run of starts. */
  currentStarter: [number, number] | null;
}

/**
 * Unbroken runs of gameweeks in the squad and in the starting eleven.
 * `teams` is one manager's teams in gameweek order (weeks without a team left out).
 *
 * A Free Hit squad is temporary, so being left out of it does not end a run:
 * the run pauses for that week and continues if the player is back the week
 * after. A player who is in the Free Hit squad still gains the week.
 */
export function computeStreaks(teams: ManagerGameweek[]): Streaks {
  let squadRuns = new Map<number, number>();
  let starterRuns = new Map<number, number>();
  let longestSquad: [number, number] | null = null;

  const advance = (runs: Map<number, number>, present: number[], paused: boolean) => {
    const next = new Map<number, number>();
    for (const id of present) {
      next.set(id, (runs.get(id) ?? 0) + 1);
    }
    if (paused) {
      runs.forEach((run, id) => {
        if (!next.has(id)) next.set(id, run);
      });
    }
    return next;
  };

  for (const team of teams) {
    const freeHit = team.chip === "freehit";
    squadRuns = advance(squadRuns, team.picks.map((p) => p[0]), freeHit);
    starterRuns = advance(
      starterRuns,
      team.picks.filter((p) => p[1] > 0).map((p) => p[0]),
      freeHit
    );
    squadRuns.forEach((run, id) => {
      if (!longestSquad || run > longestSquad[1]) longestSquad = [id, run];
    });
  }

  let currentStarter: [number, number] | null = null;
  const lastTeam = teams[teams.length - 1];
  if (lastTeam) {
    for (const [id, multiplier] of lastTeam.picks) {
      const run = starterRuns.get(id) ?? 0;
      if (multiplier > 0 && (!currentStarter || run > currentStarter[1])) {
        currentStarter = [id, run];
      }
    }
  }
  return { longestSquad, currentStarter };
}

export interface Sale {
  gw: number;
  playerId: number;
  /** Selling price minus buying price, in tenths of a million. */
  profit: number;
}

/**
 * Profit on every player sold. `transfers` must be oldest first.
 *
 * The buying price is what was paid in the transfer that brought the player
 * in. A player who was in the squad from the start has no such transfer, so
 * his start-of-season price is used; for a manager who entered the game late
 * that is an approximation. Free Hit weeks are skipped: those transfers are
 * undone a week later and no money changes hands for good.
 */
export function computeSales(
  transfers: ManagerHistory["transfers"],
  startCost: (playerId: number) => number | undefined,
  freeHitWeeks: Set<number>
): Sale[] {
  const paid = new Map<number, number>();
  const sales: Sale[] = [];
  for (const transfer of transfers) {
    if (freeHitWeeks.has(transfer.gw)) continue;
    const bought = paid.get(transfer.playerOut) ?? startCost(transfer.playerOut);
    if (bought !== undefined) {
      sales.push({
        gw: transfer.gw,
        playerId: transfer.playerOut,
        profit: transfer.outCost - bought,
      });
    }
    paid.delete(transfer.playerOut);
    paid.set(transfer.playerIn, transfer.inCost);
  }
  return sales;
}

function minOrNull(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v > 0);
  return valid.length ? Math.min(...valid) : null;
}

function maxOrNull(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v > 0);
  return valid.length ? Math.max(...valid) : null;
}

export function computeTeamStats(snapshot: LeagueSnapshot): TeamStats[] {
  const players = new Map<number, Player>(
    snapshot.bootstrap.players.map((p) => [p.id, p])
  );
  const playerName = (id: number | undefined) =>
    (id !== undefined && players.get(id)?.name) || "";
  const clubNames = new Map(snapshot.bootstrap.clubs.map((c) => [c.id, c.name]));
  const leagueHistory = new Map(
    computeLeagueHistory(snapshot).rows.map((row) => [row.teamId, row])
  );
  const topOf = (counts: Map<number, number>): [number, number] | null => {
    let top: [number, number] | null = null;
    counts.forEach((count, id) => {
      if (!top || count > top[1]) top = [id, count];
    });
    return top;
  };

  return snapshot.league.managers.map((manager) => {
    const history = snapshot.histories[manager.entryId] ?? {
      gameweeks: [],
      chips: [],
      transfers: [],
    };
    const weeks = history.gameweeks;
    const latest = weeks.length ? weeks[weeks.length - 1] : null;

    const positionPoints = [0, 0, 0, 0, 0]; // index = position id
    let totalCaptainPoints = 0;
    const captainCounts = new Map<number, number>();
    const tripleCaptain: ChipUse[] = [];
    const benchBoost: ChipUse[] = [];
    const clubSlots = new Map<number, number>();
    const weeksOwned = new Map<number, number>();
    const teamsInOrder: ManagerGameweek[] = [];
    let squadSlots = 0;
    const incidentTotals = [0, 0, 0, 0];
    let captaincyPointsLost = 0;
    let perfectCaptainWeeks = 0;
    let biggestBenchedHaul: LabelledValue | null = null;
    const freeHitWeeks = new Set<number>();

    for (const gw of snapshot.gameweekIds) {
      const team = snapshot.picks[gw]?.[manager.entryId];
      const points = snapshot.points[gw];
      if (!team || !points) continue;
      teamsInOrder.push(team);

      const incidents = snapshot.incidents[gw] ?? {};
      for (const [playerId, multiplier] of team.picks) {
        const player = players.get(playerId);
        if (player) {
          positionPoints[player.position] += (points[playerId] ?? 0) * multiplier;
          clubSlots.set(player.clubId, (clubSlots.get(player.clubId) ?? 0) + 1);
        }
        squadSlots++;
        weeksOwned.set(playerId, (weeksOwned.get(playerId) ?? 0) + 1);
        const playerIncidents = incidents[playerId];
        if (playerIncidents && multiplier > 0) {
          playerIncidents.forEach((n, i) => (incidentTotals[i] += n));
        }
      }

      const chosen = team.picks.find((p) => p[2] === PICK_CAPTAIN);
      if (chosen) {
        captainCounts.set(chosen[0], (captainCounts.get(chosen[0]) ?? 0) + 1);
      }

      const armband = effectiveCaptain(team);
      if (armband) {
        totalCaptainPoints += (points[armband[0]] ?? 0) * armband[1];
      }

      const review = reviewCaptaincy(team, points);
      captaincyPointsLost += review.pointsLost;
      if (review.armbandId !== null && review.pointsLost === 0) {
        perfectCaptainWeeks++;
      }
      const benched = topBenched(team, points);
      if (benched && (!biggestBenchedHaul || benched[1] > biggestBenchedHaul.value)) {
        biggestBenchedHaul = {
          label: `${playerName(benched[0]) || "Unknown"}, GW${gw}`,
          value: benched[1],
        };
      }
      if (team.chip === "freehit") freeHitWeeks.add(gw);

      if (team.chip === "3xc") {
        tripleCaptain.push({ gw, points: armband ? points[armband[0]] ?? 0 : 0 });
      }
      if (team.chip === "bboost") {
        const bench = team.picks.slice(11);
        benchBoost.push({
          gw,
          points: bench.reduce((sum, p) => sum + (points[p[0]] ?? 0), 0),
        });
      }
    }

    const freeHit: ChipUse[] = history.chips
      .filter((c) => c.name === "freehit")
      .map((c) => ({
        gw: c.gw,
        points: weeks.find((w) => w.gw === c.gw)?.points ?? 0,
      }));

    let mostCaptained: NamedCount | null = null;
    captainCounts.forEach((count, playerId) => {
      if (!mostCaptained || count > mostCaptained.count) {
        mostCaptained = { name: playerName(playerId) || "Unknown", count };
      }
    });

    // Transfer outcomes: what the player bought scored in his first gameweek,
    // against what the player sold scored that week. Free Hit transfers are
    // undone a week later, so they are left out.
    let transferGain = 0;
    let bestTransfer: LabelledValue | null = null;
    let worstTransfer: LabelledValue | null = null;
    for (const transfer of history.transfers) {
      const weekPoints = snapshot.points[transfer.gw];
      if (!weekPoints || freeHitWeeks.has(transfer.gw)) continue;
      const gain =
        (weekPoints[transfer.playerIn] ?? 0) - (weekPoints[transfer.playerOut] ?? 0);
      transferGain += gain;
      const label = `${playerName(transfer.playerIn) || "Unknown"} for ${
        playerName(transfer.playerOut) || "Unknown"
      }, GW${transfer.gw}`;
      if (!bestTransfer || gain > bestTransfer.value) bestTransfer = { label, value: gain };
      if (!worstTransfer || gain < worstTransfer.value) worstTransfer = { label, value: gain };
    }

    const sales = computeSales(
      history.transfers,
      (id) => players.get(id)?.startCost,
      freeHitWeeks
    );
    let biggestProfitSale: LabelledValue | null = null;
    for (const sale of sales) {
      if (sale.profit > 0 && (!biggestProfitSale || sale.profit / 10 > biggestProfitSale.value)) {
        biggestProfitSale = {
          label: `${playerName(sale.playerId) || "Unknown"}, GW${sale.gw}`,
          value: sale.profit / 10,
        };
      }
    }

    const topClub = topOf(clubSlots);
    const topPlayer = topOf(weeksOwned);
    const streaks = computeStreaks(teamsInOrder);
    const named = (entry: [number, number] | null): NamedCount | null =>
      entry ? { name: playerName(entry[0]) || "Unknown", count: entry[1] } : null;
    const leagueRow = leagueHistory.get(manager.entryId);

    const hits = weeks.reduce((sum, w) => sum + w.transfersCost, 0);
    const grossPoints = manager.total + hits;

    return {
      rank: manager.rank,
      managerName: manager.managerName,
      teamName: manager.teamName,
      teamId: manager.entryId,
      totalPoints: manager.total,
      overallRank: latest?.overallRank ?? null,
      totalTransfers: weeks.reduce((sum, w) => sum + w.transfers, 0),
      teamValue: latest ? latest.value / 10 : null,
      bank: latest ? latest.bank / 10 : null,
      wildcardsUsed: history.chips.filter((c) => c.name === "wildcard").length,
      tripleCaptain,
      benchBoost,
      freeHit,
      chipsUsed: [...history.chips]
        .sort((a, b) => a.gw - b.gw)
        .map((c) => `${chipLabel(c.name)} (GW${c.gw})`),
      chipPointsGained:
        tripleCaptain.reduce((sum, c) => sum + c.points, 0) +
        benchBoost.reduce((sum, c) => sum + c.points, 0),
      totalCaptainPoints,
      captainPointsPercentage:
        grossPoints > 0 ? (totalCaptainPoints / grossPoints) * 100 : 0,
      mostCaptained,
      captainDiversity: captainCounts.size,
      pointsOnBench: weeks.reduce((sum, w) => sum + w.benchPoints, 0),
      totalTransferPointsDeducted: hits,
      highestGameweekScore: weeks.reduce((max, w) => Math.max(max, w.points), 0),
      bestOverallRank: minOrNull(weeks.map((w) => w.overallRank)),
      worstOverallRank: maxOrNull(weeks.map((w) => w.overallRank)),
      bestGameweekRank: minOrNull(weeks.map((w) => w.rank)),
      worstGameweekRank: maxOrNull(weeks.map((w) => w.rank)),
      totalGKPoints: positionPoints[1],
      totalDEFPoints: positionPoints[2],
      totalMIDPoints: positionPoints[3],
      totalFWDPoints: positionPoints[4],
      weeksAtTop: leagueRow?.weeksAtTop ?? 0,
      weeksAtBottom: leagueRow?.weeksAtBottom ?? 0,
      gameweekWins: leagueRow?.gameweekWins ?? 0,
      bestLeaguePosition: leagueRow?.bestPosition ?? null,
      worstLeaguePosition: leagueRow?.worstPosition ?? null,
      favouriteClub: topClub
        ? {
            name: clubNames.get(topClub[0]) ?? "Unknown",
            count: Math.round((topClub[1] / squadSlots) * 100),
          }
        : null,
      mostHeld: named(topPlayer),
      longestSquadStreak: named(streaks.longestSquad),
      longestServingStarter: named(streaks.currentStarter),
      yellowCards: incidentTotals[0],
      redCards: incidentTotals[1],
      ownGoals: incidentTotals[2],
      penaltiesMissed: incidentTotals[3],
      captaincyPointsLost,
      perfectCaptainWeeks,
      biggestBenchedHaul,
      transferGain,
      transferGainAfterHits: transferGain - hits,
      bestTransfer,
      worstTransfer,
      biggestProfitSale,
      totalSaleProfit: sales.reduce((sum, sale) => sum + sale.profit, 0) / 10,
    };
  });
}
