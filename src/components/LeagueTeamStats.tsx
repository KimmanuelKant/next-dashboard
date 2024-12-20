// src/components/LeagueTeamStats.tsx

import { getLeagueStandings, getBootstrapData } from '@/lib/fplApi';
import { computeLeagueTeamStats } from '@/lib/leagueTeamData';
import TeamStatisticsTable from '@/components/TeamStatisticsTable';

export default async function NewTeamStats({ leagueId }: { leagueId: string }) {
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