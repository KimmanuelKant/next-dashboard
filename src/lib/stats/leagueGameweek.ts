// src/lib/stats/leagueGameweek.ts
// What the league's teams count on in one gameweek: each player's
// multiplier in each team, and the league's average of it. While the
// gameweek is played, the multipliers are the projected ones (after the
// automatic substitutions and the armband passing) and the points include
// the provisional bonus, as in the Live view. Swing, unique points and
// Scout's effective ownership are all built on this, so that they agree with
// each other and with the projected scores.

import { LeagueSnapshot } from "@/lib/fpl/types";
import { liveGameweek, LiveGameweek, projectTeam, TeamProjection } from "./live";

export interface LeagueGameweek {
  /** The live state of the gameweek; null once FPL has finished it. */
  live: LiveGameweek | null;
  /** Each team's projection while the gameweek is played, by team ID. */
  projections: Map<number, TeamProjection>;
  /**
   * The teams with a squad this gameweek: team ID -> player ID ->
   * multiplier (0 on the bench, 2 or 3 for the armband).
   */
  multipliers: Map<number, Map<number, number>>;
  /** Player ID -> the multipliers of every team added up. */
  multiplierSums: Map<number, number>;
  /** Player ID -> how many teams count him (a multiplier above 0). */
  countedBy: Map<number, number>;
  /** A player's points, with the provisional bonus while the gameweek is played. */
  score: (playerId: number) => number;
  /** The player's multiplier averaged over the teams with a squad; 0 when nobody counts him. */
  averageMultiplier: (playerId: number) => number;
}

export function leagueGameweek(snapshot: LeagueSnapshot, gw: number): LeagueGameweek {
  const points = snapshot.points[gw] ?? {};
  const live =
    gw === snapshot.currentGw && snapshot.liveFixtures
      ? liveGameweek(
          snapshot.liveFixtures,
          points,
          snapshot.minutes[gw] ?? {},
          snapshot.bootstrap.players
        )
      : null;
  const projections = new Map<number, TeamProjection>();
  const multipliers = new Map<number, Map<number, number>>();
  const multiplierSums = new Map<number, number>();
  const countedBy = new Map<number, number>();

  for (const manager of snapshot.league.managers) {
    const team = snapshot.picks[gw]?.[manager.entryId];
    if (!team) continue;
    const projection = live ? projectTeam(team, live) : null;
    if (projection) projections.set(manager.entryId, projection);
    const teamMultipliers =
      projection?.multipliers ?? new Map(team.picks.map(([id, multiplier]) => [id, multiplier]));
    multipliers.set(manager.entryId, teamMultipliers);
    for (const [id, multiplier] of teamMultipliers) {
      multiplierSums.set(id, (multiplierSums.get(id) ?? 0) + multiplier);
      if (multiplier > 0) countedBy.set(id, (countedBy.get(id) ?? 0) + 1);
    }
  }

  return {
    live,
    projections,
    multipliers,
    multiplierSums,
    countedBy,
    score: (id) => (points[id] ?? 0) + (live?.bonus.get(id) ?? 0),
    averageMultiplier: (id) =>
      multipliers.size > 0 ? (multiplierSums.get(id) ?? 0) / multipliers.size : 0,
  };
}

/**
 * What each player won or lost one team against the league this gameweek:
 * (the team's multiplier minus the league's average) times his points. A
 * player the team does not have, or benched, counts against it when the
 * league has him; a captain the league does not share counts for it. Added
 * up, the swings are the team's score before hits less the league's
 * average score. Empty for a team without a squad.
 */
export function playerSwings(league: LeagueGameweek, teamId: number): Map<number, number> {
  const swings = new Map<number, number>();
  const team = league.multipliers.get(teamId);
  if (!team) return swings;
  for (const id of league.multiplierSums.keys()) {
    const swing = ((team.get(id) ?? 0) - league.averageMultiplier(id)) * league.score(id);
    if (swing !== 0) swings.set(id, swing);
  }
  return swings;
}
