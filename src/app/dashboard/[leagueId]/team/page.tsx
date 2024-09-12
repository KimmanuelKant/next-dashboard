// src/app/dashboard/[leagueId]/team/page.tsx
import TeamStatisticsTable from "@/components/TeamStatisticsTable";
import React from "react";

// This function runs on the server
async function fetchTeamStandings(leagueId: string) {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
    {
      cache: "no-store", // Disable cache to fetch fresh data
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch team standings");
  }

  return res.json();
}

// The default export is the server component
export default async function TeamPage({
  params,
}: {
  params: { leagueId: string };
}) {
  try {
    const standingsData = await fetchTeamStandings(params.leagueId);
    const teams = standingsData.standings.results;

    return (
      <div>
        <h2>Team Statistics for League {params.leagueId}</h2>


        <TeamStatisticsTable
          stats={teams.map((team: any) => ({
            rank: team.rank,
            managerName: team.player_name,
            teamName: team.entry_name,
            totalPoints: team.total,
            eventTotal: team.event_total,
          }))}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading team statistics:", error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
}
