// src/types/fpl/FplEntryEventPicks.ts
// https://fantasy.premierleague.com/api/entry/{teamId}/event/{gw}/picks/

export interface FplEntryEventHistory {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    overall_rank: number;
    percentile_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  }
  
  export interface FplPick {
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
    element_type: number;
  }
  
  export interface FplEntryEventPicks {
    active_chip: null;        // always null based on the schema
    automatic_subs: unknown[]; // no structure given, so unknown[]
    entry_history: FplEntryEventHistory;
    picks: FplPick[];
  }
  

  // https://fantasy.premierleague.com//api/entry/{teamId}/transfers