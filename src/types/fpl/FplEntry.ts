// src/types/fpl/FplEntry.ts
// https://fantasy.premierleague.com/api/entry/{teamId}/
// Only the fields the app reads are listed.

export interface FplEntryClassicLeague {
  id: number;
  name: string;
  /** "x" private, "c" public, "s" set up by FPL (overall, country, club). */
  league_type: string;
  entry_rank: number | null;
  /** Number of teams in the league. */
  rank_count?: number | null;
}

export interface FplEntry {
  id: number;
  /** Team name. */
  name: string;
  player_first_name: string;
  player_last_name: string;
  leagues: {
    classic: FplEntryClassicLeague[];
  };
}
