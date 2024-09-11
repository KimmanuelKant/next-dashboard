// src/app/dashboard/[leagueId]/team/page.tsx
import React from 'react';

// This function runs on the server
async function fetchTeamStandings(leagueId: string) {
  const res = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`, {
    cache: 'no-store'  // Disable cache to fetch fresh data
  });

  if (!res.ok) {
    throw new Error('Failed to fetch team standings');
  }

  return res.json();
}

// The default export is the server component
export default async function TeamPage({ params }: { params: { leagueId: string } }) {
  try {
    const standingsData = await fetchTeamStandings(params.leagueId);
    const teams = standingsData.standings.results;

    return (
      <div>
        <h2>Team Statistics for League {params.leagueId}</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Manager Name</th>
              <th>Team Name</th>
              <th>Total Points</th>
              <th>Event Total (Latest GW Points)</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team: any) => (
              <tr key={team.entry}>
                <td>{team.rank}</td>
                <td>{team.player_name}</td>
                <td>{team.entry_name}</td>
                <td>{team.total}</td>
                <td>{team.event_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch (error) {
    console.error("Error loading team statistics:", error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
}
