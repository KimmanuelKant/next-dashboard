// src/components/LeagueTeamStats.tsx

import React from 'react';
import TeamStatisticsTable from '@/components/TeamStatisticsTable';
import { computeLeagueTeamStats } from '@/lib/leagueTeamService';
import { getLeagueStandings, getBootstrapData } from '@/lib/fplApiClient';
import { Team } from '@/types/derived/LeagueDerivedTypes';

interface Props {
  leagueId: string;
}

const LeagueTeamStats: React.FC<Props> = async ({ leagueId }) => {
  try {
    // Fetch league standings and bootstrap data in parallel
    const [standings, bootstrapData] = await Promise.all([
      getLeagueStandings(leagueId),
      getBootstrapData(),
    ]);

    // Compute league team stats
    const teams: Team[] = await computeLeagueTeamStats(
      standings,
      bootstrapData.elements,
      bootstrapData.events
    );

    // Render the table with the fetched data
    return (
      <div>
        <TeamStatisticsTable stats={teams} />
      </div>
    );
  } catch (error) {
    console.error("Error loading team statistics:", error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
};

export default LeagueTeamStats;
