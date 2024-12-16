// src/types/fpl/FplFixtures.ts
// https://fantasy.premierleague.com/api/fixtures/

export interface FplFixtureStatValue {
    value: number;
    element: number;
  }
  
  export interface FplFixtureStat {
    identifier: string;
    a: FplFixtureStatValue[];
    h: FplFixtureStatValue[];
  }
  
  export interface FplFixture {
    code: number;
    event?: number;
    finished: boolean;
    finished_provisional: boolean;
    id: number;
    kickoff_time?: string;
    minutes: number;
    provisional_start_time: boolean;
    started?: boolean;
    team_a: number;
    team_a_score?: number;
    team_h: number;
    team_h_score?: number;
    stats: FplFixtureStat[];
    team_h_difficulty: number;
    team_a_difficulty: number;
    pulse_id: number;
  }
  
  // The endpoint returns an array of fixtures
  export type FplFixtures = FplFixture[];
  