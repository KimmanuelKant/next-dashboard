// src/components/LeagueTeamStats.tsx

import TeamStatisticsTable from "@/components/TeamStatisticsTable";
import { computeLeagueTeamStats } from "@/lib/leagueTeamService";
import { getLeagueStandings, getBootstrapData } from "@/lib/fplApiClient";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeagueTeamStats({ leagueId }: { leagueId: string }) {
  const [standings, bootstrapData] = await Promise.all([
    getLeagueStandings(leagueId),
    getBootstrapData(),
  ]);

  const teams = await computeLeagueTeamStats(
    standings,
    bootstrapData.elements,
    bootstrapData.events
  );

  return <TeamStatisticsTable stats={teams} />;
}
