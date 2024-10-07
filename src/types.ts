// src/types.ts

export interface ApiTeam {
  rank: number;
  player_name: string;
  entry_name: string;
  total: number;
  event_total: number;
  entry: number; // Team ID
}

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

export interface ManagerPicks {
  picks: Array<{
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
}

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
}

export interface Player {
  id: number;
  web_name: string;
}

export interface GameEvent {
  id: number;
  name: string;
  is_current: boolean;
}
