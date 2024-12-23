// src/lib/leaguePlayerData.ts

import {
  FplLeagueStandings,
  FplLeagueStandingResult,
} from "@/types/fpl/FplLeagueStandings";
import { FplElement, FplTeam } from "@/types/fpl/FplBootstrapStatic";
import { FplPick } from "@/types/fpl/FplEntryEventPicks";
import { LeaguePlayer } from "@/types/derived/LeagueDerivedTypes";
import { getEntryEventPicks } from "./fplApiClient";

// Helper functions (can also be moved to a utils file)
function getPositionName(elementType: number): string {
  const positions: { [key: number]: string } = {
    1: "Goalkeeper",
    2: "Defender",
    3: "Midfielder",
    4: "Forward",
  };
  return positions[elementType] || "Unknown";
}

function getTeamName(teamId: number, fplTeams: FplTeam[]): string {
  const team = fplTeams.find((t) => t.id === teamId);
  return team ? team.name : "Unknown";
}

/**
 * Compute league-level player stats (LeaguePlayer[])
 * @param leagueStandings Standings data for the league
 * @param allFplPlayers Global FPL players from bootstrap data
 * @param fplTeams List of Premier League teams from bootstrap data
 * @param totalPlayers total number of global players
 * @param latestFinishedGameweek The most recently completed gameweek
 */
export async function computeLeaguePlayerStats(
  leagueStandings: FplLeagueStandings,
  allFplPlayers: FplElement[],
  fplTeams: FplTeam[],
  totalPlayers: number,
  latestFinishedGameweek: number
): Promise<LeaguePlayer[]> {
  const leagueEntries: FplLeagueStandingResult[] =
    leagueStandings.standings.results;

  // Create a quick map of player info
  const playerMap = new Map<
    number,
    {
      name: string;
      position: string;
      team: string;
      value: number;
      globalOwnershipPercentage: number;
      globalOwnershipCount: number;
    }
  >();

  allFplPlayers.forEach((player) => {
    const positionName = getPositionName(player.element_type);
    const teamName = getTeamName(player.team, fplTeams);
    const playerValue = player.now_cost / 10;
    const globalOwnershipPercentage = parseFloat(player.selected_by_percent);
    const validPercentage = isNaN(globalOwnershipPercentage)
      ? 0
      : globalOwnershipPercentage;
    const globalOwnershipCount = Math.round(
      (validPercentage / 100) * totalPlayers
    );

    playerMap.set(player.id, {
      name: player.web_name,
      position: positionName,
      team: teamName,
      value: playerValue,
      globalOwnershipPercentage: validPercentage,
      globalOwnershipCount,
    });
  });

  // Determine players selected in the league
  const selectedPlayerIds = new Set<number>();
  const playerOwnershipMap = new Map<number, Set<number>>(); // playerId => set of teamIds

  // Fetch picks for each team in parallel
  await Promise.all(
    leagueEntries.map(async (entry) => {
      try {
        const picksData = await getEntryEventPicks(
          entry.entry,
          latestFinishedGameweek
        );
        const picks: FplPick[] = picksData.picks;
        picks.forEach((pick) => {
          selectedPlayerIds.add(pick.element);
          if (!playerOwnershipMap.has(pick.element)) {
            playerOwnershipMap.set(pick.element, new Set());
          }
          playerOwnershipMap.get(pick.element)!.add(entry.entry);
        });
      } catch (err) {
        console.warn(
          `Failed to fetch picks for entry ${entry.entry}, GW ${latestFinishedGameweek}: ${err}`
        );
      }
    })
  );

  // Construct LeaguePlayer array
  const totalTeamsInLeague = leagueEntries.length;
  const selectedPlayers: LeaguePlayer[] = Array.from(selectedPlayerIds).map(
    (playerId) => {
      const info = playerMap.get(playerId);
      if (!info) {
        return {
          id: playerId,
          name: "Unknown Player",
          position: "Unknown",
          team: "Unknown",
          value: 0,
          globalOwnershipCount: 0,
          globalOwnershipPercentage: 0,
          leagueOwnershipCount: 0,
          leagueOwnershipPercentage: 0,
        };
      }

      return {
        id: playerId,
        name: info.name,
        position: info.position,
        team: info.team,
        value: info.value,
        globalOwnershipCount: info.globalOwnershipCount,
        globalOwnershipPercentage: info.globalOwnershipPercentage,
        leagueOwnershipCount: 0,
        leagueOwnershipPercentage: 0,
      };
    }
  );

  // Compute league ownership
  selectedPlayers.forEach((player) => {
    const ownershipSet = playerOwnershipMap.get(player.id);
    const ownershipCount = ownershipSet ? ownershipSet.size : 0;
    const leagueOwnershipPercentage =
      (ownershipCount / totalTeamsInLeague) * 100;

    player.leagueOwnershipCount = ownershipCount;
    player.leagueOwnershipPercentage = leagueOwnershipPercentage;
  });

  // Sort players by name
  selectedPlayers.sort((a, b) => a.name.localeCompare(b.name));

  return selectedPlayers;
}
