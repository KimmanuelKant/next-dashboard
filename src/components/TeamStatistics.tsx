// src/components/TeamStatistics.tsx
export default async function TeamStatistics({ leagueId }: { leagueId: string }) {
    const res = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings`);
    const data = await res.json();
  
    return (
      <table>
        <thead>
          <tr>
            <th>Team Name</th>
            <th>Points</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          {data.standings.results.map((team: any) => (
            <tr key={team.entry}>
              <td>{team.entry_name}</td>
              <td>{team.total}</td>
              <td>{team.rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  