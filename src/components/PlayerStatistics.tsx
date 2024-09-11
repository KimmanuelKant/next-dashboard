export default async function PlayerStatistics({ leagueId }: { leagueId: string }) {
    try {
      // Fetch league standings
      const standingsRes = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
      if (!standingsRes.ok) {
        console.error("Error fetching standings:", standingsRes.status, standingsRes.statusText);
        throw new Error("Failed to fetch league standings");
      }
      const standingsData = await standingsRes.json();
  
      // Fetch general player data (from bootstrap-static)
      const playersRes = await fetch(`https://fantasy.premierleague.com/api/bootstrap-static/`);
      if (!playersRes.ok) {
        console.error("Error fetching players data:", playersRes.status, playersRes.statusText);
        throw new Error("Failed to fetch player data");
      }
      const playersData = await playersRes.json();
  
      const managers = standingsData.standings.results;
  
      return (
        <div>
          <h2>Player Statistics</h2>
          <table>
            <thead>
              <tr>
                <th>Manager Name</th>
                <th>Team Name</th>
                <th>Points</th>
                <th>Player Information</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager: any) => (
                <tr key={manager.entry}>
                  <td>{manager.player_name}</td>
                  <td>{manager.entry_name}</td>
                  <td>{manager.total}</td>
                  <td>
                    <div>No data available</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch (error) {
      console.error("Failed to load player statistics:", error);
      return <div>Error loading player statistics. Please try again later.</div>;
    }
  }
  