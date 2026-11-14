// src/lib/myTeam.ts
import { useParams, useSearchParams } from "next/navigation";
import { isValidTeamId } from "@/lib/teamId";
import { useRememberedLeague } from "@/lib/rememberedLeague";

/** The visitor's team ID from the "team" query parameter, or null. */
export function useTeamParam(): string | null {
  const team = useSearchParams().get("team");
  return team && isValidTeamId(team) ? team : null;
}

/**
 * The visitor's own team in the league being viewed, for highlighting its
 * row. Comes from the URL, or from the remembered league when it is this one.
 */
export function useMyTeamId(): number | null {
  const fromUrl = useTeamParam();
  const { leagueId } = useParams<{ leagueId?: string }>();
  const remembered = useRememberedLeague();
  const team =
    fromUrl ?? (remembered && remembered.id === leagueId ? remembered.team : null);
  return team ? Number(team) : null;
}
