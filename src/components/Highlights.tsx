// src/components/Highlights.tsx
import type { SortingState } from "@tanstack/react-table";
import type { TeamRecord } from "@/lib/stats/records";

/** A record worth pointing out, and where the table shows it. */
export interface Highlight {
  title: string;
  /** Who holds the record. */
  name: string;
  /** "+2" when two more teams share it. Kept apart from the name so that a long name is cut short, not this. */
  others?: string;
  value: string;
  /** The view holding the column, and the sorting that puts the record at the top. */
  preset: string;
  sorting: SortingState;
}

/** What the card for one kind of record says, and where the table shows it. */
export interface HighlightCard {
  title: string;
  /** The record's value as the card words it: "74 pts", "3 wins". */
  value: (value: number) => string;
  /** Name of the view (preset) that holds the column. */
  view: string;
  column: string;
  /** Whether sorting the column downwards puts the record at the top. */
  desc: boolean;
}

/** Builds the card for a record: the first team by name, the rest as a count. */
export function toHighlight(record: TeamRecord<string>, card: HighlightCard): Highlight {
  return {
    title: card.title,
    name: record.teams[0],
    others: record.teams.length > 1 ? `+${record.teams.length - 1}` : undefined,
    value: card.value(record.value),
    preset: card.view,
    sorting: [{ id: card.column, desc: card.desc }],
  };
}

/**
 * Cards above a table, one per record. They put the table's most interesting
 * numbers on the first screen, and selecting one opens the view it came
 * from, which is how a visitor finds out the views exist.
 */
export default function Highlights({
  items,
  onSelect,
}: {
  items: Highlight[];
  onSelect: (item: Highlight) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="row g-2 mb-3" aria-label="Highlights">
      {items.map((item) => (
        // Two to a row on phones, three on tablets, all in one row on a desktop.
        <div key={item.title} className="col-6 col-md-4 col-xl">
          <button
            type="button"
            className="highlight btn btn-outline-secondary btn-quiet w-100 h-100 text-start"
            onClick={() => onSelect(item)}
          >
            <span className="highlight-title d-flex justify-content-between">
              {item.title}
              <span aria-hidden="true">›</span>
            </span>
            <span className="d-flex gap-1 fw-semibold">
              <span className="text-truncate">{item.name}</span>
              {item.others && <span className="flex-shrink-0">{item.others}</span>}
            </span>
            <span className="d-block small">{item.value}</span>
            <span className="visually-hidden">Show in the table</span>
          </button>
        </div>
      ))}
    </section>
  );
}
