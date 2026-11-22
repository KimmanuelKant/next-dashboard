// src/lib/stats/gameweekStats.ts
// Per-manager statistics for one gameweek: the current one, or an earlier
// one the visitor has gone back to. Season-long stats live in teamStats.ts.

import { LeagueSnapshot, PICK_CAPTAIN, PICK_VICE, Player } from "@/lib/fpl/types";
import { reviewCaptaincy, topBenched } from "./decisions";
import { computeLeagueHistory } from "./leagueHistory";
import { teamRecord, TeamRecord } from "./records";
import { chipLabel, NamedCount, sharedRanks } from "./teamStats";

export interface GameweekStats {
  teamId: number;
  teamName: string;
  managerName: string;
  /** League position after this gameweek. */
  position: number;
  /** Another team in the league is level on points and has the same position. */
  positionTied: boolean;
  /**
   * Places gained since last gameweek (negative = dropped); null if unknown.
   * The changes in a league need not cancel out: a team that draws level with
   * the one above gains a place, and the team it joins stays where it was.
   */
  positionChange: number | null;
  /** Gameweek points before transfer hits. */
  score: number;
  hit: number;
  /** Gameweek points after transfer hits. */
  netScore: number;
  /** Rank of the net score within this league this gameweek (1 = best). */
  leagueGameweekRank: number | null;
  /** Rank of the gameweek score among all FPL managers. */
  gameweekRank: number | null;
  overallRank: number | null;
  /** The player chosen as captain. */
  captain: string;
  viceCaptain: string;
  /** Points from the armband, including the multiplier. */
  captainPoints: number;
  /** The starter who would have been the best captain, with their points. */
  bestCaptain: NamedCount | null;
  /** Points lost by not captaining the best starter. */
  captaincyPointsLost: number;
  chip: string | null;
  /** Squad value including the bank, in millions. */
  teamValue: number | null;
  /** Change in squad value since the previous gameweek, in millions. */
  valueChange: number | null;
  transfers: number;
  playersIn: string[];
  playersOut: string[];
  benchPoints: number;
  /** Highest-scoring player left on the bench. */
  topBenched: NamedCount | null;
  /** The player who contributed the most points, including any multiplier. */
  bestPlayer: NamedCount | null;
}

interface Standing {
  position: number;
  tied: boolean;
  /** Places gained since the gameweek before; null if unknown. */
  change: number | null;
}

/**
 * Each manager's league position after a gameweek, by team ID. For the
 * current gameweek these are FPL's own standings. FPL does not keep the
 * standings of earlier gameweeks, so those are worked out from the managers'
 * running totals, as on the League History tab. A manager who had not joined
 * the game by then has no standing.
 */
function standingsAfter(snapshot: LeagueSnapshot, gw: number): Map<number, Standing> {
  const standings = new Map<number, Standing>();
  if (gw === snapshot.currentGw) {
    const tied = sharedRanks(snapshot.league.managers);
    for (const manager of snapshot.league.managers) {
      standings.set(manager.entryId, {
        position: manager.rank,
        tied: tied.has(manager.rank),
        change: manager.lastRank > 0 ? manager.lastRank - manager.rank : null,
      });
    }
    return standings;
  }

  const history = computeLeagueHistory(snapshot);
  const index = history.gameweeks.indexOf(gw);
  const tied = sharedRanks(
    history.rows.flatMap((row) => {
      const rank = row.positions[index];
      return rank == null ? [] : [{ rank }];
    })
  );
  for (const row of history.rows) {
    const position = row.positions[index];
    if (position == null) continue;
    const before = index > 0 ? row.positions[index - 1] : null;
    standings.set(row.teamId, {
      position,
      tied: tied.has(position),
      change: before == null ? null : before - position,
    });
  }
  return standings;
}

/**
 * One row per manager for a gameweek: the current one unless another is
 * asked for. Empty before the season starts, and for a gameweek that has not
 * been played.
 */
export function computeGameweekStats(
  snapshot: LeagueSnapshot,
  gameweek: number | null = snapshot.currentGw
): GameweekStats[] {
  if (gameweek === null || !snapshot.gameweekIds.includes(gameweek)) {
    return [];
  }
  const gw = gameweek;
  const isCurrent = gw === snapshot.currentGw;
  const standings = standingsAfter(snapshot, gw);
  const players = new Map<number, Player>(
    snapshot.bootstrap.players.map((p) => [p.id, p])
  );
  const name = (id: number | null | undefined) =>
    (id != null && players.get(id)?.name) || "";
  const points = snapshot.points[gw] ?? {};
  const earlierGws = snapshot.gameweekIds.filter((id) => id < gw).reverse();

  const rows = snapshot.league.managers.flatMap((manager): GameweekStats[] => {
    const standing = standings.get(manager.entryId);
    if (!standing) {
      return [];
    }
    const team = snapshot.picks[gw]?.[manager.entryId] ?? null;
    const weeks = snapshot.histories[manager.entryId]?.gameweeks ?? [];
    const week = weeks.find((w) => w.gw === gw);
    const previousWeek = [...weeks].reverse().find((w) => w.gw < gw);
    // The standings carry the score of the current gameweek only.
    const score = week?.points ?? (isCurrent ? manager.eventTotal : 0);
    const hit = week?.transfersCost ?? 0;

    // Squad changes: compare with the last earlier squad that was not a
    // temporary Free Hit squad.
    let previousSquad: number[] | null = null;
    for (const earlier of earlierGws) {
      const earlierTeam = snapshot.picks[earlier]?.[manager.entryId];
      if (earlierTeam && earlierTeam.chip !== "freehit") {
        previousSquad = earlierTeam.picks.map((p) => p[0]);
        break;
      }
    }
    const squad = team?.picks.map((p) => p[0]) ?? [];
    const playersIn = previousSquad ? squad.filter((id) => !previousSquad!.includes(id)) : [];
    const playersOut = previousSquad && team ? previousSquad.filter((id) => !squad.includes(id)) : [];

    const review = team ? reviewCaptaincy(team, points) : null;
    const benched = team ? topBenched(team, points) : null;

    let bestPlayer: NamedCount | null = null;
    for (const [playerId, multiplier] of team?.picks ?? []) {
      const contributed = (points[playerId] ?? 0) * multiplier;
      if (multiplier > 0 && (!bestPlayer || contributed > bestPlayer.count)) {
        bestPlayer = { name: name(playerId) || "Unknown", count: contributed };
      }
    }

    const armbandMultiplier =
      team?.picks.find((p) => p[0] === review?.armbandId)?.[1] ?? 0;

    return [{
      teamId: manager.entryId,
      teamName: manager.teamName,
      managerName: manager.managerName,
      position: standing.position,
      positionTied: standing.tied,
      positionChange: standing.change,
      score,
      hit,
      netScore: score - hit,
      leagueGameweekRank: null, // filled in below
      gameweekRank: week?.rank ?? null,
      overallRank: week?.overallRank ?? null,
      captain: name(team?.picks.find((p) => p[2] === PICK_CAPTAIN)?.[0]),
      viceCaptain: name(team?.picks.find((p) => p[2] === PICK_VICE)?.[0]),
      captainPoints: review ? review.armbandPoints * armbandMultiplier : 0,
      bestCaptain:
        review && review.bestId !== null
          ? { name: name(review.bestId) || "Unknown", count: review.bestPoints }
          : null,
      captaincyPointsLost: review?.pointsLost ?? 0,
      chip: team?.chip ? chipLabel(team.chip) : null,
      teamValue: week ? week.value / 10 : null,
      valueChange: week && previousWeek ? (week.value - previousWeek.value) / 10 : null,
      transfers: week?.transfers ?? 0,
      playersIn: playersIn.map((id) => name(id) || "Unknown"),
      playersOut: playersOut.map((id) => name(id) || "Unknown"),
      benchPoints: week?.benchPoints ?? 0,
      topBenched: benched
        ? { name: name(benched[0]) || "Unknown", count: benched[1] }
        : null,
      bestPlayer,
    }];
  });

  // Only managers who had a team this gameweek are ranked.
  const ranked = rows.filter((row) => snapshot.picks[gw]?.[row.teamId]);
  for (const row of ranked) {
    row.leagueGameweekRank =
      1 + ranked.filter((other) => other.netScore > row.netScore).length;
  }
  return rows;
}

/** One of the gameweek's records, for the cards above the table. */
export type GameweekHighlight = TeamRecord<
  "winner" | "climber" | "captaincy" | "bench" | "hit" | "lowest"
>;

/** The gameweek's records. A record nobody holds is left out. */
export function computeGameweekHighlights(rows: GameweekStats[]): GameweekHighlight[] {
  // A manager without a team this gameweek holds no records.
  const played = rows.filter((row) => row.leagueGameweekRank !== null);
  const winner = teamRecord("winner", played, (row) => row.netScore);
  const lowest = teamRecord("lowest", played, (row) => -row.netScore);
  return [
    winner,
    teamRecord("climber", played, (row) => row.positionChange ?? 0, 1),
    teamRecord("captaincy", played, (row) => row.captaincyPointsLost, 1),
    teamRecord("bench", played, (row) => row.benchPoints, 1),
    teamRecord("hit", played, (row) => row.hit, 1),
    // No lowest score when every team scored the same: they are all winners.
    winner && lowest && -lowest.value < winner.value
      ? { ...lowest, value: -lowest.value }
      : null,
  ].filter((record) => record !== null);
}
