// src/lib/stats/records.ts
// Records: which teams hold the highest value of a statistic. They feed the
// highlight cards above the tables, so a visitor sees the outliers without
// having to sort a table to find them.

export interface TeamRecord<Kind extends string> {
  kind: Kind;
  /** The teams that share the record, in league order. */
  teams: string[];
  value: number;
}

/**
 * The teams with the highest `stat`. Null when that value is below
 * `minimum`: a record nobody really holds (no team climbed, nobody took a
 * hit) is not worth a card.
 */
export function teamRecord<Kind extends string, Row extends { teamName: string }>(
  kind: Kind,
  rows: Row[],
  stat: (row: Row) => number,
  minimum = -Infinity
): TeamRecord<Kind> | null {
  if (rows.length === 0) {
    return null;
  }
  const best = Math.max(...rows.map(stat));
  if (best < minimum) {
    return null;
  }
  return {
    kind,
    teams: rows.filter((row) => stat(row) === best).map((row) => row.teamName),
    value: best,
  };
}
