// src/components/LeagueNotices.tsx

import { MAX_MANAGERS } from "@/lib/leagueId";
import type { LeagueSnapshot } from "@/lib/fpl/types";

/** Messages about the limits of what is shown for this league. */
export default function LeagueNotices({ snapshot }: { snapshot: LeagueSnapshot }) {
  return (
    <>
      {snapshot.currentGw === null && (
        <div className="alert alert-info" role="status">
          The season has not started yet. Statistics appear after the first
          gameweek deadline.
        </div>
      )}
      {snapshot.currentGw !== null && snapshot.league.managers.length === 0 && (
        <div className="alert alert-info" role="status">
          This league has no ranked teams yet.
        </div>
      )}
      {snapshot.league.hasMoreManagers && (
        <div className="alert alert-warning" role="status">
          This league has more than {MAX_MANAGERS} teams. Only the top{" "}
          {MAX_MANAGERS} are shown, and ownership figures cover those teams only.
        </div>
      )}
    </>
  );
}
