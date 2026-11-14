// src/lib/stats/leagueHistory.ts
// League position and gameweek score of every manager, week by week.

import { LeagueSnapshot } from "@/lib/fpl/types";

export interface LeagueHistoryRow {
  teamId: number;
  teamName: string;
  managerName: string;
  /** League position after each gameweek (index matches `gameweeks`); null before the manager joined. */
  positions: (number | null)[];
  /** Gameweek score after transfer hits; null before the manager joined. */
  scores: (number | null)[];
  weeksAtTop: number;
  weeksAtBottom: number;
  /** Gameweeks with the highest score in the league (ties count for everyone tied). */
  gameweekWins: number;
  bestPosition: number | null;
  worstPosition: number | null;
}

export interface LeagueHistory {
  gameweeks: number[];
  rows: LeagueHistoryRow[];
}

export function computeLeagueHistory(snapshot: LeagueSnapshot): LeagueHistory {
  const gameweeks = snapshot.gameweekIds;
  const rows: LeagueHistoryRow[] = snapshot.league.managers.map((m) => ({
    teamId: m.entryId,
    teamName: m.teamName,
    managerName: m.managerName,
    positions: [],
    scores: [],
    weeksAtTop: 0,
    weeksAtBottom: 0,
    gameweekWins: 0,
    bestPosition: null,
    worstPosition: null,
  }));

  gameweeks.forEach((gw) => {
    const weeks = rows.map((row) =>
      snapshot.histories[row.teamId]?.gameweeks.find((w) => w.gw === gw)
    );
    const totals = weeks.map((w) => (w ? w.totalPoints : null));
    const scores = weeks.map((w) => (w ? w.points - w.transfersCost : null));
    const present = totals.filter((t): t is number => t !== null);
    const bestScore = Math.max(
      ...scores.filter((s): s is number => s !== null),
      -Infinity
    );
    const positions = totals.map((total) =>
      total === null ? null : 1 + present.filter((other) => other > total).length
    );
    const lastPosition = Math.max(
      ...positions.filter((p): p is number => p !== null),
      0
    );

    rows.forEach((row, i) => {
      const position = positions[i];
      const score = scores[i];
      row.positions.push(position);
      row.scores.push(score);
      if (position === null) return;
      if (position === 1) row.weeksAtTop++;
      // "Bottom" only means something when at least two teams are ranked.
      if (present.length > 1 && position === lastPosition && position !== 1) {
        row.weeksAtBottom++;
      }
      if (score !== null && score === bestScore) row.gameweekWins++;
      row.bestPosition =
        row.bestPosition === null ? position : Math.min(row.bestPosition, position);
      row.worstPosition =
        row.worstPosition === null ? position : Math.max(row.worstPosition, position);
    });
  });

  return { gameweeks, rows };
}
