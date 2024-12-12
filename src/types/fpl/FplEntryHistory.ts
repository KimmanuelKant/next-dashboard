export interface FplEntryHistoryCurrent {
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
  
  export interface FplEntryHistoryPast {
    season_name: string;
    total_points: number;
    rank: number;
  }
  
  export interface FplEntryHistoryChip {
    name: string;
    time: string;
    event: number;
  }
  
  export interface FplEntryHistory {
    current: FplEntryHistoryCurrent[];
    past: FplEntryHistoryPast[];
    chips: FplEntryHistoryChip[];
  }
  