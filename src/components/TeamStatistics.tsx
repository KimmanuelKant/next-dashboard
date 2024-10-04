// src/components/TeamStatistics.tsx
import React from 'react';
import TeamStatisticsTable from '@/components/TeamStatisticsTable';
import { Team, ApiTeam } from '@/types';

async function fetchTeamStandings(leagueId: string): Promise<{ standings: { results: ApiTeam[] } }> {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
    {
      cache: 'no-store', // Disable cache to fetch fresh data
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch team standings');
  }

  return res.json();
}

export default async function TeamStatistics({ leagueId }: { leagueId: string }) {
  try {
    const standingsData = await fetchTeamStandings(leagueId);
    const teams: ApiTeam[] = standingsData.standings.results;

    const mappedTeams: Team[] = teams.map((team) => ({
      rank: team.rank,
      managerName: team.player_name,
      teamName: team.entry_name,
      totalPoints: team.total,
      eventTotal: team.event_total,
    }));

    return (
      <div>
        <TeamStatisticsTable stats={mappedTeams} />
      </div>
    );
  } catch (error) {
    console.error('Error loading team statistics:', error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
}
