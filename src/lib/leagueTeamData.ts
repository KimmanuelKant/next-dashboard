// src/lib/leagueTeamData.ts

import { FplLeagueStandings } from "@/types/fpl/FplLeagueStandings";
import { FplElement, FplEvent } from "@/types/fpl/FplBootstrapStatic";
import { FplEntryHistory } from "@/types/fpl/FplEntryHistory";
import { FplEventLiveElement } from "@/types/fpl/FplEventLive";
import { FplPick } from "@/types/fpl/FplEntryEventPicks";
import { Team, ChipData } from "@/types/derived/LeagueDerivedTypes";
import {
  getLeagueStandings,
  getBootstrapData,
  getLiveDataForGameweek,
  getEntryHistory,
  getEntryEventPicks,
} from "@/lib/fplApi";

const debugManagerId = 295349;

/**
 * Define a type for picks with gw and picks
 */
interface PicksData {
  gw: number;
  picks: FplPick[];
}

/**
 * Fetches picks for all completed gameweeks.
 */
async function fetchPicksForAllGWs(
  teamId: number,
  completedGameweeks: number[]
): Promise<PicksData[]> {
  const picksPromises = completedGameweeks.map(async (gw) => {
    try {
      const picksData = await getEntryEventPicks(teamId, gw);
      return { gw, picks: picksData.picks };
    } catch (error) {
      return { gw, picks: [] };
    }
  });
  return Promise.all(picksPromises);
}

/**
 * Gathers partial stats for a manager.
 */
async function fetchManagerPartialStats(
  teamId: number,
  completedGameweeks: number[],
  liveDataMap: Map<number, FplEventLiveElement[]>,
  players: FplElement[],
  officialTotalPoints: number
) {
  const isDebug = teamId === debugManagerId;

  // Fetch manager's history
  const managerHistory = await getEntryHistory(teamId);
  const currentSeason = managerHistory.current;
  const latestGW = currentSeason[currentSeason.length - 1];

  // Basic season-wide aggregates
  const totalTransfers = currentSeason.reduce(
    (sum, gw) => sum + gw.event_transfers,
    0
  );
  const totalTransferPointsDeducted = currentSeason.reduce(
    (sum, gw) => sum + gw.event_transfers_cost,
    0
  );
  const chipsUsed = managerHistory.chips.map((chip) => chip.name);
  const pointsOnBench = currentSeason.reduce(
    (sum, gw) => sum + gw.points_on_bench,
    0
  );
  const highestGameweekScore = currentSeason.reduce(
    (max, gw) => (gw.points > max ? gw.points : max),
    0
  );
  const wildcardsUsed = managerHistory.chips.filter(
    (chip) => chip.name === "wildcard"
  ).length;

  let tripleCaptainData: ChipData | null = null;
  let benchBoostData: ChipData | null = null;
  let freeHitData: ChipData | null = null;

  // Fetch picks for all completed GWs
  const picksArray = await fetchPicksForAllGWs(teamId, completedGameweeks);

  // Triple Captain
  const tripleCaptainChip = managerHistory.chips.find(
    (chip) => chip.name === "3xc"
  );
  if (tripleCaptainChip) {
    const gw = tripleCaptainChip.event;
    const picksData = picksArray.find((p) => p.gw === gw);
    if (picksData && picksData.picks.length > 0) {
      const captainPick = picksData.picks.find((p) => p.is_captain);
      if (captainPick) {
        const liveElements = liveDataMap.get(gw);
        if (liveElements) {
          const playerData = liveElements.find(
            (e) => e.id === captainPick.element
          );
          if (playerData) {
            tripleCaptainData = { points: playerData.stats.total_points, gw };
          }
        }
      }
    }
  }

  // Bench Boost
  const benchBoostChip = managerHistory.chips.find(
    (chip) => chip.name === "bboost"
  );
  if (benchBoostChip) {
    const gw = benchBoostChip.event;
    const picksData = picksArray.find((p) => p.gw === gw);
    if (picksData && picksData.picks.length > 0) {
      const benchPicks = picksData.picks.filter(
        (pick) => pick.position >= 12 && pick.position <= 15
      );
      const liveElements = liveDataMap.get(gw);
      if (liveElements) {
        let benchPoints = 0;
        benchPicks.forEach((pick) => {
          const playerData = liveElements.find((e) => e.id === pick.element);
          if (playerData) {
            benchPoints += playerData.stats.total_points;
          }
        });
        benchBoostData = { points: benchPoints, gw };
      }
    }
  }

  // Free Hit
  const freeHitChip = managerHistory.chips.find(
    (chip) => chip.name === "freehit"
  );
  if (freeHitChip) {
    const gw = freeHitChip.event;
    const gwData = currentSeason.find((g) => g.event === gw);
    if (gwData) {
      freeHitData = { points: gwData.points, gw };
    }
  }

  // Summations for GK, DEF, MID, FWD
  let totalGKPoints = 0;
  let totalDEFPoints = 0;
  let totalMIDPoints = 0;
  let totalFWDPoints = 0;

  for (const { gw, picks } of picksArray) {
    if (picks.length === 0) continue;
    const liveElements = liveDataMap.get(gw);
    if (!liveElements) continue;

    for (const pick of picks) {
      const foundPlayer = players.find((el) => el.id === pick.element);
      if (!foundPlayer) continue;
      const playerData = liveElements.find((e) => e.id === pick.element);
      if (!playerData) continue;

      const points = playerData.stats.total_points * pick.multiplier;
      switch (foundPlayer.element_type) {
        case 1:
          totalGKPoints += points;
          break;
        case 2:
          totalDEFPoints += points;
          break;
        case 3:
          totalMIDPoints += points;
          break;
        case 4:
          totalFWDPoints += points;
          break;
      }
    }
  }

  // Captain Points
  let totalCaptainPoints = 0;
  for (const { gw, picks } of picksArray) {
    if (picks.length === 0) continue;
    const captainPick = picks.find((p) => p.is_captain);
    if (captainPick) {
      const liveElements = liveDataMap.get(gw);
      if (liveElements) {
        const playerData = liveElements.find(
          (e) => e.id === captainPick.element
        );
        if (playerData) {
          totalCaptainPoints +=
            playerData.stats.total_points * captainPick.multiplier;
        }
      }
    }
  }

  // Calculate captainPointsPercentage using officialTotalPoints
  const captainPointsPercentage =
    officialTotalPoints > 0
      ? (totalCaptainPoints / officialTotalPoints) * 100
      : 0;

  // Fetch latest picks to get current captain and vice-captain
  const latestPicksRes = await getEntryEventPicks(teamId, latestGW.event);
  const latestPicks = latestPicksRes.picks || [];
  const latestCaptainPick = latestPicks.find((p) => p.is_captain);
  const latestViceCaptainPick = latestPicks.find((p) => p.is_vice_captain);

  const captain =
    players.find((p) => p.id === latestCaptainPick?.element)?.web_name || "";
  const viceCaptain =
    players.find((p) => p.id === latestViceCaptainPick?.element)?.web_name ||
    "";

  // Additional stats
  const bestOverallRank = currentSeason.reduce(
    (min, gw) => (gw.overall_rank < min ? gw.overall_rank : min),
    currentSeason[0].overall_rank
  );
  const worstOverallRank = currentSeason.reduce(
    (max, gw) => (gw.overall_rank > max ? gw.overall_rank : max),
    currentSeason[0].overall_rank
  );
  const highestGameweekRank = currentSeason.reduce(
    (min, gw) => (gw.rank < min ? gw.rank : min),
    currentSeason[0].rank
  );
  const lowestGameweekRank = currentSeason.reduce(
    (max, gw) => (gw.rank > max ? gw.rank : max),
    currentSeason[0].rank
  );

  // Calculate total chip points
  const totalChipPoints =
    (tripleCaptainData?.points ?? 0) +
    (benchBoostData?.points ?? 0) +
    (freeHitData?.points ?? 0);

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

/**
 * Computes league team stats by merging official standings with partial stats.
 */
export async function computeLeagueTeamStats(
  leagueStandings: FplLeagueStandings,
  allFplPlayers: FplElement[],
  fplEvents: FplEvent[]
): Promise<Team[]> {
  const leagueEntries = leagueStandings.standings.results;
  const completedGameweeks = fplEvents
    .filter((e) => e.finished)
    .map((e) => e.id);

  // Fetch live data for all completed gameweeks
  const liveDataMap = new Map<number, FplEventLiveElement[]>();
  const liveDataPromises = completedGameweeks.map(async (gw) => {
    const liveData = await getLiveDataForGameweek(gw);
    return { gw, elements: liveData.elements };
  });

  const liveDataArray = await Promise.all(liveDataPromises);
  liveDataArray.forEach(({ gw, elements }) => {
    liveDataMap.set(gw, elements);
  });

  // Process each manager
  const managerDataPromises = leagueEntries.map(async (entry) => {
    const officialTotalPoints = entry.total;

    // Fetch partial stats
    const partialStats = await fetchManagerPartialStats(
      entry.entry,
      completedGameweeks,
      liveDataMap,
      allFplPlayers,
      officialTotalPoints
    );

    // Merge official data with partial stats
    const mappedTeam: Team = {
      rank: entry.rank,
      managerName: entry.player_name,
      teamName: entry.entry_name,
      teamId: entry.entry,
      totalPoints: entry.total, // Official mini-league total
      eventTotal: entry.event_total,
      transfersThisWeek: partialStats.transfersThisWeek,
      teamValue: partialStats.teamValue,
      bank: partialStats.bank,
      overallRank: partialStats.overallRank,
      totalTransfers: partialStats.totalTransfers,
      totalTransferPointsDeducted: partialStats.totalTransferPointsDeducted,
      chipsUsed: partialStats.chipsUsed,
      pointsOnBench: partialStats.pointsOnBench,
      highestGameweekScore: partialStats.highestGameweekScore,
      wildcardsUsed: partialStats.wildcardsUsed,
      tripleCaptainData: partialStats.tripleCaptainData,
      benchBoostData: partialStats.benchBoostData,
      freeHitData: partialStats.freeHitData,
      totalChipPoints: partialStats.totalChipPoints,
      totalGKPoints: partialStats.totalGKPoints,
      totalDEFPoints: partialStats.totalDEFPoints,
      totalMIDPoints: partialStats.totalMIDPoints,
      totalFWDPoints: partialStats.totalFWDPoints,
      totalCaptainPoints: partialStats.totalCaptainPoints,
      captainPointsPercentage: partialStats.captainPointsPercentage,
      captain: partialStats.captain,
      viceCaptain: partialStats.viceCaptain,
      bestOverallRank: partialStats.bestOverallRank,
      worstOverallRank: partialStats.worstOverallRank,
      highestGameweekRank: partialStats.highestGameweekRank,
      lowestGameweekRank: partialStats.lowestGameweekRank,
    };

    return mappedTeam;
  });

  const mappedTeams = await Promise.all(managerDataPromises);
  return mappedTeams;
}
