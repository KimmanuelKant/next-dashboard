// src/lib/stats/decisions.ts
// Stats that judge a manager's choices in one gameweek, rather than report
// what happened: who should have been captain, who was left on the bench.

import { GameweekPoints, ManagerGameweek } from "@/lib/fpl/types";

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
