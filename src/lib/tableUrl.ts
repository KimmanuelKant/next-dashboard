// src/lib/tableUrl.ts
// A table's view and sorting, written into the page address as the "view"
// and "sort" parameters. A reload, the back button and a link pasted into a
// group chat then all show the same table.

import type { SortingState } from "@tanstack/react-table";

/** "League race" -> "league-race": a view's name as it appears in the address. */
export const viewSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Column ids separated by commas, with "-" in front of a descending one. */
export const encodeSorting = (sorting: SortingState) =>
  sorting.map(({ id, desc }) => (desc ? "-" : "") + id).join(",");

/**
 * The reverse of encodeSorting. Null when the value is missing or names a
 * column the table does not have, so a stale or mistyped link falls back to
 * the table's own sorting.
 */
export function decodeSorting(
  value: string | null,
  columnIds: ReadonlySet<string>
): SortingState | null {
  if (!value) {
    return null;
  }
  const sorting = value.split(",").map((part) =>
    part.startsWith("-") ? { id: part.slice(1), desc: true } : { id: part, desc: false }
  );
  return sorting.every(({ id }) => columnIds.has(id)) ? sorting : null;
}

/**
 * The page's query string with the given parameters set: a table's view and
 * sorting, or the chart and its teams on the Charts tab. A value equal to
 * its default is left out, to keep the address short. Other parameters (the
 * visitor's team, another component's state) are kept.
 */
export function withTableState<K extends string>(
  search: string,
  state: Record<K, string>,
  defaults: Record<K, string>
): string {
  const params = new URLSearchParams(search);
  for (const key of Object.keys(state) as K[]) {
    if (state[key] && state[key] !== defaults[key]) {
      params.set(key, state[key]);
    } else {
      params.delete(key);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
