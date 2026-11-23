// src/lib/stats/live.ts
// Projected scores for the gameweek in progress. FPL's live score counts only
// what is settled: bonus points come after each match, and automatic
// substitutions (and the armband passing to the vice captain) only after the
// gameweek's last match. The projection adds both as they stand now, so the
// league table shows where the gameweek is heading, not only where it is.

import {
  GameweekPoints,
  LiveFixture,
  ManagerGameweek,
  Player,
  PICK_CAPTAIN,
  PICK_VICE,
  PositionId,
} from "@/lib/fpl/types";

/**
 * Where a player stands this gameweek: has played, may still play (a match
 * of his club has not finished), or will not play (every match of his club
 * is over, or his club has none this gameweek).
 */
export type PlayerState = "played" | "pending" | "out";

export interface LiveGameweek {
  /** Points FPL has counted so far. */
  points: GameweekPoints;
  /** Bonus each player would get if his match ended now, where FPL has not added it yet. */
  bonus: Map<number, number>;
  state: (playerId: number) => PlayerState;
  /** A match of the player's club has not finished: not started, or being played. */
  stillToPlay: (playerId: number) => boolean;
  position: (playerId: number) => PositionId | undefined;
}

/**
 * The bonus points of each match whose bonus FPL has not added yet, from
 * the bonus points system as it stands: 3, 2 and 1 for the three best
 * scores. Players level share a place, and the place after them is skipped
 * (two level first get 3 each, the next gets 1), as FPL does.
 */
export function provisionalBonus(fixtures: LiveFixture[]): Map<number, number> {
  const bonus = new Map<number, number>();
  for (const fixture of fixtures) {
    if (!fixture.started || fixture.bonusAdded) continue;
    const awards: [number, number][] = [];
    for (const [playerId, bps] of fixture.bps) {
      const place = 1 + fixture.bps.filter(([, other]) => other > bps).length;
      if (place <= 3) awards.push([playerId, 4 - place]);
    }
    // In a match's first minutes most players share the same score, for
    // simply being on the pitch. A ranking that hands bonus to more than
    // four players says nothing yet.
    if (awards.length > 4) continue;
    for (const [playerId, points] of awards) {
      bonus.set(playerId, (bonus.get(playerId) ?? 0) + points);
    }
  }
  return bonus;
}

export function liveGameweek(
  fixtures: LiveFixture[],
  points: GameweekPoints,
  minutes: Record<number, number>,
  players: Player[]
): LiveGameweek {
  const byId = new Map(players.map((p) => [p.id, p]));
  const clubFixtures = (playerId: number) => {
    const club = byId.get(playerId)?.clubId;
    return fixtures.filter((f) => f.homeClubId === club || f.awayClubId === club);
  };
  const stillToPlay = (playerId: number) => clubFixtures(playerId).some((f) => !f.done);
  return {
    points,
    bonus: provisionalBonus(fixtures),
    state: (playerId) =>
      (minutes[playerId] ?? 0) > 0 ? "played" : stillToPlay(playerId) ? "pending" : "out",
    stillToPlay,
    position: (playerId) => byId.get(playerId)?.position,
  };
}

export interface TeamProjection {
  /** FPL's live score: points counted so far, before hits. */
  livePoints: number;
  /** Projected score before hits: live points, provisional bonus and substitutions. */
  points: number;
  /** Provisional bonus of the players who count, with their multipliers. */
  bonus: number;
  /** Automatic substitutions as FPL would make them now: [player in, player out]. */
  subs: [number, number][];
  /** The vice captain who takes the armband from a captain who did not play. */
  armbandTo: number | null;
  /** Players who count and whose club still has a match to finish. */
  playersLeft: number;
  /** Those players, in pitch order. */
  left: number[];
  /** The players who do not count after the substitutions, in bench order. */
  bench: number[];
  /** The player whose points are multiplied after the substitutions; null if none. */
  armband: number | null;
}

/** True when the eleven is a formation FPL allows: at least three defenders and a forward. */
function validFormation(eleven: number[], live: LiveGameweek): boolean {
  const count = (position: PositionId) =>
    eleven.filter((id) => live.position(id) === position).length;
  return count(2) >= 3 && count(4) >= 1;
}

/**
 * One team's projected score. The substitutions follow FPL's rules: each
 * starter who will not play, in pitch order, is replaced by the first
 * substitute on the bench who has played and keeps the formation valid; a
 * goalkeeper only by the substitute goalkeeper. A substitute who may still
 * play holds his place in the queue, so no substitution is made past him
 * until he has.
 *
 * Once FPL has made the substitutions itself, the picks already show them
 * (and the armband moved), so running this again changes nothing.
 */
export function projectTeam(team: ManagerGameweek, live: LiveGameweek): TeamProjection {
  const multiplier = new Map<number, number>();
  for (const [playerId, pickMultiplier] of team.picks) {
    multiplier.set(playerId, pickMultiplier);
  }
  const counted = (playerId: number) => (multiplier.get(playerId) ?? 0) > 0;
  const sum = (score: (playerId: number) => number) =>
    team.picks.reduce(
      (total, [playerId]) => total + (multiplier.get(playerId) ?? 0) * score(playerId),
      0
    );
  const livePoints = sum((id) => live.points[id] ?? 0);

  const subs: [number, number][] = [];
  if (team.chip !== "bboost") {
    const eleven = team.picks.slice(0, 11).map(([id]) => id);
    const bench = team.picks.slice(11).map(([id]) => id);
    const used = new Set<number>();
    let outfieldWaiting = false;
    for (let i = 0; i < eleven.length; i++) {
      const starter = eleven[i];
      if (live.state(starter) !== "out") continue;
      const goalkeeper = live.position(starter) === 1;
      if (!goalkeeper && outfieldWaiting) continue;
      for (const sub of bench) {
        if (used.has(sub) || (live.position(sub) === 1) !== goalkeeper) continue;
        const state = live.state(sub);
        if (state === "out") continue;
        const after = eleven.map((id, j) => (j === i ? sub : id));
        if (!goalkeeper && !validFormation(after, live)) continue;
        if (state === "pending") {
          if (!goalkeeper) outfieldWaiting = true;
          break;
        }
        used.add(sub);
        eleven[i] = sub;
        multiplier.set(sub, 1);
        multiplier.set(starter, 0);
        subs.push([sub, starter]);
        break;
      }
    }
  }

  // The armband passes to the vice captain if the captain will not play and
  // the vice captain has played in the team. While the captain still
  // carries a multiplier of 2 or more, FPL has not moved it yet.
  let armbandTo: number | null = null;
  const captain = team.picks.find((p) => p[2] === PICK_CAPTAIN);
  const vice = team.picks.find((p) => p[2] === PICK_VICE);
  if (captain && vice && captain[1] >= 2 && live.state(captain[0]) === "out") {
    if (counted(vice[0]) && live.state(vice[0]) === "played") {
      multiplier.set(vice[0], captain[1]);
      multiplier.set(captain[0], counted(captain[0]) ? 1 : 0);
      armbandTo = vice[0];
    }
  }

  const bonus = sum((id) => live.bonus.get(id) ?? 0);
  // The squad after the substitutions: each substitute swaps places with the
  // starter he replaces, as FPL shows it.
  const order = team.picks.map(
    ([id]) =>
      subs.find(([, out]) => out === id)?.[0] ?? subs.find(([sub]) => sub === id)?.[1] ?? id
  );
  const left = order.filter((id) => counted(id) && live.stillToPlay(id));
  return {
    livePoints,
    points: sum((id) => (live.points[id] ?? 0) + (live.bonus.get(id) ?? 0)),
    bonus,
    subs,
    armbandTo,
    playersLeft: left.length,
    left,
    bench: order.filter((id) => !counted(id)),
    armband: order.find((id) => (multiplier.get(id) ?? 0) >= 2) ?? null,
  };
}
