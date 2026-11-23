// src/lib/stats/gameweekStats.ts
// Per-manager statistics for one gameweek: the current one, or an earlier
// one the visitor has gone back to. Season-long stats live in teamStats.ts.

import { LeagueSnapshot, PICK_CAPTAIN, PICK_VICE, Player } from "@/lib/fpl/types";
import { reviewCaptaincy, topBenched } from "./decisions";
import { computeLeagueHistory } from "./leagueHistory";
import { liveGameweek, projectTeam } from "./live";
import { teamRecord, TeamRecord } from "./records";
import { chipLabel, NamedCount, sharedRanks } from "./teamStats";

export interface GameweekStats {
  teamId: number;
  teamName: string;
  managerName: string;
  /** League position after this gameweek. */
  position: number;
  /** Another team in the league is level on points and has the same position. */
  positionTied: boolean;
  /**
   * Places gained since last gameweek (negative = dropped); null if unknown.
   * The changes in a league need not cancel out: a team that draws level with
   * the one above gains a place, and the team it joins stays where it was.
   */
  positionChange: number | null;
  /** Gameweek points before transfer hits. */
  score: number;
  hit: number;
  /** Gameweek points after transfer hits. */
  netScore: number;
  /**
   * Score after hits against the league's average this gameweek, among the
   * managers who had a team; the projected scores while it is played. Null
   * for a manager without a team.
   */
  vsAverage: number | null;
  /** Rank of the net score within this league this gameweek (1 = best). */
  leagueGameweekRank: number | null;
  /** Rank of the gameweek score among all FPL managers. */
  gameweekRank: number | null;
  overallRank: number | null;
  /** The player chosen as captain. */
  captain: string;
  viceCaptain: string;
  /**
   * The captain did not play and the armband passed to the vice captain;
   * while the gameweek is played, also when it is about to pass.
   */
  viceStepIn: boolean;
  /** Points from the armband, including the multiplier. */
  captainPoints: number;
  /** The starter who would have been the best captain, with their points. */
  bestCaptain: NamedCount | null;
  /** Points lost by not captaining the best starter. */
  captaincyPointsLost: number;
  chip: string | null;
  /** Squad value including the bank, in millions. */
  teamValue: number | null;
  /** Change in squad value since the previous gameweek, in millions. */
  valueChange: number | null;
  transfers: number;
  playersIn: string[];
  playersOut: string[];
  benchPoints: number;
  /** Highest-scoring player left on the bench. */
  topBenched: NamedCount | null;
  /** The player who contributed the most points, including any multiplier. */
  bestPlayer: NamedCount | null;

  // The live projection, for the current gameweek while it is being played.
  // Null (or empty) for a gameweek FPL has finished.
  /** Bonus from matches whose bonus FPL has not added yet, with multipliers. */
  provisionalBonus: number | null;
  /**
   * Automatic substitutions FPL would make now ("Saka for Haaland"), and the
   * armband passing to the vice captain.
   */
  automaticSubs: string[];
  /** Points those substitutions and the armband add. */
  automaticSubPoints: number | null;
  /** Players who count and whose club still has a match to finish. */
  playersLeft: number | null;
  /** Their names, in pitch order; "(C)" marks the one with the armband. */
  stillToPlay: string[];
  /** Gameweek score after hits, with provisional bonus and automatic substitutions. */
  projectedScore: number | null;
  /** Season total with the projected gameweek score. */
  projectedTotal: number | null;
  /** League position by projected total. */
  projectedPosition: number | null;
  projectedPositionTied: boolean;
  /**
   * Places the projected position gains on the position before this
   * gameweek (negative = drops); null if the team had no position before.
   */
  projectedPositionChange: number | null;
}

interface Standing {
  position: number;
  tied: boolean;
  /** Places gained since the gameweek before; null if unknown. */
  change: number | null;
}

/**
 * Each manager's league position after a gameweek, by team ID. For the
 * current gameweek these are FPL's own standings. FPL does not keep the
 * standings of earlier gameweeks, so those are worked out from the managers'
 * running totals, as on the League History tab. A manager who had not joined
 * the game by then has no standing.
 */
function standingsAfter(snapshot: LeagueSnapshot, gw: number): Map<number, Standing> {
  const standings = new Map<number, Standing>();
  if (gw === snapshot.currentGw) {
    const tied = sharedRanks(snapshot.league.managers);
    for (const manager of snapshot.league.managers) {
      standings.set(manager.entryId, {
        position: manager.rank,
        tied: tied.has(manager.rank),
        change: manager.lastRank > 0 ? manager.lastRank - manager.rank : null,
      });
    }
    return standings;
  }

  const history = computeLeagueHistory(snapshot);
  const index = history.gameweeks.indexOf(gw);
  const tied = sharedRanks(
    history.rows.flatMap((row) => {
      const rank = row.positions[index];
      return rank == null ? [] : [{ rank }];
    })
  );
  for (const row of history.rows) {
    const position = row.positions[index];
    if (position == null) continue;
    const before = index > 0 ? row.positions[index - 1] : null;
    standings.set(row.teamId, {
      position,
      tied: tied.has(position),
      change: before == null ? null : before - position,
    });
  }
  return standings;
}

/**
 * One row per manager for a gameweek: the current one unless another is
 * asked for. Empty before the season starts, and for a gameweek that has not
 * been played.
 */
export function computeGameweekStats(
  snapshot: LeagueSnapshot,
  gameweek: number | null = snapshot.currentGw
): GameweekStats[] {
  if (gameweek === null || !snapshot.gameweekIds.includes(gameweek)) {
    return [];
  }
  const gw = gameweek;
  const isCurrent = gw === snapshot.currentGw;
  const standings = standingsAfter(snapshot, gw);
  const players = new Map<number, Player>(
    snapshot.bootstrap.players.map((p) => [p.id, p])
  );
  const name = (id: number | null | undefined) =>
    (id != null && players.get(id)?.name) || "";
  const points = snapshot.points[gw] ?? {};
  const live =
    isCurrent && snapshot.liveFixtures
      ? liveGameweek(
          snapshot.liveFixtures,
          points,
          snapshot.minutes[gw] ?? {},
          snapshot.bootstrap.players
        )
      : null;
  const earlierGws = snapshot.gameweekIds.filter((id) => id < gw).reverse();
  // Each team's total before this gameweek; null if it had none.
  const totalsBefore = new Map<number, number | null>();

  const rows = snapshot.league.managers.flatMap((manager): GameweekStats[] => {
    const standing = standings.get(manager.entryId);
    if (!standing) {
      return [];
    }
    const team = snapshot.picks[gw]?.[manager.entryId] ?? null;
    const weeks = snapshot.histories[manager.entryId]?.gameweeks ?? [];
    const week = weeks.find((w) => w.gw === gw);
    const previousWeek = [...weeks].reverse().find((w) => w.gw < gw);
    const projection = live && team ? projectTeam(team, live) : null;
    // While the gameweek is played, the score is worked out from the picks,
    // as FPL does, so that it is as fresh as the projection beside it. The
    // standings carry the score of the current gameweek only.
    const score =
      projection?.livePoints ?? week?.points ?? (isCurrent ? manager.eventTotal : 0);
    const hit = week?.transfersCost ?? 0;
    const projectedScore = live ? (projection?.points ?? score) - hit : null;
    // The total before this gameweek is settled, so the projected total
    // moves only with the projected score. Without a history, it is the
    // standings' total less this gameweek's points.
    const totalBefore =
      previousWeek?.totalPoints ??
      (weeks.length === 0 ? manager.total - manager.eventTotal + hit : 0);
    // A team that started this gameweek had no position before it. Without
    // a history, the standings say whether it had one.
    const hadPositionBefore =
      previousWeek !== undefined || (weeks.length === 0 && manager.lastRank > 0);
    totalsBefore.set(manager.entryId, hadPositionBefore ? totalBefore : null);

    // Squad changes: compare with the last earlier squad that was not a
    // temporary Free Hit squad.
    let previousSquad: number[] | null = null;
    for (const earlier of earlierGws) {
      const earlierTeam = snapshot.picks[earlier]?.[manager.entryId];
      if (earlierTeam && earlierTeam.chip !== "freehit") {
        previousSquad = earlierTeam.picks.map((p) => p[0]);
        break;
      }
    }
    const squad = team?.picks.map((p) => p[0]) ?? [];
    const playersIn = previousSquad ? squad.filter((id) => !previousSquad!.includes(id)) : [];
    const playersOut = previousSquad && team ? previousSquad.filter((id) => !squad.includes(id)) : [];

    const review = team ? reviewCaptaincy(team, points) : null;
    // While the gameweek is played, the bench is the one after the projected
    // substitutions: a substitute about to come on is not left on it.
    // Otherwise FPL's own bench points.
    const liveScore = (id: number) => (points[id] ?? 0) + (live?.bonus.get(id) ?? 0);
    let benched = team ? topBenched(team, points) : null;
    let benchPoints = week?.benchPoints ?? 0;
    if (projection) {
      benched = null;
      for (const id of projection.bench) {
        if (!benched || liveScore(id) > benched[1]) benched = [id, liveScore(id)];
      }
      benchPoints = projection.bench.reduce((total, id) => total + liveScore(id), 0);
    }

    let bestPlayer: NamedCount | null = null;
    for (const [playerId, multiplier] of team?.picks ?? []) {
      const contributed = (points[playerId] ?? 0) * multiplier;
      if (multiplier > 0 && (!bestPlayer || contributed > bestPlayer.count)) {
        bestPlayer = { name: name(playerId) || "Unknown", count: contributed };
      }
    }

    const armbandMultiplier =
      team?.picks.find((p) => p[0] === review?.armbandId)?.[1] ?? 0;
    // Once FPL has moved the armband, the vice captain carries the
    // multiplier; before that, the projection says whether it will move.
    const vice = team?.picks.find((p) => p[2] === PICK_VICE);
    const viceStepIn =
      vice !== undefined && (vice[1] >= 2 || projection?.armbandTo === vice[0]);

    return [{
      teamId: manager.entryId,
      teamName: manager.teamName,
      managerName: manager.managerName,
      position: standing.position,
      positionTied: standing.tied,
      positionChange: standing.change,
      score,
      hit,
      netScore: score - hit,
      vsAverage: null, // filled in below
      leagueGameweekRank: null, // filled in below
      gameweekRank: week?.rank ?? null,
      overallRank: week?.overallRank ?? null,
      captain: name(team?.picks.find((p) => p[2] === PICK_CAPTAIN)?.[0]),
      viceCaptain: name(vice?.[0]),
      viceStepIn,
      captainPoints: review ? review.armbandPoints * armbandMultiplier : 0,
      bestCaptain:
        review && review.bestId !== null
          ? { name: name(review.bestId) || "Unknown", count: review.bestPoints }
          : null,
      captaincyPointsLost: review?.pointsLost ?? 0,
      chip: team?.chip ? chipLabel(team.chip) : null,
      teamValue: week ? week.value / 10 : null,
      valueChange: week && previousWeek ? (week.value - previousWeek.value) / 10 : null,
      transfers: week?.transfers ?? 0,
      playersIn: playersIn.map((id) => name(id) || "Unknown"),
      playersOut: playersOut.map((id) => name(id) || "Unknown"),
      benchPoints,
      topBenched: benched
        ? { name: name(benched[0]) || "Unknown", count: benched[1] }
        : null,
      bestPlayer,
      provisionalBonus: live ? projection?.bonus ?? 0 : null,
      automaticSubs: [
        ...(projection?.subs ?? []).map(
          ([playerIn, playerOut]) =>
            `${name(playerIn) || "Unknown"} for ${name(playerOut) || "Unknown"}`
        ),
        ...(projection?.armbandTo
          ? [`Armband to ${name(projection.armbandTo) || "Unknown"}`]
          : []),
      ],
      automaticSubPoints: projection
        ? projection.points - projection.livePoints - projection.bonus
        : live
        ? 0
        : null,
      playersLeft: live ? projection?.playersLeft ?? 0 : null,
      stillToPlay: (projection?.left ?? []).map(
        (id) => `${name(id) || "Unknown"}${id === projection?.armband ? " (C)" : ""}`
      ),
      projectedScore,
      projectedTotal: projectedScore === null ? null : totalBefore + projectedScore,
      projectedPosition: null, // filled in below
      projectedPositionTied: false,
      projectedPositionChange: null, // filled in below
    }];
  });

  // Positions by total, shared by teams level on points, as in the
  // standings. The position before the gameweek is worked out the same way,
  // so that the change compares like with like.
  const totals = rows.flatMap((row) => (row.projectedTotal === null ? [] : [row.projectedTotal]));
  const before = [...totalsBefore.values()].filter((total) => total !== null);
  for (const row of rows) {
    const total = row.projectedTotal;
    if (total === null) continue;
    row.projectedPosition = 1 + totals.filter((other) => other > total).length;
    row.projectedPositionTied = totals.filter((other) => other === total).length > 1;
    const totalBefore = totalsBefore.get(row.teamId);
    if (totalBefore != null) {
      const positionBefore = 1 + before.filter((other) => other > totalBefore).length;
      row.projectedPositionChange = positionBefore - row.projectedPosition;
    }
  }

  // Only managers who had a team this gameweek are ranked and averaged.
  const ranked = rows.filter((row) => snapshot.picks[gw]?.[row.teamId]);
  const scoreOf = (row: GameweekStats) => row.projectedScore ?? row.netScore;
  const average = ranked.reduce((sum, row) => sum + scoreOf(row), 0) / ranked.length;
  for (const row of ranked) {
    row.leagueGameweekRank =
      1 + ranked.filter((other) => other.netScore > row.netScore).length;
    // To one decimal place, as it is shown.
    row.vsAverage = Math.round((scoreOf(row) - average) * 10) / 10;
  }
  return rows;
}

/** One of the gameweek's records, for the cards above the table. */
export type GameweekHighlight = TeamRecord<
  "winner" | "climber" | "captaincy" | "bench" | "hit" | "lowest"
>;

/**
 * The gameweek's records. A record nobody holds is left out. While the
 * gameweek is played, the highest and lowest scores and the biggest climb
 * are the projected ones, as in the Live view.
 */
export function computeGameweekHighlights(rows: GameweekStats[]): GameweekHighlight[] {
  // A manager without a team this gameweek holds no records.
  const played = rows.filter((row) => row.leagueGameweekRank !== null);
  const score = (row: GameweekStats) => row.projectedScore ?? row.netScore;
  const winner = teamRecord("winner", played, score);
  const lowest = teamRecord("lowest", played, (row) => -score(row));
  return [
    winner,
    teamRecord(
      "climber",
      played,
      (row) =>
        (row.projectedPosition !== null ? row.projectedPositionChange : row.positionChange) ?? 0,
      1
    ),
    teamRecord("captaincy", played, (row) => row.captaincyPointsLost, 1),
    teamRecord("bench", played, (row) => row.benchPoints, 1),
    teamRecord("hit", played, (row) => row.hit, 1),
    // No lowest score when every team scored the same: they are all winners.
    winner && lowest && -lowest.value < winner.value
      ? { ...lowest, value: -lowest.value }
      : null,
  ].filter((record) => record !== null);
}
