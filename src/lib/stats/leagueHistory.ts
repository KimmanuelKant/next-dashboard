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
  /** The chip played in each gameweek, by FPL's name ("bboost"); null for none. */
  chips: (string | null)[];
  weeksAtTop: number;
  weeksAtBottom: number;
  /** Gameweeks with the highest score in the league (ties count for everyone tied). */
  gameweekWins: number;
  bestPosition: number | null;
  worstPosition: number | null;
  /** Mean league position over the gameweeks the manager had a team. */
  averagePosition: number | null;
  /** Most places gained from one gameweek to the next. */
  biggestClimb: PositionMove | null;
  /** Most places lost from one gameweek to the next, as a positive number. */
  biggestFall: PositionMove | null;
  /** Most gameweeks in a row in first place (level at the top counts). */
  longestRunAtTop: number;
  /** Gameweeks in which the team went top from a lower place. */
  leadsTaken: number;
  /** Points over the last five gameweeks, after hits (fewer weeks for a late joiner). */
  formLast5: number;
  /** Gameweeks with a score above the league's average that week. */
  weeksAboveAverage: number;
  /**
   * How far the gameweek scores swing: their standard deviation, after hits.
   * Null with fewer than two gameweeks.
   */
  scoreSpread: number | null;
}

/** A move in the league table between two gameweeks: places, and the gameweek it ended in. */
export interface PositionMove {
  places: number;
  gw: number;
}

/** Weeks of form, for the form column. */
export const FORM_WEEKS = 5;

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
    chips: [],
    weeksAtTop: 0,
    weeksAtBottom: 0,
    gameweekWins: 0,
    bestPosition: null,
    worstPosition: null,
    averagePosition: null,
    biggestClimb: null,
    biggestFall: null,
    longestRunAtTop: 0,
    leadsTaken: 0,
    formLast5: 0,
    weeksAboveAverage: 0,
    scoreSpread: null,
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
      row.chips.push(
        snapshot.histories[row.teamId]?.chips.find((chip) => chip.gw === gw)?.name ?? null
      );
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

  const history = { gameweeks, rows };
  const { against } = scoresAgainstWeekAverage(history);
  rows.forEach((row, i) => summariseRace(row, gameweeks, against[i]));
  return history;
}

/**
 * The stats a row's week-by-week series add up to: moves in the table, runs
 * at the top, form and how steady the scores are. `against` is each score
 * minus the league's average that week.
 */
function summariseRace(row: LeagueHistoryRow, gameweeks: number[], against: (number | null)[]) {
  let run = 0;
  row.positions.forEach((position, i) => {
    run = position === 1 ? run + 1 : 0;
    row.longestRunAtTop = Math.max(row.longestRunAtTop, run);
    const before = i > 0 ? row.positions[i - 1] : null;
    if (position === null || before === null) return;
    if (position === 1 && before > 1) row.leadsTaken++;
    // On a tie, the later move: the one more visitors remember.
    const move = before - position;
    if (move > 0 && move >= (row.biggestClimb?.places ?? 0)) {
      row.biggestClimb = { places: move, gw: gameweeks[i] };
    }
    if (move < 0 && -move >= (row.biggestFall?.places ?? 0)) {
      row.biggestFall = { places: -move, gw: gameweeks[i] };
    }
  });

  const positions = row.positions.filter((p): p is number => p !== null);
  row.averagePosition = positions.length
    ? positions.reduce((a, b) => a + b, 0) / positions.length
    : null;

  row.formLast5 = row.scores.slice(-FORM_WEEKS).reduce<number>((sum, s) => sum + (s ?? 0), 0);
  row.weeksAboveAverage = against.filter((gap) => gap !== null && gap > 0).length;

  const scores = row.scores.filter((s): s is number => s !== null);
  if (scores.length >= 2) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    row.scoreSpread = Math.sqrt(variance);
  }
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

export interface WeekAverages {
  /** The league's average score in each gameweek, over the teams that played it; null if none did. */
  averages: (number | null)[];
  /** Each score minus that week's average, one array per row; null before the manager joined. */
  against: (number | null)[][];
}

/**
 * Every score against the league's average that week: the heatmap on the
 * Charts tab. Managers who had not joined yet do not count towards the
 * average, so a late joiner does not drag down the weeks before.
 */
export function scoresAgainstWeekAverage(history: LeagueHistory): WeekAverages {
  const averages = history.gameweeks.map((_, i) => {
    const scores = history.rows
      .map((row) => row.scores[i])
      .filter((s): s is number => s !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  });
  const against = history.rows.map((row) =>
    row.scores.map((score, i) => {
      const average = averages[i];
      return score === null || average === null ? null : score - average;
    })
  );
  return { averages, against };
}
