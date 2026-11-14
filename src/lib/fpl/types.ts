// src/lib/fpl/types.ts
// Compact shapes used by the app. Raw FPL responses are trimmed to these
// before caching, so cache entries stay small.

/** 1 = goalkeeper, 2 = defender, 3 = midfielder, 4 = forward */
export type PositionId = 1 | 2 | 3 | 4;

export interface Player {
  id: number;
  name: string;
  position: PositionId;
  clubId: number;
  /** Price in tenths of a million (e.g. 105 = £10.5m). */
  cost: number;
  /** Global ownership, percent. */
  selectedByPercent: number;
  totalPoints: number;
  form: number;
}

export interface Club {
  id: number;
  name: string;
  shortName: string;
}

export interface Gameweek {
  id: number;
  /** All matches played and points confirmed. Data for it never changes again. */
  finished: boolean;
  isCurrent: boolean;
  deadline: string;
}

export interface Bootstrap {
  /** Year the season started, e.g. "2026". League IDs are only unique per season. */
  season: string;
  totalManagers: number;
  players: Player[];
  clubs: Club[];
  gameweeks: Gameweek[];
}

export interface Manager {
  entryId: number;
  managerName: string;
  teamName: string;
  rank: number;
  lastRank: number;
  /** Official league total (transfer hits already deducted). */
  total: number;
  eventTotal: number;
}

export interface League {
  id: number;
  name: string;
  managers: Manager[];
  /** True when the league has more managers than we load. */
  hasMoreManagers: boolean;
}

export const PICK_NONE = 0;
export const PICK_CAPTAIN = 1;
export const PICK_VICE = 2;

/**
 * [playerId, multiplier, role]. Array order is squad position: index 0-10 is
 * the starting eleven, 11-14 the bench. Role is PICK_NONE / PICK_CAPTAIN / PICK_VICE.
 */
export type Pick = [playerId: number, multiplier: number, role: number];

export interface ManagerGameweek {
  chip: string | null;
  picks: Pick[];
}

/** entryId -> that manager's team for one gameweek (null: no team that week). */
export type LeagueGameweekPicks = Record<number, ManagerGameweek | null>;

/** playerId -> points scored in one gameweek. */
export type GameweekPoints = Record<number, number>;

/** [yellow cards, red cards, own goals, penalties missed] in one gameweek. */
export type Incidents = [yellow: number, red: number, ownGoals: number, penaltiesMissed: number];

export interface GameweekData {
  points: GameweekPoints;
  /** playerId -> incidents. Only players with at least one incident are listed. */
  incidents: Record<number, Incidents>;
}

export interface ManagerHistoryGameweek {
  gw: number;
  points: number;
  totalPoints: number;
  rank: number | null;
  overallRank: number | null;
  /** Tenths of a million. */
  bank: number;
  /** Tenths of a million. */
  value: number;
  transfers: number;
  transfersCost: number;
  benchPoints: number;
}

export interface ManagerHistory {
  gameweeks: ManagerHistoryGameweek[];
  chips: { name: string; gw: number }[];
}

export interface LeagueSnapshot {
  league: League;
  bootstrap: Bootstrap;
  /** Gameweek in progress or most recently played; null before the season starts. */
  currentGw: number | null;
  /** Every gameweek whose deadline has passed, ascending. */
  gameweekIds: number[];
  points: Record<number, GameweekPoints>;
  incidents: Record<number, Record<number, Incidents>>;
  picks: Record<number, LeagueGameweekPicks>;
  histories: Record<number, ManagerHistory>;
}
