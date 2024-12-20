// src/lib/leagueTeamData.ts

import { FplLeagueStandingResult, FplLeagueStandings } from '@/types/fpl/FplLeagueStandings';
import { FplElement, FplEvent } from '@/types/fpl/FplBootstrapStatic';
import { Team, PicksData, ChipData } from '@/types/derived/LeagueDerivedTypes';
import { FplEventLiveElement } from '@/types/fpl/FplEventLive';
import { getEntryHistory, getEntryEventPicks, getLiveDataForGameweek } from './fplApi';
import { FplEntryHistory } from '@/types/fpl/FplEntryHistory';
import { FplPick } from '@/types/fpl/FplEntryEventPicks';

// Utility function to fetch picks for multiple gameweeks
async function fetchPicksForGameweeks(teamId: number, completedGameweeks: number[]): Promise<PicksData[]> {
  const picksPromises = completedGameweeks.map(async (gw) => {
    try {
      const data = await getEntryEventPicks(teamId, gw);
      return { gw, picks: data.picks };
    } catch (err) {
      console.warn(`Warning: Failed to fetch picks for team ID ${teamId} in GW ${gw}. Err: ${err}`);
      return { gw, picks: [] };
    }
  });
  return Promise.all(picksPromises);
}

async function fetchManagerData(
  teamId: number,
  completedGameweeks: number[],
  liveDataMap: Map<number, FplEventLiveElement[]>,
  players: FplElement[],
  totalPoints: number
) {
  const managerHistory: FplEntryHistory = await getEntryHistory(teamId);

  const currentSeason = managerHistory.current;
  const latestGW = currentSeason[currentSeason.length - 1];

  // Calculate aggregates
  const totalTransfers = currentSeason.reduce((sum, gw) => sum + gw.event_transfers, 0);
  const totalTransferPointsDeducted = currentSeason.reduce((sum, gw) => sum + gw.event_transfers_cost, 0);
  const chipsUsed = managerHistory.chips.map(chip => chip.name);
  const pointsOnBench = currentSeason.reduce((sum, gw) => sum + gw.points_on_bench, 0);
  const highestGameweekScore = currentSeason.reduce((max, gw) => (gw.points > max ? gw.points : max), 0);
  const wildcardsUsed = managerHistory.chips.filter(chip => chip.name === 'wildcard').length;

  const picksArray = await fetchPicksForGameweeks(teamId, completedGameweeks);

  // Functions to find chip data (triple captain, bench boost, free hit) could be extracted, but for brevity keep here
  let tripleCaptainData: ChipData | null = null;
  const tripleCaptainChip = managerHistory.chips.find(chip => chip.name === '3xc');

  if (tripleCaptainChip) {
    const gw = tripleCaptainChip.event;
    const picksData = picksArray.find((p) => p.gw === gw);
    if (picksData && picksData.picks.length > 0) {
      const captainPick = picksData.picks.find((pick) => pick.is_captain);
      if (captainPick) {
        const liveElements = liveDataMap.get(gw);
        if (liveElements) {
          const playerData = liveElements.find((e) => e.id === captainPick.element);
          if (playerData) {
            const basePoints = playerData.stats.total_points;
            tripleCaptainData = { points: basePoints, gw };
          }
        }
      }
    }
  }

  // Positional points
  let totalGKPoints = 0;
  let totalDEFPoints = 0;
  let totalMIDPoints = 0;
  let totalFWDPoints = 0;

  for (const { gw, picks } of picksArray) {
    if (picks.length === 0) continue;
    const liveElements = liveDataMap.get(gw);
    if (!liveElements) continue;

    for (const pick of picks) {
      const player = players.find(p => p.id === pick.element);
      if (!player) continue;
      const playerData = liveElements.find(e => e.id === pick.element);
      if (!playerData) continue;

      const playerPoints = playerData.stats.total_points * pick.multiplier;
      switch (player.element_type) {
        case 1: totalGKPoints += playerPoints; break;
        case 2: totalDEFPoints += playerPoints; break;
        case 3: totalMIDPoints += playerPoints; break;
        case 4: totalFWDPoints += playerPoints; break;
      }
    }
  }

  let benchBoostData: ChipData | null = null;
  const benchBoostChip = managerHistory.chips.find(chip => chip.name === 'bboost');
  if (benchBoostChip) {
    const gw = benchBoostChip.event;
    const picksData = picksArray.find(p => p.gw === gw);
    if (picksData && picksData.picks.length > 0) {
      const benchPicks = picksData.picks.filter(p => p.position >= 12 && p.position <= 15);
      const liveElements = liveDataMap.get(gw);
      if (liveElements) {
        let benchPoints = 0;
        benchPicks.forEach((pick) => {
          const playerData = liveElements.find(e => e.id === pick.element);
          if (playerData) benchPoints += playerData.stats.total_points;
        });
        benchBoostData = { points: benchPoints, gw };
      }
    }
  }

  let freeHitData: ChipData | null = null;
  const freeHitChip = managerHistory.chips.find(chip => chip.name === 'freehit');
  if (freeHitChip) {
    const gw = freeHitChip.event;
    const gwData = currentSeason.find(gwData => gwData.event === gw);
    if (gwData) {
      freeHitData = { points: gwData.points, gw };
    }
  }

  let totalCaptainPoints = 0;
  for (const { gw, picks } of picksArray) {
    const captainPick = picks.find(p => p.is_captain);
    if (captainPick) {
      const liveElements = liveDataMap.get(gw);
      if (liveElements) {
        const playerData = liveElements.find(e => e.id === captainPick.element);
        if (playerData) {
          const captainPoints = playerData.stats.total_points * captainPick.multiplier;
          totalCaptainPoints += captainPoints;
        }
      }
    }
  }

  const captainPointsPercentage = totalPoints > 0 ? (totalCaptainPoints / totalPoints) * 100 : 0;

  // Latest picks to find current captain and vice-captain
  const latestPicksData = await getEntryEventPicks(teamId, latestGW.event);
  const latestPicks = latestPicksData.picks;
  const latestCaptainPick = latestPicks.find(p => p.is_captain);
  const latestViceCaptainPick = latestPicks.find(p => p.is_vice_captain);

  const captainName = players.find(p => p.id === latestCaptainPick?.element)?.web_name || '';
  const viceCaptainName = players.find(p => p.id === latestViceCaptainPick?.element)?.web_name || '';

  const bestOverallRank = currentSeason.reduce((min, gw) => (gw.overall_rank < min ? gw.overall_rank : min), currentSeason[0].overall_rank);
  const worstOverallRank = currentSeason.reduce((max, gw) => (gw.overall_rank > max ? gw.overall_rank : max), currentSeason[0].overall_rank);
  const highestGameweekRank = currentSeason.reduce((min, gw) => (gw.rank < min ? gw.rank : min), currentSeason[0].rank);
  const lowestGameweekRank = currentSeason.reduce((max, gw) => (gw.rank > max ? gw.rank : max), currentSeason[0].rank);

  let totalChipPoints = 0;
  if (tripleCaptainData?.points) totalChipPoints += tripleCaptainData.points;
  if (benchBoostData?.points) totalChipPoints += benchBoostData.points;
  if (freeHitData?.points) totalChipPoints += freeHitData.points;

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
    captainPointsPercentage,
    wildcardsUsed,
    tripleCaptainData,
    benchBoostData,
    freeHitData,
    totalChipPoints,
    captain: captainName,
    viceCaptain: viceCaptainName,
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

/**
 * Compute league-level team stats (Team[])
 * @param leagueStandings Raw league standings
 * @param allFplPlayers Global FPL player data
 * @param fplEvents List of FPL events
 */
export async function computeLeagueTeamStats(
  leagueStandings: FplLeagueStandings,
  allFplPlayers: FplElement[],
  fplEvents: FplEvent[]
): Promise<Team[]> {
  const leagueEntries = leagueStandings.standings.results;
  const completedGameweeks = fplEvents.filter(e => e.finished).map(e => e.id);

  // Fetch live data for all completed gameweeks
  const liveDataMap = new Map<number, FplEventLiveElement[]>();
  const liveDataPromises = completedGameweeks.map(async (gw) => {
    const data = await getLiveDataForGameweek(gw);
    return { gw, elements: data.elements };
  });
  const liveDataArray = await Promise.all(liveDataPromises);
  liveDataArray.forEach(({ gw, elements }) => {
    liveDataMap.set(gw, elements);
  });

  // Process each manager (team) in parallel
  const managerDataPromises = leagueEntries.map(async entry => {
    const managerData = await fetchManagerData(
      entry.entry,
      completedGameweeks,
      liveDataMap,
      allFplPlayers,
      entry.total
    );

    const mappedTeam: Team = {
      rank: entry.rank,
      managerName: entry.player_name,
      teamName: entry.entry_name,
      totalPoints: entry.total,
      eventTotal: entry.event_total,
      teamId: entry.entry,
      ...managerData,
    };

    return mappedTeam;
  });

  return Promise.all(managerDataPromises);
}
