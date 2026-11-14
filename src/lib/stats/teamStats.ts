// src/lib/stats/teamStats.ts
// Per-manager statistics, computed from a league snapshot. Pure functions:
// no fetching, so they are easy to test.

import {
  LeagueSnapshot,
  ManagerGameweek,
  Pick,
  PICK_CAPTAIN,
  PICK_VICE,
  Player,
} from "@/lib/fpl/types";

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
  eventTotal: number;
  overallRank: number | null;
  totalTransfers: number;
  transfersThisWeek: number;
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
  captain: string;
  viceCaptain: string;
  highestGameweekScore: number;
  bestOverallRank: number | null;
  worstOverallRank: number | null;
  bestGameweekRank: number | null;
  worstGameweekRank: number | null;
  totalGKPoints: number;
  totalDEFPoints: number;
  totalMIDPoints: number;
  totalFWDPoints: number;
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

  return snapshot.league.managers.map((manager) => {
    const history = snapshot.histories[manager.entryId] ?? {
      gameweeks: [],
      chips: [],
    };
    const weeks = history.gameweeks;
    const latest = weeks.length ? weeks[weeks.length - 1] : null;

    const positionPoints = [0, 0, 0, 0, 0]; // index = position id
    let totalCaptainPoints = 0;
    const captainCounts = new Map<number, number>();
    const tripleCaptain: ChipUse[] = [];
    const benchBoost: ChipUse[] = [];

    for (const gw of snapshot.gameweekIds) {
      const team = snapshot.picks[gw]?.[manager.entryId];
      const points = snapshot.points[gw];
      if (!team || !points) continue;

      for (const [playerId, multiplier] of team.picks) {
        const player = players.get(playerId);
        if (player) {
          positionPoints[player.position] += (points[playerId] ?? 0) * multiplier;
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

    const currentTeam =
      snapshot.currentGw !== null
        ? snapshot.picks[snapshot.currentGw]?.[manager.entryId]
        : null;
    const captainId = currentTeam?.picks.find((p) => p[2] === PICK_CAPTAIN)?.[0];
    const viceId = currentTeam?.picks.find((p) => p[2] === PICK_VICE)?.[0];

    const hits = weeks.reduce((sum, w) => sum + w.transfersCost, 0);
    const grossPoints = manager.total + hits;

    return {
      rank: manager.rank,
      managerName: manager.managerName,
      teamName: manager.teamName,
      teamId: manager.entryId,
      totalPoints: manager.total,
      eventTotal: manager.eventTotal,
      overallRank: latest?.overallRank ?? null,
      totalTransfers: weeks.reduce((sum, w) => sum + w.transfers, 0),
      transfersThisWeek: latest?.transfers ?? 0,
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
      captain: playerName(captainId),
      viceCaptain: playerName(viceId),
      highestGameweekScore: weeks.reduce((max, w) => Math.max(max, w.points), 0),
      bestOverallRank: minOrNull(weeks.map((w) => w.overallRank)),
      worstOverallRank: maxOrNull(weeks.map((w) => w.overallRank)),
      bestGameweekRank: minOrNull(weeks.map((w) => w.rank)),
      worstGameweekRank: maxOrNull(weeks.map((w) => w.rank)),
      totalGKPoints: positionPoints[1],
      totalDEFPoints: positionPoints[2],
      totalMIDPoints: positionPoints[3],
      totalFWDPoints: positionPoints[4],
    };
  });
}
