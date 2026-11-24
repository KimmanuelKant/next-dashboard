// src/components/NowPlaying.tsx
// The strip above the Gameweek table while a gameweek is played: the
// matches on now with their score, or between matches the next to kick
// off, and how many of the league's teams have a player in each. It is
// updated with the rest of the page (see LiveStatus).
"use client";
import { useSyncExternalStore } from "react";
import type { LeagueMatches } from "@/lib/stats/matches";

const noSubscription = () => () => {};

export default function NowPlaying({ matches, teamCount }: LeagueMatches) {
  // Kick-off times are shown in the visitor's own time zone, which the
  // server does not know, so they are only drawn in the browser.
  const inBrowser = useSyncExternalStore(noSubscription, () => true, () => false);
  if (matches.length === 0) return null;
  const playing = matches.some((match) => match.playing);
  const kickoff = (iso: string | null) =>
    inBrowser && iso
      ? new Date(iso).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })
      : null;

  return (
    <section className="mb-3" aria-label={playing ? "Matches being played" : "Next matches"}>
      <h2 className="small text-secondary fw-normal mb-1">
        {playing ? "Now playing" : "Next to kick off"}
      </h2>
      {/* On phones the row scrolls sideways, like the view buttons. */}
      <div className="view-pills d-flex flex-nowrap flex-sm-wrap gap-2 overflow-x-auto">
        {matches.map((match) => (
          <div key={match.id} className="border rounded px-2 py-1 small text-nowrap">
            <div>
              <span className="fw-semibold">
                {match.home}{" "}
                {match.playing ? `${match.homeScore ?? 0}–${match.awayScore ?? 0}` : "v"}{" "}
                {match.away}
              </span>
              <span className="text-secondary ms-2">
                {match.playing ? `${match.minutes}′` : kickoff(match.kickoff)}
              </span>
            </div>
            <div className="text-secondary">
              {match.teams} of {teamCount} teams
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
