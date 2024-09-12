export default async function PlayerStatistics({ leagueId }: { leagueId: string }) {
  try {
    const standingsRes = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
    if (!standingsRes.ok) {
      throw new Error("Failed to fetch league standings");
    }
    const standingsData: { standings: { results: Array<{ player_name: string; entry_name: string; total: number }> } } = await standingsRes.json();

    const playersRes = await fetch(`https://fantasy.premierleague.com/api/bootstrap-static/`);
    if (!playersRes.ok) {
      throw new Error("Failed to fetch player data");
    }
    const playersData: { elements: Array<{ id: number; web_name: string; total_points: number }> } = await playersRes.json();

    const managers = standingsData.standings.results;
    const players = playersData.elements.slice(0, 10);

    return (
      <div>
        <h2>Player Statistics</h2>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Manager Name</th>
              <th>Team Name</th>
              <th>Points</th>
              <th>Top 10 Players</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((manager) => (
              <tr key={manager.entry_name}>
                <td>{manager.player_name}</td>
                <td>{manager.entry_name}</td>
                <td>{manager.total}</td>
                <td>
                  <ul>
                    {players.map((player) => (
                      <li key={player.id}>{player.web_name} - {player.total_points} points</li>
                    ))}
                  </ul>
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
