// src/types.ts

// Define the types based on the structure of the FPL API response for league standings
export interface Team {
    entry: number;
    player_name: string;
    entry_name: string;
    total: number;
    event_total: number;
    rank: number;
  }
  
  export interface LeagueStandings {
    standings: {
      results: Team[];
    };
  }
  