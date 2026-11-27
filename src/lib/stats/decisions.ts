// src/lib/stats/decisions.ts
// Stats that judge a manager's choices in one gameweek, rather than report
// what happened: who should have been captain, who was left on the bench.

import { GameweekPoints, ManagerGameweek, ManagerHistory } from "@/lib/fpl/types";

export interface TransferOutcome {
  playerIn: number;
  playerOut: number;
  /** What the player bought scored that gameweek, minus what the player sold scored. */
  gain: number;
}

/**
 * The transfers made for one gameweek, each judged by that gameweek alone.
 * Points count whether or not the player was in the starting eleven, so a
 * transfer is judged on the player, not on the manager's team selection.
 * `score` gives a player's points that gameweek (with the provisional bonus
 * while it is played). The Gameweek tab shows these for one gameweek, and
 * the Season tab adds them up and sets each week's against its hit.
 *
 * FPL lists every transfer made before the deadline, so on a wildcard a
 * player can be bought and sold again before the gameweek starts. Such
 * chains are joined (A for X, then B for A, is B for X), and a player sold
 * and bought back is no transfer at all. The total gain is the same either
 * way; the joined list says what the squad actually changed.
 */
export function transferOutcomes(
  transfers: ManagerHistory["transfers"],
  gw: number,
  score: (playerId: number) => number
): TransferOutcome[] {
  const joined: { playerIn: number; playerOut: number }[] = [];
  for (const { gw: week, playerIn, playerOut } of transfers) {
    if (week !== gw) continue;
    const earlier = joined.find((transfer) => transfer.playerIn === playerOut);
    if (earlier) earlier.playerIn = playerIn;
    else joined.push({ playerIn, playerOut });
  }
  return joined
    .filter(({ playerIn, playerOut }) => playerIn !== playerOut)
    .map(({ playerIn, playerOut }) => ({
      playerIn,
      playerOut,
      gain: score(playerIn) - score(playerOut),
    }));
}

export interface SquadMove {
  /** The gameweek the move took effect. */
  gw: number;
  playerIn: number;
  playerOut: number;
}

/**
 * Every lasting change to the squad over the season, oldest first: the
 * transfers as `transferOutcomes()` joins them, without the Free Hit weeks,
 * whose transfers are undone a week later.
 */
export function squadMoves(
  transfers: ManagerHistory["transfers"],
  gameweekIds: number[],
  freeHitWeeks: Set<number>
): SquadMove[] {
  return gameweekIds
    .filter((gw) => !freeHitWeeks.has(gw))
    .flatMap((gw) =>
      transferOutcomes(transfers, gw, () => 0).map(({ playerIn, playerOut }) => ({
        gw,
        playerIn,
        playerOut,
      }))
    );
}

export interface SaleAftermath {
  playerId: number;
  /** The gameweek the sale took effect. */
  gw: number;
  /** What the player scored while out of the squad, from that gameweek on. */
  points: number;
}

/**
 * What every player sold went on to score while he was out of the squad:
 * seller's remorse. Counting runs from the gameweek of the sale until the
 * gameweek he was bought back, or to the latest gameweek; a player sold
 * again later starts a new count, so no week is counted twice.
 *
 * Sales are read as `transferOutcomes()` joins them, so a player bought and
 * sold again before one deadline was never in the squad and is no sale.
 * Free Hit transfers are undone a week later and are left out; a sold
 * player picked again for a Free Hit week scored for the team that week, so
 * that week is left out of his count (`inSquad`). Points count whether or
 * not he would have started, as in `transferOutcomes()`.
 */
export function pointsAfterSale(
  transfers: ManagerHistory["transfers"],
  gameweekIds: number[],
  freeHitWeeks: Set<number>,
  score: (gw: number, playerId: number) => number,
  inSquad: (gw: number, playerId: number) => boolean
): SaleAftermath[] {
  const moves = squadMoves(transfers, gameweekIds, freeHitWeeks);
  return moves.map(({ gw, playerOut }) => {
    const boughtBack =
      moves.find((move) => move.gw > gw && move.playerIn === playerOut)?.gw ?? Infinity;
    let points = 0;
    for (const week of gameweekIds) {
      if (week >= gw && week < boughtBack && !inSquad(week, playerOut)) {
        points += score(week, playerOut);
      }
    }
    return { playerId: playerOut, gw, points };
  });
}

export interface PurchaseLead {
  playerId: number;
  /** The gameweek the purchase took effect. */
  gw: number;
  /** What the player had scored while out of the squad before he was bought. */
  points: number;
}

/**
 * What every player bought had already scored while the team did not have
 * him: the mirror of `pointsAfterSale()`, for "bought too late". Counting
 * runs from the team's first gameweek, or from the gameweek he was last
 * sold, to the gameweek before he was bought; weeks he was in the squad
 * anyway (a Free Hit) are left out. Moves are read as `squadMoves()` gives
 * them, so Free Hit transfers are no purchase.
 */
export function pointsBeforePurchase(
  moves: SquadMove[],
  gameweekIds: number[],
  firstGw: number,
  score: (gw: number, playerId: number) => number,
  inSquad: (gw: number, playerId: number) => boolean
): PurchaseLead[] {
  return moves.map(({ gw, playerIn }) => {
    const lastSold =
      moves.findLast((move) => move.gw < gw && move.playerOut === playerIn)?.gw ?? firstGw;
    let points = 0;
    for (const week of gameweekIds) {
      if (week >= lastSold && week < gw && !inSquad(week, playerIn)) {
        points += score(week, playerIn);
      }
    }
    return { playerId: playerIn, gw, points };
  });
}

/** A sale this many gameweeks or fewer after the purchase is a knee-jerk one. */
export const KNEE_JERK_WEEKS = 2;

/**
 * The moves that sold a player within `KNEE_JERK_WEEKS` gameweeks of
 * buying him: bought for GW5 and sold for GW7 or sooner. A player in the
 * squad from the start was never bought, so his sale is never one.
 */
export function kneeJerkSales(moves: SquadMove[]): SquadMove[] {
  return moves.filter(({ gw, playerOut }) => {
    const bought = moves.findLast((move) => move.gw < gw && move.playerIn === playerOut);
    return bought !== undefined && gw - bought.gw <= KNEE_JERK_WEEKS;
  });
}

export interface CaptaincyReview {
  /** Player whose points were multiplied (vice captain if the captain did not play); null if neither played. */
  armbandId: number | null;
  /** That player's points before the multiplier. */
  armbandPoints: number;
  /** Highest-scoring player in the starting eleven. */
  bestId: number | null;
  bestPoints: number;
  /**
   * Points lost by not giving the armband to the best starter. Accounts for
   * Triple Captain, where the armband is worth two extra multiples.
   */
  pointsLost: number;
}

export function reviewCaptaincy(
  team: ManagerGameweek,
  points: GameweekPoints
): CaptaincyReview {
  let armbandId: number | null = null;
  let multiplier = team.chip === "3xc" ? 3 : 2;
  let bestId: number | null = null;
  let bestPoints = -Infinity;

  for (const [playerId, pickMultiplier] of team.picks) {
    if (pickMultiplier === 0) continue;
    const scored = points[playerId] ?? 0;
    if (scored > bestPoints) {
      bestPoints = scored;
      bestId = playerId;
    }
    if (pickMultiplier >= 2) {
      armbandId = playerId;
      multiplier = pickMultiplier;
    }
  }

  if (bestId === null) {
    return { armbandId: null, armbandPoints: 0, bestId: null, bestPoints: 0, pointsLost: 0 };
  }
  const armbandPoints = armbandId !== null ? points[armbandId] ?? 0 : 0;
  return {
    armbandId,
    armbandPoints,
    bestId,
    bestPoints,
    pointsLost: Math.max(0, bestPoints - armbandPoints) * (multiplier - 1),
  };
}

/** The highest-scoring player left on the bench: [playerId, points], or null (e.g. Bench Boost). */
export function topBenched(
  team: ManagerGameweek,
  points: GameweekPoints
): [number, number] | null {
  let top: [number, number] | null = null;
  for (const [playerId, multiplier] of team.picks) {
    if (multiplier > 0) continue;
    const scored = points[playerId] ?? 0;
    if (!top || scored > top[1]) top = [playerId, scored];
  }
  return top;
}
