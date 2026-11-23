// src/components/GameweekPicker.tsx
"use client";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Steps back and forth through the gameweeks played so far. The gameweek is
 * the "gw" parameter in the address, read by the page on the server; the
 * latest gameweek has no parameter, so the plain address always shows it.
 */
export default function GameweekPicker({
  gameweeks,
  selected,
  status,
}: {
  /** Every gameweek played so far, oldest first. */
  gameweeks: number[];
  selected: number;
  /** A few words on the selected gameweek, shown beside the picker. */
  status: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // The picker shows the choice at once, while the server works on the table.
  const [shown, setShown] = useOptimistic(selected);
  const index = gameweeks.indexOf(shown);
  const latest = gameweeks[gameweeks.length - 1];

  const show = (gw: number | undefined) => {
    if (gw === undefined) return;
    // Keeps the table's view and sorting, and the visitor's team.
    const params = new URLSearchParams(window.location.search);
    if (gw === latest) {
      params.delete("gw");
    } else {
      params.set("gw", String(gw));
    }
    const query = params.toString();
    startTransition(() => {
      setShown(gw);
      // replace, not push: stepping through ten gameweeks should not take
      // ten presses of the back button to leave.
      router.replace(window.location.pathname + (query ? `?${query}` : ""), { scroll: false });
    });
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div className="input-group input-group-sm w-auto flex-nowrap">
        <button
          type="button"
          className="btn btn-outline-secondary btn-quiet"
          aria-label="Previous gameweek"
          disabled={index <= 0}
          onClick={() => show(gameweeks[index - 1])}
        >
          ‹
        </button>
        <select
          className="form-select"
          aria-label="Gameweek"
          value={shown}
          onChange={(e) => show(Number(e.target.value))}
        >
          {gameweeks.map((gw) => (
            <option key={gw} value={gw}>
              Gameweek {gw}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-outline-secondary btn-quiet"
          aria-label="Next gameweek"
          disabled={index >= gameweeks.length - 1}
          onClick={() => show(gameweeks[index + 1])}
        >
          ›
        </button>
      </div>
      <span className="text-secondary small" role="status">
        {pending ? (
          <span className="spinner-border spinner-border-sm" aria-label="Loading" />
        ) : (
          status
        )}
      </span>
    </div>
  );
}
