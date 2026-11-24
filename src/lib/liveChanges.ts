// src/lib/liveChanges.ts
// What changed in a table between two updates of a gameweek being played.
// The page fetches new scores every minute, and the rows re-sort without
// saying which teams moved. The browser keeps the values it showed last and
// compares them with the new ones; the server knows nothing of this, so it
// costs no requests.

/** The values to compare, for one table. */
export interface ChangeTracking<T> {
  /** Says which row is which from one update to the next. */
  rowKey: (row: T) => string | number;
  /**
   * Column id -> its value. A change is marked in that column's cell with
   * the difference ("+6"). Null for a row without the value.
   */
  marked: Record<string, (row: T) => number | null>;
  /**
   * Further values whose change highlights the row but is not marked, such
   * as a position: the row moves, and the reason is in a marked column.
   */
  unmarked?: Record<string, (row: T) => number | null>;
}

/** Row key -> value name -> value. */
export type Readings = Map<string, Map<string, number>>;

/** Row key -> column id -> difference. A row whose only change is unmarked has an empty map. */
export type Changes = Map<string, Map<string, number>>;

export function readValues<T>(rows: T[], tracking: ChangeTracking<T>): Readings {
  const readings: Readings = new Map();
  const getters = { ...tracking.unmarked, ...tracking.marked };
  for (const row of rows) {
    const values = new Map<string, number>();
    for (const [name, get] of Object.entries(getters)) {
      const value = get(row);
      if (value !== null && Number.isFinite(value)) values.set(name, value);
    }
    readings.set(String(tracking.rowKey(row)), values);
  }
  return readings;
}

/**
 * The rows whose values differ between two readings. A row or value found in
 * only one of them is no change: a filter can hide rows, and a manager can be
 * new to the table.
 */
export function changesBetween(before: Readings, after: Readings, markedIds: string[]): Changes {
  const changes: Changes = new Map();
  for (const [key, values] of after) {
    const earlier = before.get(key);
    if (!earlier) continue;
    let changed = false;
    const marks = new Map<string, number>();
    for (const [name, value] of values) {
      const was = earlier.get(name);
      if (was === undefined || was === value) continue;
      changed = true;
      // Rounded, so that a value with decimals does not show a change of 0.
      const difference = Math.round((value - was) * 10) / 10;
      if (markedIds.includes(name) && difference !== 0) marks.set(name, difference);
    }
    if (changed) changes.set(key, marks);
  }
  return changes;
}

/** Readings with the newer values added, keeping rows that `after` lacks. */
export function mergeReadings(before: Readings, after: Readings): Readings {
  const merged = new Map(before);
  for (const [key, values] of after) merged.set(key, values);
  return merged;
}

/** `after` holds a row that `before` does not. */
export function hasNewRows(before: Readings, after: Readings): boolean {
  for (const key of after.keys()) if (!before.has(key)) return true;
  return false;
}

/** The mark shown for a difference: "+6", "−2". */
export function formatChange(difference: number): string {
  return `${difference > 0 ? "+" : "−"}${Math.abs(difference)}`;
}
