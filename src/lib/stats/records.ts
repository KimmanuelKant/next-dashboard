// src/lib/stats/records.ts
// Records: which teams hold the highest value of a statistic. They feed the
// highlight cards above the tables, so a visitor sees the outliers without
// having to sort a table to find them. There are more records than cards:
// the ones that stand out most in the league get the cards, and a quiet
// week shows fewer of them.

export interface TeamRecord<Kind extends string> {
  kind: Kind;
  /** The teams that share the record, in league order. */
  teams: string[];
  value: number;
  /**
   * How far the record stands out from the rest of the league: the gap
   * between the record and the league's median, in units of how spread out
   * the league is on that stat. 0 when it does not stand out at all.
   */
  standout: number;
  /** What the record was won with, for the card: the player behind a swing. */
  detail?: string;
}

/** As many cards as fill three rows on a phone, two to a row. */
export const MAX_HIGHLIGHTS = 6;

/**
 * The standout a record needs to earn a card. Measured on a real league: a
 * lone -4 hit or a climb of one place comes to about 1, records worth
 * telling come to 1.5 and more.
 */
export const STANDOUT_TO_EARN = 1.5;

/**
 * Cards shown however quiet the week: when fewer records earn one, the ones
 * closest to standing out make up the number, so the row is never empty.
 */
export const MIN_HIGHLIGHTS = 3;

export interface RecordOptions {
  /** A best value below this is no record (no team climbed, nobody took a hit): no card. */
  minimum?: number;
  /**
   * The smallest gap between teams that is worth noticing for this stat, in
   * its own units (points, places). It stands in for the league's spread
   * when the league is spread less than this, so that one team with a stat
   * where every other team has 0 (a single -4 hit) does not outrank
   * everything else.
   */
  scale?: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** The teams with the highest `stat`, or null when nobody holds the record. */
export function teamRecord<Kind extends string, Row extends { teamName: string }>(
  kind: Kind,
  rows: Row[],
  stat: (row: Row) => number,
  { minimum = -Infinity, scale = 1 }: RecordOptions = {}
): TeamRecord<Kind> | null {
  if (rows.length === 0) {
    return null;
  }
  const values = rows.map(stat);
  const best = Math.max(...values);
  if (best < minimum) {
    return null;
  }
  const teams = rows.filter((_, i) => values[i] === best).map((row) => row.teamName);
  // The spread is the average distance from the median: unlike the standard
  // deviation, one extreme team does not inflate it much, and that team is
  // the one being measured.
  const middle = median(values);
  const spread = values.reduce((total, value) => total + Math.abs(value - middle), 0) / values.length;
  // A record shared by several teams is less of a story than one team alone.
  const standout = (best - middle) / Math.max(spread, scale) / Math.sqrt(teams.length);
  return { kind, teams, value: best, standout };
}

/**
 * The records to show as cards: the pinned kinds first, in the order given
 * (the headline, such as the gameweek's winner, shown however ordinary),
 * then the others by how far they stand out. A record must stand out by
 * STANDOUT_TO_EARN to get a card, except to make up `min` cards; there are
 * never more than `max`.
 */
export interface PickOptions {
  /** Kinds shown first, in this order, whether or not they stand out. */
  pinned?: string[];
  min?: number;
  max?: number;
}

/** Picking options that keep every record, for checking what each one holds. */
export const EVERY_RECORD: PickOptions = { min: Infinity, max: Infinity };

export function pickHighlights<R extends TeamRecord<string>>(
  records: R[],
  { pinned = [], min = MIN_HIGHLIGHTS, max = MAX_HIGHLIGHTS }: PickOptions = {}
): R[] {
  const first = pinned.flatMap((kind) => records.filter((record) => record.kind === kind));
  const rest = records
    .filter((record) => !pinned.includes(record.kind))
    .sort((a, b) => b.standout - a.standout);
  const earned = rest.filter((record) => record.standout >= STANDOUT_TO_EARN).length;
  const count = Math.min(Math.max(first.length + earned, min), max);
  return [...first, ...rest].slice(0, count);
}
