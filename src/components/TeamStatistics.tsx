import React from 'react';
import { Team } from '@/types'; // Importing the type
import TeamStatisticsTable from '@/components/TeamStatisticsTable';

async function fetchTeamStandings(leagueId: string): Promise<{ standings: { results: Team[] } }> {
  const res = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch team standings');
  }

  return res.json();
}

export default async function TeamStatistics({ leagueId }: { leagueId: string }) {
  try {
    const standingsData = await fetchTeamStandings(leagueId);
    // Properly type the `team` parameter here
    const teams: Team[] = standingsData.standings.results.map((team: Team) => ({
      rank: team.rank,
      managerName: team.managerName,
      teamName: team.teamName,
      totalPoints: team.totalPoints,
      eventTotal: team.eventTotal,
    }));

    return (
      <div>
        <h2>Team Statistics for League {leagueId}</h2>
        <TeamStatisticsTable stats={teams} />
      </div>
    );
  } catch (error) {
    console.error("Error loading team statistics:", error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
}
