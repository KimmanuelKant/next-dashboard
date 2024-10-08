// src/components/TeamStatistics.tsx
import TeamStatisticsTable from '@/components/TeamStatisticsTable';
import { Team, ApiTeam, ManagerHistory, Player, GameEvent, Pick, LiveElement, LiveData } from '@/types';

async function fetchManagerData(
  teamId: number,
  completedGameweeks: number[],
  liveDataMap: Map<number, LiveElement[]>,
  players: Player[]
) {
  // Fetch manager history
  const managerHistoryRes = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/history/`);
  if (!managerHistoryRes.ok) {
    throw new Error(`Failed to fetch manager history for team ID ${teamId}`);
  }
  const managerHistory: ManagerHistory = await managerHistoryRes.json();

  const currentSeason = managerHistory.current;
  const latestGW = currentSeason[currentSeason.length - 1];
  const totalTransfers = currentSeason.reduce((sum, gw) => sum + gw.event_transfers, 0);
  const totalTransferPointsDeducted = currentSeason.reduce((sum, gw) => sum + gw.event_transfers_cost, 0);
  const chipsUsed = managerHistory.chips.map(chip => chip.name);
  const pointsOnBench = currentSeason.reduce((sum, gw) => sum + gw.points_on_bench, 0);

  // Calculate highest gameweek score
  const highestGameweekScore = currentSeason.reduce((max, gw) => {
    return gw.points > max ? gw.points : max;
  }, 0);

  // Fetch picks for all completed gameweeks
  const picksPromises = completedGameweeks.map(async (gw) => {
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`);
    if (!res.ok) {
      console.warn(`Warning: Failed to fetch picks for team ID ${teamId} in gameweek ${gw}. Status: ${res.status}`);
      return { gw, picks: [] };
    }
    const data = await res.json();
    return { gw, picks: data.picks };
  });
  const picksArray = await Promise.all(picksPromises);

  // Calculate total captain points
  let totalCaptainPoints = 0;

  
  picksArray.forEach(({ gw, picks }) => {
    if (picks.length === 0) {
      console.warn(`Warning: No picks found for team ID ${teamId} in gameweek ${gw}`);
      return;
    }
      const captainPick = picks.find((pick: Pick) => pick.is_captain);
    if (captainPick) {
      const playerId = captainPick.element;
      const liveElements = liveDataMap.get(gw);
      if (!liveElements) {
        console.warn(`No live data found for gameweek ${gw}`);
        return;
      }
      const playerData = liveElements.find((element: LiveElement) => element.id === playerId);
      if (playerData) {
        totalCaptainPoints += playerData.stats.total_points;
      } else {
      console.warn(`No player data found for player ID ${playerId} in gameweek ${gw}`);
    }
  } else {
    console.warn(`No captain found for team ID ${teamId} in gameweek ${gw}`);
  }
  });

  // Get captain and vice-captain names for latest gameweek
  const latestPicksRes = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${latestGW.event}/picks/`);
  if (!latestPicksRes.ok) {
    throw new Error(`Failed to fetch picks for team ID ${teamId} in gameweek ${latestGW.event}`);
  }
  const latestPicksData = await latestPicksRes.json();
  const latestPicks = latestPicksData.picks;

  const captainPick = latestPicks.find((pick: Pick) => pick.is_captain);
  const viceCaptainPick = latestPicks.find((pick: Pick) => pick.is_vice_captain);

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
    totalTransferPointsDeducted,
    highestGameweekScore,
    totalCaptainPoints,
    captain,
    viceCaptain,
  };
}

export default async function TeamStatistics({ leagueId }: { leagueId: string }) {
  try {
    // Fetch standings data
    const standingsDataRes = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
      { cache: 'no-store' }
    );
    if (!standingsDataRes.ok) {
      throw new Error('Failed to fetch team standings');
    }
    const standingsData = await standingsDataRes.json();
    const teams: ApiTeam[] = standingsData.standings.results;

    // Fetch player data once
    const playersDataRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    if (!playersDataRes.ok) {
      throw new Error('Failed to fetch player data');
    }
    const playersData = await playersDataRes.json();
    const players: Player[] = playersData.elements;

    // Get events (gameweeks)
    const events: GameEvent[] = playersData.events;

    // Get the list of completed gameweeks
    const completedGameweeks = events.filter(event => event.finished).map(event => event.id);

    // Fetch live data for all completed gameweeks
    const liveDataPromises = completedGameweeks.map(async (gw) => {
      const res = await fetch(`https://fantasy.premierleague.com/api/event/${gw}/live/`);
      if (!res.ok) {
        throw new Error(`Failed to fetch live data for gameweek ${gw}`);
      }
      const data : LiveData = await res.json();
      return { gw, elements: data.elements };
    });

    const liveDataArray = await Promise.all(liveDataPromises);

    // Map live data for easy access
    const liveDataMap = new Map<number, LiveElement[]>();
    liveDataArray.forEach(({ gw, elements }) => {
      liveDataMap.set(gw, elements);
    });

    // Fetch manager data in parallel
    const managerDataPromises = teams.map(async team => {
      const teamId = team.entry;

      const managerData = await fetchManagerData(teamId, completedGameweeks, liveDataMap, players);

      // Map to your Team interface
      const mappedTeam: Team = {
        rank: team.rank,
        managerName: team.player_name,
        teamName: team.entry_name,
        totalPoints: team.total,
        eventTotal: team.event_total,
        teamId: team.entry,
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
