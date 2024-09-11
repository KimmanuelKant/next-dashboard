// src/components/PlayerStatistics.tsx
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
  
      // Extract relevant data from standings
      const managers = standingsData.standings.results;
      
      // Prepare a map of players data by team entry ID
      const playerMap: { [id: string]: any } = {};
      playersData.elements.forEach((player: any) => {
        playerMap[player.id] = player;
      });
  
      // Now we can display player details for managers in the league
      return (
        <div>
          <h2>Player Statistics</h2>
          <table>
            <thead>
              <tr>
                <th>Manager Name</th>
                <th>Team Name</th>
                <th>Points</th>
                <th>Player Information</th> {/* For future use */}
              </tr>
            </thead>
            <tbody>
              {managers.map((manager: any) => (
                <tr key={manager.entry}>
                  <td>{manager.player_name}</td>
                  <td>{manager.entry_name}</td>
                  <td>{manager.total}</td>
                  <td> {/* Future detailed player information */}
                    {playerMap[manager.entry] ? (
                      <div>
                        {/* Example player info: */}
                        {/* You can replace this with more detailed player statistics */}
                        Player ID: {playerMap[manager.entry].id} <br />
                        Team: {playerMap[manager.entry].team}
                      </div>
                    ) : (
                      <div>No data available</div>
                    )}
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
  