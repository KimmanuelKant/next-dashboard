// src/components/LiveRefresh.tsx
// Keeps the page of a gameweek in progress up to date while it is open. The
// server caches live points for a minute, so refreshing more often would
// show nothing new.
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 60_000;
const GIVE_UP_MS = 3 * 60 * 60_000;

export default function LiveRefresh({
  playing,
  nextKickoff,
}: {
  /** A match is being played now. */
  playing: boolean;
  /** When the next match starts; null when none is left to start. */
  nextKickoff: string | null;
}) {
  const router = useRouter();

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

  return null;
}
