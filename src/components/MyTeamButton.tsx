// src/components/MyTeamButton.tsx
"use client";
import { useParams } from "next/navigation";
import { useMyTeamId } from "@/lib/myTeam";
import { rememberLeague, useRememberedLeague } from "@/lib/rememberedLeague";

/**
 * In a team's panel: marks the team as the visitor's own, which highlights
 * its row on every tab. This is the only way to do that for a visitor who
 * came in with a league ID; with a team ID the team is known from the start.
 */
export default function MyTeamButton({
  teamId,
  leagueName,
}: {
  teamId: number;
  leagueName: string;
}) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const remembered = useRememberedLeague();
  const isMine = useMyTeamId() === teamId;

  const setTeam = (team: string | null) => {
    // The address carries the team from tab to tab, and wins over what the
    // browser remembers, so it has to change too.
    const params = new URLSearchParams(window.location.search);
    if (team) {
      params.set("team", team);
    } else {
      params.delete("team");
    }
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (query ? `?${query}` : "") + window.location.hash
    );
    // Remembered, so the row is still marked on the next visit. A visitor
    // who has asked for another league to be remembered keeps that one: the
    // tick box at the top of the page is how to change it.
    if (!remembered || remembered.id === leagueId) {
      rememberLeague({ id: leagueId, name: leagueName, team });
    }
  };

  return isMine ? (
    <button
      type="button"
      className="btn btn-sm btn-primary"
      aria-pressed="true"
      onClick={() => setTeam(null)}
    >
      ✓ My team
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-sm btn-outline-primary"
      aria-pressed="false"
      onClick={() => setTeam(String(teamId))}
    >
      This is my team
    </button>
  );
}
