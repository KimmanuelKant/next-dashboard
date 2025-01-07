// src/types/derived/LeagueDerivedTypes.ts

import { FplPick } from '@/types/fpl/FplEntryEventPicks'; // Use the raw pick type as a building block

/**
 * Represents chip usage data derived from league/team performance.
 * Not a direct API type, but computed/aggregated information.
 */
export interface ChipData {
  points: number;
  gw: number;
}

/**
 * Represents a team's aggregated statistics.
 * This includes data pulled from multiple endpoints and processed into a single coherent structure.
 */
export interface Team {
  rank: number;
  managerName: string;
  teamName: string;
  totalPoints: number;
  eventTotal: number;
  totalTransfers: number;
  transfersThisWeek: number;
  teamValue: number;
  bank: number;
  overallRank: number;
  chipsUsed: string[];
  pointsOnBench: number;
  captain: string;
  viceCaptain: string;
  totalTransferPointsDeducted: number;
  teamId: number;
  highestGameweekScore: number;
  totalCaptainPoints: number;
  captainPointsPercentage: number;
  wildcardsUsed: number;
  tripleCaptainData: ChipData | null;
  benchBoostData: ChipData | null;
  freeHitData: ChipData | null;
  totalChipPoints: number;
  bestOverallRank: number;
  worstOverallRank: number;
  highestGameweekRank: number;
  lowestGameweekRank: number;
  totalGKPoints: number;
  totalDEFPoints: number;
  totalMIDPoints: number;
  totalFWDPoints: number;
  mostCaptainedPlayer: string;  // Format: "Player Name (12)"
  captainDiversity: number;     // Number of unique captains
}

/**
 * Represents a player's statistics in the context of a particular league.
 * This type is derived from raw player data and league ownership information combined.
 */
export interface LeaguePlayer {
  id: number;
  name: string;
  position: string;
  team: string;
  value: number;
  globalOwnershipCount: number;
  globalOwnershipPercentage: number;
  leagueOwnershipCount: number;
  leagueOwnershipPercentage: number;
  leagueCaptainCount: number;
  leagueViceCaptainCount: number;
}

/**
 * Represents a derived structure that groups picks by gameweek,
 * aggregating FplPick data into a format convenient for the application's logic.
 */
export interface PicksData {
  gw: number;
  picks: FplPick[];
}
