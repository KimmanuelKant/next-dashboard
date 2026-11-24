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
  /** Price at the start of the season, in tenths of a million. */
  startCost: number;
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
  /**
   * The average score of every FPL team this gameweek; null before it
   * starts. FPL updates it while the gameweek is played.
   */
  averageScore: number | null;
  /** The highest score of any FPL team this gameweek; null before it starts. */
  highestScore: number | null;
  /** The player captained by the most FPL teams; null before the deadline. */
  mostCaptained: number | null;
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

/** One classic league a team belongs to. */
export interface TeamLeague {
  id: number;
  name: string;
  /** True for the leagues FPL sets up itself (overall, country, club). */
  general: boolean;
  /** The team's rank in the league; null before the league has started. */
  rank: number | null;
  /** Number of teams in the league, when FPL reports it. */
  size: number | null;
}

/** A team and the classic leagues it plays in. */
export interface TeamLeagues {
  teamName: string;
  managerName: string;
  leagues: TeamLeague[];
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
  /**
   * The automatic substitutions FPL made after the gameweek, [playerIn,
   * playerOut]: the picks already show each substitute in the starter's
   * place. Empty while the gameweek is played (FPL makes them at the end).
   * Missing from picks cached before it was kept: unknown, not none (see
   * getLeaguePicks).
   */
  autoSubs?: [playerIn: number, playerOut: number][];
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
  /** playerId -> minutes played. Only players who played are listed. */
  minutes: Record<number, number>;
  /** When the data was fetched from FPL (ISO time): how fresh live points are. */
  fetchedAt: string;
}

/** The matches of the gameweek in progress, and when they were fetched (ISO time). */
export interface LiveFixtures {
  fixtures: LiveFixture[];
  fetchedAt: string;
}

/** A match of the gameweek in progress, as far as the live projection needs it. */
export interface LiveFixture {
  id: number;
  homeClubId: number;
  awayClubId: number;
  kickoff: string | null;
  started: boolean;
  /** The final whistle has gone: no player's minutes in it will change. */
  done: boolean;
  /** Goals; null before kick-off. */
  homeScore: number | null;
  awayScore: number | null;
  /** Minutes played in the match, as FPL counts them. */
  minutes: number;
  /** FPL has added the match's bonus points to its players' points. */
  bonusAdded: boolean;
  /**
   * [playerId, bonus points system score] for every player in the match.
   * Kept only while the bonus has not been added, since it is only needed
   * to work out the bonus as it stands.
   */
  bps: [playerId: number, bps: number][];
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
  /**
   * Every transfer made, oldest first: the gameweek it took effect, the player
   * bought and sold, and what was paid and received (tenths of a million).
   */
  transfers: {
    gw: number;
    playerIn: number;
    playerOut: number;
    inCost: number;
    outCost: number;
  }[];
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
  /** gw -> playerId -> minutes played; players who did not play are left out. */
  minutes: Record<number, Record<number, number>>;
  /**
   * The matches of the current gameweek while it is in progress; null once
   * FPL has marked it finished (or before the season), when no projection
   * is needed.
   */
  liveFixtures: LiveFixture[] | null;
  /**
   * When the older of the live points and the matches was fetched from FPL
   * (ISO time): what the live view is up to date with. Null when not live.
   */
  liveUpdatedAt: string | null;
  picks: Record<number, LeagueGameweekPicks>;
  histories: Record<number, ManagerHistory>;
}
