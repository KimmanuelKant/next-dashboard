// src/components/TeamStatistics.tsx
import TeamStatisticsTable from '@/components/TeamStatisticsTable';
import { Team, ApiTeam, ManagerHistory, ManagerPicks, Player } from '@/types';

async function fetchTeamStandings(leagueId: string): Promise<{ standings: { results: ApiTeam[] } }> {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch team standings');
  }

  return res.json();
}

async function fetchManagerData(teamId: number, eventId: number, players: Player[]) {
  // Fetch manager history and picks in parallel
  const [managerHistoryRes, managerPicksRes] = await Promise.all([
    fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/history/`),
    fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${eventId}/picks/`),
  ]);

  if (!managerHistoryRes.ok || !managerPicksRes.ok) {
    throw new Error(`Failed to fetch data for team ID ${teamId}`);
  }

  const managerHistory: ManagerHistory = await managerHistoryRes.json();
  const managerPicks: ManagerPicks = await managerPicksRes.json();

  // Process manager history
  const currentSeason = managerHistory.current;
  const latestGW = currentSeason[currentSeason.length - 1];
  const totalTransfers = currentSeason.reduce((sum, gw) => sum + gw.event_transfers, 0);
  const chipsUsed = managerHistory.chips.map(chip => chip.name);
  const pointsOnBench = currentSeason.reduce((sum, gw) => sum + gw.points_on_bench, 0);

  // Get captain and vice-captain
  const captainPick = managerPicks.picks.find(pick => pick.is_captain);
  const viceCaptainPick = managerPicks.picks.find(pick => pick.is_vice_captain);

  const captain = players.find(player => player.id === captainPick?.element)?.web_name || '';
  const viceCaptain = players.find(player => player.id === viceCaptainPick?.element)?.web_name || '';

  return {
    totalTransfers,
    transfersThisWeek: latestGW.event_transfers,
    teamValue: latestGW.value / 10,
    bank: latestGW.bank / 10,
    overallRank: latestGW.overall_rank,
    chipsUsed,
    pointsOnBench,
    captain,
    viceCaptain,
  };
}

export default async function TeamStatistics({ leagueId }: { leagueId: string }) {
  try {
    const standingsData = await fetchTeamStandings(leagueId);
    const teams: ApiTeam[] = standingsData.standings.results;

    // Fetch player data once
    const playersDataRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    if (!playersDataRes.ok) {
      throw new Error('Failed to fetch player data');
    }
    const playersData = await playersDataRes.json();
    const players: Player[] = playersData.elements;

    // Determine the latest event (gameweek)
    const latestEventId = playersData.events.find(event => event.is_current)?.id || 1;

    // Fetch manager data in parallel
    const managerDataPromises = teams.map(async team => {
      const teamId = team.entry;

      const managerData = await fetchManagerData(teamId, latestEventId, players);

      // Map to your Team interface
      const mappedTeam: Team = {
        rank: team.rank,
        managerName: team.player_name,
        teamName: team.entry_name,
        totalPoints: team.total,
        eventTotal: team.event_total,
        ...managerData,
      };

      return mappedTeam;
    });

    const mappedTeams = await Promise.all(managerDataPromises);

    return (
      <div>
        <TeamStatisticsTable stats={mappedTeams} />
      </div>
    );
  } catch (error) {
    console.error('Error loading team statistics:', error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
}
