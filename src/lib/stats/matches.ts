// src/lib/stats/matches.ts
// The matches of the gameweek being played, for the strip above the
// Gameweek table: the ones on now (or, between matches, the next to kick
// off), their score, and how many of the league's teams have a player in
// each. A visitor watching live sees which match matters to the league.

import type { LeagueSnapshot } from "@/lib/fpl/types";
import type { LeagueGameweek } from "./leagueGameweek";

export interface LeagueMatch {
  id: number;
  /** Clubs' short names ("ARS"). */
  home: string;
  away: string;
  /** Goals; null before kick-off. */
  homeScore: number | null;
  awayScore: number | null;
  /** Minutes played, as FPL counts them. */
  minutes: number;
  kickoff: string | null;
  playing: boolean;
  /**
   * The league's teams with a player who counts at either club: after the
   * projected substitutions, so a benched player who will not come on is
   * left out.
   */
  teams: number;
}

export interface LeagueMatches {
  matches: LeagueMatch[];
  /** The league's teams that have a team this gameweek, out of which `teams` is counted. */
  teamCount: number;
}

/** Null when the gameweek is not being played. */
export function leagueMatches(
  snapshot: LeagueSnapshot,
  league: LeagueGameweek
): LeagueMatches | null {
  const fixtures = league.live ? snapshot.liveFixtures : null;
  if (!fixtures) return null;
  const playing = fixtures.filter((f) => f.started && !f.done);
  // Between matches, every match of the next kick-off time.
  const nextKickoff = fixtures
    .filter((f) => !f.started && f.kickoff !== null)
    .map((f) => f.kickoff as string)
    .sort()[0];
  const shown =
    playing.length > 0 ? playing : fixtures.filter((f) => !f.started && f.kickoff === nextKickoff);

  const clubOf = new Map(snapshot.bootstrap.players.map((p) => [p.id, p.clubId]));
  const clubName = new Map(snapshot.bootstrap.clubs.map((c) => [c.id, c.shortName]));
  // Club -> the teams with a player there who counts.
  const teamsAt = new Map<number, Set<number>>();
  for (const [teamId, multipliers] of league.multipliers) {
    for (const [playerId, multiplier] of multipliers) {
      const club = clubOf.get(playerId);
      if (multiplier === 0 || club === undefined) continue;
      if (!teamsAt.has(club)) teamsAt.set(club, new Set());
      teamsAt.get(club)!.add(teamId);
    }
  }

  return {
    teamCount: league.multipliers.size,
    matches: [...shown]
      .sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? "") || a.id - b.id)
      .map((f) => ({
        id: f.id,
        home: clubName.get(f.homeClubId) ?? "?",
        away: clubName.get(f.awayClubId) ?? "?",
        homeScore: f.homeScore,
        awayScore: f.awayScore,
        minutes: f.minutes,
        kickoff: f.kickoff,
        playing: f.started && !f.done,
        teams: new Set([
          ...(teamsAt.get(f.homeClubId) ?? []),
          ...(teamsAt.get(f.awayClubId) ?? []),
        ]).size,
      })),
  };
}
