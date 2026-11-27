// src/lib/stats/habits.ts
// Habits measured against the rest of the league: how much a team's squad
// looks like everyone else's, and whether it plays its chips before or
// after the others. Pure functions over the whole league, since each
// team's number depends on every other team.

import type { ChipWindow, LeagueGameweekPicks, ManagerHistory } from "@/lib/fpl/types";

/**
 * Template score: on average over the gameweeks a team played, the share of
 * the league's other teams that owned each player of its squad, as a
 * percent. 100 is a squad every other team owned too; a squad of
 * differentials comes near 0. `weeks` is the league's picks, one entry per
 * gameweek. A week with fewer than two teams says nothing and is skipped;
 * a team that never had a week with others gets null.
 */
export function templateScores(
  weeks: LeagueGameweekPicks[],
  teamIds: number[]
): Map<number, number | null> {
  const sums = new Map<number, number>();
  const counts = new Map<number, number>();
  for (const picks of weeks) {
    const teams = teamIds.flatMap((id) => {
      const team = picks[id];
      return team ? [{ id, players: team.picks.map((pick) => pick[0]) }] : [];
    });
    if (teams.length < 2) continue;
    const owners = new Map<number, number>();
    for (const { players } of teams) {
      for (const player of players) owners.set(player, (owners.get(player) ?? 0) + 1);
    }
    for (const { id, players } of teams) {
      if (players.length === 0) continue;
      // Others owning each player: the team itself is one of the owners.
      const shared =
        players.reduce((total, player) => total + (owners.get(player)! - 1), 0) /
        players.length /
        (teams.length - 1);
      sums.set(id, (sums.get(id) ?? 0) + shared);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return new Map(
    teamIds.map((id) => {
      const count = counts.get(id);
      return [id, count ? (sums.get(id)! / count) * 100 : null];
    })
  );
}

/**
 * Chip timing: how many gameweeks before (negative) or after (positive) the
 * rest of the league a team plays its chips, on average over the chips it
 * has played. Each play is set against the average gameweek in which the
 * league's teams played that chip in the same window (the same half of the
 * season). Only teams that have played a chip count in the average, so
 * early in a window the first to play look early. A window in which fewer
 * than two plays have been made is left out; a team with no play left gets
 * null.
 */
export function chipTiming(
  chips: Map<number, ManagerHistory["chips"]>,
  windows: ChipWindow[]
): Map<number, number | null> {
  const offsets = new Map<number, number[]>();
  for (const window of windows) {
    const plays = [...chips].flatMap(([id, used]) =>
      used
        .filter((chip) => chip.name === window.name && chip.gw >= window.start && chip.gw <= window.stop)
        .map((chip) => ({ id, gw: chip.gw }))
    );
    if (plays.length < 2) continue;
    const average = plays.reduce((total, play) => total + play.gw, 0) / plays.length;
    for (const { id, gw } of plays) {
      offsets.set(id, [...(offsets.get(id) ?? []), gw - average]);
    }
  }
  return new Map(
    [...chips.keys()].map((id) => {
      const mine = offsets.get(id);
      return [id, mine ? mine.reduce((total, offset) => total + offset, 0) / mine.length : null];
    })
  );
}
