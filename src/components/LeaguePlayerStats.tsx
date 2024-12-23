// src/components/LeagueTeamStats.tsx

import { getLeagueStandings, getBootstrapData } from '@/lib/fplApiClient';
import { computeLeaguePlayerStats } from '@/lib/leaguePlayerData';
import PlayerStatisticsTable from '@/components/PlayerStatisticsTable';

export default async function NewPlayerStats({ leagueId }: { leagueId: string }) {
  const [standings, bootstrapData] = await Promise.all([
    getLeagueStandings(leagueId),
    getBootstrapData(),
  ]);

  const events = bootstrapData.events;
  const latestFinishedEvent = events.filter(e => e.finished).sort((a, b) => b.id - a.id)[0];
  if (!latestFinishedEvent) {
    return <div>No finished gameweeks found</div>;
  }

  const players = await computeLeaguePlayerStats(
    standings,
    bootstrapData.elements,
    bootstrapData.teams,
    bootstrapData.total_players,
    latestFinishedEvent.id
  );

  return <PlayerStatisticsTable players={players} />;
}
