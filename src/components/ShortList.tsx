// src/components/ShortList.tsx
import type { ReactNode } from "react";

/**
 * A list of names kept to one line in a table cell: the first few, then
 * "+N" for the rest ("Salah, Haaland +5"). A full list in every cell made
 * rows several lines tall and the table hard to scan. The row panel has the
 * room, so it shows the whole list (see global.css), and hovering the cell
 * shows it too.
 */
export default function ShortList({
  items,
  shown = 2,
  empty = "–",
  suffix = "",
}: {
  items: string[];
  /** How many items the cell names before "+N". */
  shown?: number;
  /** Shown when the list is empty. */
  empty?: ReactNode;
  /** Text after the list, in both versions, such as a points total. */
  suffix?: string;
}) {
  if (items.length === 0) return <>{empty}</>;
  const full = items.join(", ") + suffix;
  if (items.length <= shown) return <>{full}</>;
  const rest = items.length - shown;
  return (
    <>
      <span className="list-short" title={full}>
        {items.slice(0, shown).join(", ")}{" "}
        <span className="text-secondary">+{rest}</span>
        {suffix}
      </span>
      <span className="list-full">{full}</span>
    </>
  );
}
