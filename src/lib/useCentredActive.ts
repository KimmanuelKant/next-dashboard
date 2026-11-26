// src/lib/useCentredActive.ts
import { useEffect, useRef } from "react";

/**
 * On phones a row of view buttons scrolls sideways, and the button opened
 * from a highlight card or the address can be out of sight. This brings the
 * pressed button to the middle of the row whenever `key` changes. Only the
 * row is scrolled: scrollIntoView would move the page too, which on a page
 * with a chart above a table means a jump on load.
 */
export function useCentredActive<T extends HTMLElement>(key: unknown) {
  const rowRef = useRef<T>(null);
  useEffect(() => {
    const row = rowRef.current;
    const active = row?.querySelector('[aria-pressed="true"]');
    if (row && active) {
      const rowBox = row.getBoundingClientRect();
      const activeBox = active.getBoundingClientRect();
      row.scrollLeft += activeBox.left - rowBox.left - (rowBox.width - activeBox.width) / 2;
    }
  }, [key]);
  return rowRef;
}
