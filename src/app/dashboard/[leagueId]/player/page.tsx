interface Manager {
  entry: number;
  player_name: string;
  entry_name: string;
  total: number;
}

interface Player {
  id: number;
  web_name: string;
  total_points: number;
}

export default async function PlayerPage({ params }: { params: { leagueId: string } }) {
  async function fetchPlayerStatistics(leagueId: string): Promise<{ standingsData: { standings: { results: Manager[] } }, playersData: { elements: Player[] } }> {
    // Fetch league standings
    const standingsRes = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
    if (!standingsRes.ok) {
      throw new Error('Failed to fetch standings');
    }
    const standingsData = await standingsRes.json();

    // Fetch general player data
    const playersRes = await fetch(`https://fantasy.premierleague.com/api/bootstrap-static/`);
    if (!playersRes.ok) {
      throw new Error('Failed to fetch player data');
    }
    const playersData = await playersRes.json();

    return { standingsData, playersData };
  }

  try {
    const { standingsData, playersData } = await fetchPlayerStatistics(params.leagueId);

    const managers: Manager[] = standingsData.standings.results;
    const players: Player[] = playersData.elements.slice(0, 10);

    return (
      <div>
        <h2>Player Statistics for League {params.leagueId}</h2>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Manager Name</th>
              <th>Team Name</th>
              <th>Total Points</th>
              <th>Top 10 Players</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((manager) => (
              <tr key={manager.entry}>
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
    console.error('Error loading player statistics:', error);
    return <div>Error loading player statistics. Please try again later.</div>;
  }
}
