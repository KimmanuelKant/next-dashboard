// src/pages/dashboard/[leagueId]/team.tsx

import React from 'react';
import TeamStatisticsTable from '@/components/TeamStatisticsTable';
import { computeLeagueTeamStats } from '@/lib/leagueTeamData';
import { getLeagueStandings, getBootstrapData } from '@/lib/fplApi';
import { FplElement, FplEvent } from '@/types/fpl/FplBootstrapStatic';
import { FplLeagueStandings } from '@/types/fpl/FplLeagueStandings';
import { Team } from '@/types/derived/LeagueDerivedTypes';

interface Props {
  leagueId: string;
}

const LeagueTeamStats: React.FC<Props> = async ({ leagueId }) => {
  try {
    console.log("\n=== DEBUG: LeagueTeamStats Component Started ===");
    console.log("Fetching league standings and bootstrap data...");

    // Fetch league standings and bootstrap data in parallel
    const [standings, bootstrapData] = await Promise.all([
      getLeagueStandings(leagueId),
      getBootstrapData(),
    ]);

    console.log("League standings and bootstrap data fetched.");

    // Compute league team stats
    const teams: Team[] = await computeLeagueTeamStats(
      standings,
      bootstrapData.elements,
      bootstrapData.events
    );

    console.log("League team stats computed successfully.");

    // Render the table with the fetched data
    return (
      <div>
        <h1>League Team Statistics</h1>
        <TeamStatisticsTable stats={teams} />
      </div>
    );
  } catch (error) {
    console.error("Error loading team statistics:", error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
};

export default LeagueTeamStats;
