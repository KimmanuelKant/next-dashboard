// src/components/RememberLeague.tsx
"use client";
import Narrow from "@/components/Narrow";
import { forgetLeague, rememberLeague, useRememberedLeague } from "@/lib/rememberedLeague";
import { useTeamParam } from "@/lib/myTeam";

/** Opt-in tick box: the front page then offers a way back to this league. */
export default function RememberLeague({
  leagueId,
  leagueName,
}: {
  leagueId: string;
  leagueName: string;
}) {
  const remembered = useRememberedLeague();
  const team = useTeamParam();
  const isRemembered = remembered?.id === leagueId;

  return (
    <div className="form-check mb-0">
      <input
        id="rememberLeague"
        type="checkbox"
        className="form-check-input"
        checked={isRemembered}
        onChange={(e) => {
          if (e.target.checked) {
            rememberLeague({ id: leagueId, name: leagueName, team });
          } else {
            forgetLeague();
          }
        }}
      />
      <label htmlFor="rememberLeague" className="form-check-label">
        {/* Short on phones, so the tick box and the links beside it fit one line. */}
        <Narrow short="Remember league">Remember this league on this device</Narrow>
      </label>
    </div>
  );
}
