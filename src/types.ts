// src/types.ts


// Interface for the team data from the league standings API
export interface ApiTeam {
  rank: number;
  player_name: string;
  entry_name: string;
  total: number;
  event_total: number;
  entry: number; // Team ID
}

// Interface for the manager's season history
export interface ManagerHistory {
  current: Array<{
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  }>;
  chips: Array<{
    name: string;
    time: string;
    event: number;
  }>;
}

// Interface for a single player pick
export interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}


// Interface for the manager's picks in a gameweek
export interface PicksData {
  gw: number;
  picks: Pick[];
}



// Interface for the processed team data used in the application
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
  tripleCaptainPoints: number | string;
  benchBoostPoints: number | string;
}

// Interface for player information
export interface Player {
  id: number;
  web_name: string;
}

// Interface for game event (gameweek) information
export interface GameEvent {
  id: number;
  name: string;
  is_current: boolean;
  finished: boolean;
}

// Interface for live data of a player in a gameweek
export interface LiveElement {
  id: number;
  stats: {
    total_points: number;
  };
}

// Interface for live data of all players in a gameweek
export interface LiveData {
  elements: LiveElement[];
}