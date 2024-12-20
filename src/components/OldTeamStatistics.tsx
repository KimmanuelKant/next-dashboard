// src/components/TeamStatistics.tsx

import TeamStatisticsTable from '@/components/TeamStatisticsTable';
import { Team, PicksData, ChipData } from '@/types/derived/LeagueDerivedTypes';
import { FplLeagueStandingResult } from '@/types/fpl/FplLeagueStandings';
import { FplEntryHistory } from '@/types/fpl/FplEntryHistory';
import { FplElement, FplEvent } from '@/types/fpl/FplBootstrapStatic';
import { FplPick } from '@/types/fpl/FplEntryEventPicks';
import { FplEventLive, FplEventLiveElement } from '@/types/fpl/FplEventLive';



async function fetchManagerData(
  teamId: number,
  completedGameweeks: number[],
  liveDataMap: Map<number, FplEventLiveElement[]>,
  players: FplElement[],
  totalPoints: number
) {
  // Fetch the manager's season history
  const managerHistoryRes = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/history/`);
  if (!managerHistoryRes.ok) {
    throw new Error(`Failed to fetch manager history for team ID ${teamId}`);
  }
  const managerHistory: FplEntryHistory = await managerHistoryRes.json();

  // Extract current season data
  const currentSeason = managerHistory.current;
  const latestGW = currentSeason[currentSeason.length - 1];

  // Calculate total transfers and transfer points deducted over the season
  const totalTransfers = currentSeason.reduce((sum, gw) => sum + gw.event_transfers, 0);
  const totalTransferPointsDeducted = currentSeason.reduce((sum, gw) => sum + gw.event_transfers_cost, 0);

  // Extract chips used this season
  const chipsUsed = managerHistory.chips.map(chip => chip.name);

  // Calculate total points on bench over the season
  const pointsOnBench = currentSeason.reduce((sum, gw) => sum + gw.points_on_bench, 0);

  // Find the highest gameweek score achieved by the manager
  const highestGameweekScore = currentSeason.reduce((max, gw) => {
    return gw.points > max ? gw.points : max;
  }, 0);

  // Count the number of wildcards used
  const wildcardsUsed = managerHistory.chips.filter(chip => chip.name === 'wildcard').length;

  // Fetch picks for all completed gameweeks
  const picksPromises = completedGameweeks.map(async (gw) => {
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`);
    if (!res.ok) {
      console.warn(`Warning: Failed to fetch picks for team ID ${teamId} in gameweek ${gw}. Status: ${res.status}`);
      // Return an empty picks array if the fetch fails
      return { gw, picks: [] };
    }
    const data = await res.json();
    return { gw, picks: data.picks };
  });
  const picksArray: PicksData[] = await Promise.all(picksPromises);

  // Initialize tripleCaptainData
let tripleCaptainData: ChipData | null = null;

// Find if triple captain chip was used
const tripleCaptainChip = managerHistory.chips.find(chip => chip.name === '3xc');

if (tripleCaptainChip) {
  const gw = tripleCaptainChip.event;

  // Find picks for the gameweek when triple captain was used
  const picksData = picksArray.find((pickData: PicksData) => pickData.gw === gw);
  if (picksData && picksData.picks.length > 0) {
    const captainPick = picksData.picks.find((pick: FplPick) => pick.is_captain);
    if (captainPick) {
      const playerId = captainPick.element;
      const liveElements = liveDataMap.get(gw);
      if (liveElements) {
        const playerData = liveElements.find((element: FplEventLiveElement) => element.id === playerId);
        if (playerData) {
          // Calculate the extra points gained from triple captain
          const basePoints = playerData.stats.total_points;
          const extraPoints = basePoints; // Triple Captain adds an extra x1 multiplier
          tripleCaptainData = { points: extraPoints, gw };
        } else {
          console.warn(`No player data found for player ID ${playerId} in gameweek ${gw}`);
        }
      } else {
        console.warn(`No live data found for gameweek ${gw}`);
      }
    } else {
      console.warn(`No captain found for team ID ${teamId} in gameweek ${gw}`);
    }
  } else {
    console.warn(`No picks found for team ID ${teamId} in gameweek ${gw}`);
  }
}


// Initialize positional point accumulators
let totalGKPoints = 0;
let totalDEFPoints = 0;
let totalMIDPoints = 0;
let totalFWDPoints = 0;  

// Iterate over gameweeks and picks to calculate points by position
picksArray.forEach(({ gw, picks }: PicksData) => {
  if (picks.length === 0) {
    console.warn(`Warning: No picks found for team ID ${teamId} in gameweek ${gw}`);
    return;
  }
  
  // Get live data for the current gameweek
  const liveElements = liveDataMap.get(gw);
  if (!liveElements) {
    console.warn(`No live data found for gameweek ${gw}`);
    return;
  }

  picks.forEach((pick: FplPick) => {
    const playerId = pick.element;
    const player = players.find(player => player.id === playerId);

    if (!player) {
      console.warn(`Player with ID ${playerId} not found in players data`);
      return;
    }

    // Get the player's position
    const position = player.element_type; // 1: GK, 2: DEF, 3: MID, 4: FWD
    
    // Get the player's points for the gameweek
    const playerData = liveElements.find((element: FplEventLiveElement) => element.id === playerId);
    if (!playerData) {
      console.warn(`No player data found for player ID ${playerId} in gameweek ${gw}`);
      return;
    }

    const playerPoints = playerData.stats.total_points * pick.multiplier;

    // Accumulate points based on position
    switch (position) {
      case 1:
        totalGKPoints += playerPoints;
        break;
      case 2:
        totalDEFPoints += playerPoints;
        break;
      case 3:
        totalMIDPoints += playerPoints;
        break;
      case 4:
        totalFWDPoints += playerPoints;
        break;
      default:
        console.warn(`Unknown position ${position} for player ID ${playerId}`);
    }
  });
});

// Initialize benchBoostData
let benchBoostData: ChipData | null = null;

// Find if bench boost chip was used
const benchBoostChip = managerHistory.chips.find(chip => chip.name === 'bboost');

if (benchBoostChip) {
  const gw = benchBoostChip.event;

  // Find picks for the gameweek when bench boost was used
  const picksData = picksArray.find((pickData: PicksData) => pickData.gw === gw);
  if (picksData && picksData.picks.length > 0) {
    const benchPicks = picksData.picks.filter((pick: FplPick) => pick.position >= 12 && pick.position <= 15);
    const liveElements = liveDataMap.get(gw);
    if (liveElements) {
      let benchPoints = 0;
      benchPicks.forEach((pick: FplPick) => {
        const playerId = pick.element;
        const playerData = liveElements.find((element: FplEventLiveElement) => element.id === playerId);
        if (playerData) {
          benchPoints += playerData.stats.total_points;
        } else {
          console.warn(`No player data found for player ID ${playerId} in gameweek ${gw}`);
        }
      });
      benchBoostData = { points: benchPoints, gw };
    } else {
      console.warn(`No live data found for gameweek ${gw}`);
    }
  } else {
    console.warn(`No picks found for team ID ${teamId} in gameweek ${gw}`);
  }
}


 // Initialize freeHitData
let freeHitData: ChipData | null = null;

// Find if Free Hit chip was used
const freeHitChip = managerHistory.chips.find(chip => chip.name === 'freehit');

if (freeHitChip) {
  const gw = freeHitChip.event;

  // Find gameweek data for when Free Hit was used
  const gwData = currentSeason.find(gwData => gwData.event === gw);
  if (gwData) {
    // The total points for that gameweek
    freeHitData = { points: gwData.points, gw };
  } else {
    console.warn(`No gameweek data found for team ID ${teamId} in gameweek ${gw}`);
  }
}


  // Calculate total captain points over the season
  let totalCaptainPoints = 0;
  picksArray.forEach(({ gw, picks }: PicksData) => {
    if (picks.length === 0) {
      console.warn(`Warning: No picks found for team ID ${teamId} in gameweek ${gw}`);
      return;
    }
    // Find the captain pick for the gameweek
    const captainPick = picks.find((pick: FplPick) => pick.is_captain);
    if (captainPick) {
      const playerId = captainPick.element;
      const liveElements = liveDataMap.get(gw);
      if (!liveElements) {
        console.warn(`No live data found for gameweek ${gw}`);
        return;
      }
      const playerData = liveElements.find((element: FplEventLiveElement) => element.id === playerId);
      if (playerData) {
        // Multiply the player's points by the captain's multiplier
        const captainPoints = playerData.stats.total_points * captainPick.multiplier;
        totalCaptainPoints += captainPoints;
      } else {
        console.warn(`No player data found for player ID ${playerId} in gameweek ${gw}`);
      }
    } else {
      console.warn(`No captain found for team ID ${teamId} in gameweek ${gw}`);
    }
  });

  // Calculate captainPointsPercentage
  const captainPointsPercentage = totalPoints > 0 ? (totalCaptainPoints / totalPoints) * 100 : 0;

  // Fetch the latest picks to get current captain and vice-captain
  const latestPicksRes = await fetch(
    `https://fantasy.premierleague.com/api/entry/${teamId}/event/${latestGW.event}/picks/`
  );
  if (!latestPicksRes.ok) {
    throw new Error(`Failed to fetch picks for team ID ${teamId} in gameweek ${latestGW.event}`);
  }
  const latestPicksData = await latestPicksRes.json();
  const latestPicks = latestPicksData.picks;

  // Identify the captain and vice-captain from the latest picks
  const latestCaptainPick = latestPicks.find((pick: FplPick) => pick.is_captain);
  const latestViceCaptainPick = latestPicks.find((pick: FplPick) => pick.is_vice_captain);

  // Get the names of the captain and vice-captain
  const captain = players.find(player => player.id === latestCaptainPick?.element)?.web_name || '';
  const viceCaptain = players.find(player => player.id === latestViceCaptainPick?.element)?.web_name || '';

  // Find the best overall rank achieved for the season by the manager
  const bestOverallRank = currentSeason.reduce((min, gw) => {
    return gw.overall_rank < min ? gw.overall_rank : min;
  }, currentSeason[0].overall_rank);

  // find the worst overall rank achieved for the season by the manager
  const worstOverallRank = currentSeason.reduce((max, gw) => {
    return gw.overall_rank > max ? gw.overall_rank : max;
  }, currentSeason[0].overall_rank);

  // Find the highest gameweek rank achieved by the manager
  const highestGameweekRank = currentSeason.reduce((min, gw) => {
    return gw.rank < min ? gw.rank : min;
  }, currentSeason[0].rank);

  // Find the lowest gameweek rank achieved by the manager
  const lowestGameweekRank = currentSeason.reduce((max, gw) => {
    return gw.rank > max ? gw.rank : max;
  }, currentSeason[0].rank);

  // Calculate total chip points
  let totalChipPoints = 0;
  if (tripleCaptainData && tripleCaptainData.points) {
    totalChipPoints += tripleCaptainData.points;
  }
  if (benchBoostData && benchBoostData.points) {
    totalChipPoints += benchBoostData.points;
  }
  if (freeHitData && freeHitData.points) {
    totalChipPoints += freeHitData.points;
  }


  // Return the aggregated data for the manager
  return {
    totalTransfers,
    transfersThisWeek: latestGW.event_transfers,
    teamValue: latestGW.value / 10, // Convert value to correct format
    bank: latestGW.bank / 10,       // Convert bank to correct format
    overallRank: latestGW.overall_rank,
    chipsUsed,
    pointsOnBench,
    totalTransferPointsDeducted,
    highestGameweekScore,
    totalCaptainPoints,
    captainPointsPercentage,
    wildcardsUsed,
    tripleCaptainData,
    benchBoostData,
    freeHitData,
    totalChipPoints,
    captain,
    viceCaptain,
    bestOverallRank,
    worstOverallRank,
    highestGameweekRank,
    lowestGameweekRank,
    totalGKPoints,
    totalDEFPoints,
    totalMIDPoints,
    totalFWDPoints,
  };
}

export default async function TeamStatistics({ leagueId }: { leagueId: string }) {
  try {
    // Fetch league standings data
    const standingsDataRes = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
      { cache: 'no-store' }
    );
    if (!standingsDataRes.ok) {
      throw new Error('Failed to fetch team standings');
    }
    const standingsData = await standingsDataRes.json();
    const teams: FplLeagueStandingResult[] = standingsData.standings.results;

    // Fetch player data (names, IDs, etc.)
    const playersDataRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    if (!playersDataRes.ok) {
      throw new Error('Failed to fetch player data');
    }
    const playersData = await playersDataRes.json();
    const players: FplElement[] = playersData.elements;

    // Get the list of game events (gameweeks)
    const events: FplEvent[] = playersData.events;

    // Identify all completed gameweeks
    const completedGameweeks = events.filter(event => event.finished).map(event => event.id);

    // Fetch live data for all completed gameweeks
    const liveDataPromises = completedGameweeks.map(async (gw) => {
      const res = await fetch(`https://fantasy.premierleague.com/api/event/${gw}/live/`);
      if (!res.ok) {
        throw new Error(`Failed to fetch live data for gameweek ${gw}`);
      }
      const data: FplEventLive = await res.json();
      return { gw, elements: data.elements };
    });

    const liveDataArray = await Promise.all(liveDataPromises);

    // Create a map of live data for quick access by gameweek
    const liveDataMap = new Map<number, FplEventLiveElement[]>();
    liveDataArray.forEach(({ gw, elements }) => {
      liveDataMap.set(gw, elements);
    });

    // Fetch and process data for all managers in parallel
    const managerDataPromises = teams.map(async team => {
      const teamId = team.entry;

      // Fetch detailed data for each manager
      const managerData = await fetchManagerData(
        teamId,
        completedGameweeks,
        liveDataMap,
        players,
        team.total
      );

      // Map the data to the Team interface
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

    // Render the TeamStatisticsTable component with the fetched data
    return (
      <div>
        <TeamStatisticsTable stats={mappedTeams} />
      </div>
    );
  } catch (error) {
    // Log any errors and display an error message
    console.error('Error loading team statistics:', error);
    return <div>Error loading team statistics. Please try again later.</div>;
  }
}
