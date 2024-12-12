// src/types/fpl/FplLeagueStandings.ts
// https://fantasy.premierleague.com/api/leagues-classic/{league-ID}/standings/

export interface FplLeagueNewEntries {
    has_next: boolean;
    page: number;
    results: any[];
  }
  
  export interface FplLeagueInfo {
    id: number;
    name: string;
    created: string;
    closed: boolean;
    max_entries: number | null;
    league_type: string;
    scoring: string;
    admin_entry: number;
    start_event: number;
    code_privacy: string;
    has_cup: boolean;
    cup_league: null | number;
    rank: number | null;
  }
  
  export interface FplLeagueStandingResult {
    id: number;
    event_total: number;
    player_name: string;
    rank: number;
    last_rank: number;
    rank_sort: number;
    total: number;
    entry: number;
    entry_name: string;
  }
  
  export interface FplLeagueStandingsData {
    has_next: boolean;
    page: number;
    results: FplLeagueStandingResult[];
  }
  
  export interface FplLeagueStandings {
    new_entries: FplLeagueNewEntries;
    last_updated_data: string;
    league: FplLeagueInfo;
    standings: FplLeagueStandingsData;
  }
  