// src/components/LiveStatus.tsx
// The status line of a gameweek in progress: when the scores were last
// fetched from FPL, and a button to refresh them. It also keeps the page up
// to date while it is open. The server caches live points for a minute, so
// refreshing more often would show nothing new.
"use client";
import { useEffect, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 60_000;
const GIVE_UP_MS = 3 * 60 * 60_000;

const noSubscription = () => () => {};

export default function LiveStatus({
  playing,
  nextKickoff,
  updatedAt,
}: {
  /** A match is being played now. */
  playing: boolean;
  /** When the next match starts; null when none is left to start. */
  nextKickoff: string | null;
  /** When the scores were fetched from FPL (ISO time). */
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  // The time is shown in the visitor's own time zone, which the server does
  // not know, so it is only drawn in the browser.
  const inBrowser = useSyncExternalStore(noSubscription, () => true, () => false);
  const time =
    inBrowser && updatedAt
      ? new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

  useEffect(() => {
    // Between matches there is nothing to fetch until the next kick-off. A
    // match that has not started hours after its kick-off was put off, and
    // is not waited for.
    const kickoff = nextKickoff === null ? NaN : Date.parse(nextKickoff);
    const due = () =>
      playing || (Date.now() >= kickoff && Date.now() < kickoff + GIVE_UP_MS);
    // A tab in the background is not refreshed, since every refresh is a
    // server render; it catches up when the visitor comes back to it.
    let missed = false;
    const tick = () => {
      if (!due()) return;
      if (document.visibilityState === "visible") {
        router.refresh();
      } else {
        missed = true;
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && missed) {
        missed = false;
        router.refresh();
      }
    };
    const timer = setInterval(tick, INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [playing, nextKickoff, router]);

  return (
    <span className="d-inline-flex flex-wrap align-items-center column-gap-2">
      <span>
        {playing ? "Live" : "In progress"}
        {time && `, updated ${time}`}.
      </span>
      <button
        type="button"
        className="btn btn-link btn-sm p-0 align-baseline"
        disabled={refreshing}
        onClick={() => startRefresh(() => router.refresh())}
      >
        {refreshing ? (
          <span className="spinner-border spinner-border-sm" aria-label="Refreshing" />
        ) : (
          "Refresh"
        )}
      </button>
    </span>
  );
}
