// src/lib/stats/gameweekStats.ts
// Per-manager statistics for the current gameweek only. Season-long stats
// live in teamStats.ts.

import { LeagueSnapshot, PICK_CAPTAIN, PICK_VICE, Player } from "@/lib/fpl/types";
import { reviewCaptaincy, topBenched } from "./decisions";
import { chipLabel, NamedCount } from "./teamStats";

export interface GameweekStats {
  teamId: number;
  teamName: string;
  managerName: string;
  /** League position now. */
  position: number;
  /** Places gained since last gameweek (negative = dropped); null if unknown. */
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
  transfers: number;
  playersIn: string[];
  playersOut: string[];
  benchPoints: number;
  /** Highest-scoring player left on the bench. */
  topBenched: NamedCount | null;
  /** The player who contributed the most points, including any multiplier. */
  bestPlayer: NamedCount | null;
}

/** One row per manager for the current gameweek; empty before the season starts. */
export function computeGameweekStats(snapshot: LeagueSnapshot): GameweekStats[] {
  const gw = snapshot.currentGw;
  if (gw === null) {
    return [];
  }
  const players = new Map<number, Player>(
    snapshot.bootstrap.players.map((p) => [p.id, p])
  );
  const name = (id: number | null | undefined) =>
    (id != null && players.get(id)?.name) || "";
  const points = snapshot.points[gw] ?? {};
  const earlierGws = snapshot.gameweekIds.filter((id) => id < gw).reverse();

  const rows = snapshot.league.managers.map((manager): GameweekStats => {
    const team = snapshot.picks[gw]?.[manager.entryId] ?? null;
    const week = snapshot.histories[manager.entryId]?.gameweeks.find(
      (w) => w.gw === gw
    );
    const score = week?.points ?? manager.eventTotal;
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

    return {
      teamId: manager.entryId,
      teamName: manager.teamName,
      managerName: manager.managerName,
      position: manager.rank,
      positionChange: manager.lastRank > 0 ? manager.lastRank - manager.rank : null,
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
      transfers: week?.transfers ?? 0,
      playersIn: playersIn.map((id) => name(id) || "Unknown"),
      playersOut: playersOut.map((id) => name(id) || "Unknown"),
      benchPoints: week?.benchPoints ?? 0,
      topBenched: benched
        ? { name: name(benched[0]) || "Unknown", count: benched[1] }
        : null,
      bestPlayer,
    };
  });

  // Only managers who had a team this gameweek are ranked.
  const ranked = rows.filter((row) => snapshot.picks[gw]?.[row.teamId]);
  for (const row of ranked) {
    row.leagueGameweekRank =
      1 + ranked.filter((other) => other.netScore > row.netScore).length;
  }
  return rows;
}
