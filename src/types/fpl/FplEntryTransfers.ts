// src/types/fpl/FplEntryTransfers.ts
// https://fantasy.premierleague.com//api/entry/{teamId}/transfers

export interface FplEntryTransfer {
    element_in: number;
    element_in_cost: number;
    element_out: number;
    element_out_cost: number;
    entry: number;
    event: number;
    time: string; // likely a timestamp string
  }
  
  // The endpoint returns an array of these objects
  export type FplEntryTransfers = FplEntryTransfer[];
  