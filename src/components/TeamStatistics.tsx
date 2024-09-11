// src/components/TeamStatistics.tsx
export default async function TeamStatistics({ leagueId }: { leagueId: string }) {
    try {
      // Fetch team standings from the FPL API
      const res = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch team standings");
      }
  
      const standingsData = await res.json();
  
      // Extract the relevant data from standings
      const teams = standingsData.standings.results;
  
      return (
        <div>
          <h2>Team Statistics for League {leagueId}</h2>
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
  