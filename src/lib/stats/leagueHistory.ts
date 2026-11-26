// src/lib/stats/leagueHistory.ts
// League position, points and rank of every manager, week by week, and the
// series the Charts tab draws from them. The chart runs in the browser and
// imports this file, so it must stay free of server-only imports.

import type { LeagueSnapshot } from "@/lib/fpl/types";

export interface LeagueHistoryRow {
  teamId: number;
  teamName: string;
  managerName: string;
  /** League position after each gameweek (index matches `gameweeks`); null before the manager joined. */
  positions: (number | null)[];
  /** Gameweek score after transfer hits; null before the manager joined. */
  scores: (number | null)[];
  /** Total points after each gameweek, after hits; null before the manager joined. */
  totals: (number | null)[];
  /** Rank among all FPL managers after each gameweek; null when FPL gives none. */
  overallRanks: (number | null)[];
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
    totals: [],
    overallRanks: [],
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
      row.totals.push(totals[i]);
      row.overallRanks.push(weeks[i]?.overallRank ?? null);
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

/**
 * A number per team per gameweek that the Charts tab can draw. The id is the
 * series' name in the page address (`?chart=gap-to-leader`): keep it once
 * published, as links to an old id open the default chart.
 */
export interface ChartSeries {
  id: string;
  /** The text on its button, and the chart's heading. */
  name: string;
  /** What the chart shows, for visitors. */
  description: string;
  /** Rank-like: 1 is drawn at the top. */
  lowerIsBetter: boolean;
  /** Drawn on a log scale (overall ranks run from 1 to millions). */
  log: boolean;
  /** Shown with a sign, "+12" or "−5", and a line at zero. */
  signed: boolean;
  /** The values, one array per row of the history, in the same order. */
  values: (history: LeagueHistory) => (number | null)[][];
}

/**
 * Each value of the week minus a reference worked out from the totals of
 * the teams that had one that week.
 */
function againstTotals(
  history: LeagueHistory,
  reference: (present: number[]) => number
): (number | null)[][] {
  const references = history.gameweeks.map((_, i) => {
    const present = history.rows
      .map((row) => row.totals[i])
      .filter((t): t is number => t !== null);
    return present.length > 0 ? reference(present) : null;
  });
  return history.rows.map((row) =>
    row.totals.map((total, i) => {
      const ref = references[i];
      return total === null || ref === null ? null : total - ref;
    })
  );
}

export const CHART_SERIES: ChartSeries[] = [
  {
    id: "position",
    name: "League position",
    description: "League position after each gameweek.",
    lowerIsBetter: true,
    log: false,
    signed: false,
    values: (history) => history.rows.map((row) => row.positions),
  },
  {
    id: "gap-to-leader",
    name: "Gap to leader",
    description: "Points behind the league leader after each gameweek. The leader that week is at 0.",
    lowerIsBetter: false,
    log: false,
    signed: true,
    values: (history) => againstTotals(history, (present) => Math.max(...present)),
  },
  {
    id: "vs-average",
    name: "Against average",
    description:
      "Total points above or below the league's average total after each gameweek.",
    lowerIsBetter: false,
    log: false,
    signed: true,
    values: (history) =>
      againstTotals(history, (present) => present.reduce((a, b) => a + b, 0) / present.length),
  },
  {
    id: "total",
    name: "Total points",
    description: "Total points after each gameweek, after transfer hits.",
    lowerIsBetter: false,
    log: false,
    signed: false,
    values: (history) => history.rows.map((row) => row.totals),
  },
  {
    id: "score",
    name: "Gameweek score",
    description: "Points scored in each gameweek, after transfer hits.",
    lowerIsBetter: false,
    log: false,
    signed: false,
    values: (history) => history.rows.map((row) => row.scores),
  },
  {
    id: "overall-rank",
    name: "Overall rank",
    description:
      "Rank among every FPL manager after each gameweek. Drawn on a log scale, so a climb from 100k to 10k takes as much room as one from 1M to 100k.",
    lowerIsBetter: true,
    log: true,
    signed: false,
    values: (history) => history.rows.map((row) => row.overallRanks),
  },
];

export const DEFAULT_SERIES = CHART_SERIES[0];
