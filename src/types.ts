// src/types.ts

export interface ApiTeam {
  rank: number;
  player_name: string;
  entry_name: string;
  total: number;
  event_total: number;
  // Include any other properties from the API response that you need
}

export interface Team {
  rank: number;
  managerName: string;
  teamName: string;
  totalPoints: number;
  eventTotal: number;
}
  
  export interface Manager {
    player_name: string;
    entry_name: string;
    total: number;
  }
  
  export interface Player {
    web_name: string;
    total_points: number;
  }
  