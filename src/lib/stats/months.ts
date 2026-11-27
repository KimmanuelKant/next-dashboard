// src/lib/stats/months.ts
// Manager of the month: each team's points in every month of FPL's monthly
// standings, and who won each month that is over. Pure functions.

import type { Month } from "@/lib/fpl/types";
import type { LeagueHistory } from "./leagueHistory";

export interface MonthResult {
  name: string;
  /** Points scored in the month's gameweeks, after hits. */
  points: number;
  /** All the month's gameweeks are finished, so its winner is known. */
  finished: boolean;
  /** The team had the league's highest points in a finished month (ties all win). */
  won: boolean;
}

/**
 * Every month that has started, in order, for every row of the history (the
 * outer array follows `history.rows`). Points are the gameweek scores after
 * hits, as FPL's monthly standings count them. A team that had not joined
 * by a month scores nothing in it and cannot win it.
 */
export function monthlyResults(
  history: LeagueHistory,
  months: Month[],
  finishedGameweeks: Set<number>
): MonthResult[][] {
  const lastGw = history.gameweeks.at(-1);
  const started = months.filter((month) => lastGw !== undefined && month.start <= lastGw);
  const perMonth = started.map((month) => {
    const indices = history.gameweeks
      .map((gw, i) => (gw >= month.start && gw <= month.stop ? i : -1))
      .filter((i) => i >= 0);
    const totals = history.rows.map((row) => {
      const scores = indices.map((i) => row.scores[i]).filter((s): s is number => s !== null);
      return scores.length ? scores.reduce((a, b) => a + b, 0) : null;
    });
    const played = totals.filter((t): t is number => t !== null);
    const best = played.length ? Math.max(...played) : null;
    const finished = Array.from(
      { length: month.stop - month.start + 1 },
      (_, i) => month.start + i
    ).every((gw) => finishedGameweeks.has(gw));
    return totals.map((total) => ({
      name: month.name,
      points: total ?? 0,
      finished,
      won: finished && total !== null && total === best,
    }));
  });
  return history.rows.map((_, row) => perMonth.map((month) => month[row]));
}
