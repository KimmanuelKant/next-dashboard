// src/lib/stats/playerStats.ts
// Per-player statistics in the context of a league (the Scout table),
// computed from a league snapshot. Pure functions: no fetching.

import { LeagueSnapshot, PICK_CAPTAIN, PICK_VICE, PositionId } from "@/lib/fpl/types";

export interface PlayerStats {
  id: number;
  name: string;
  position: string;
  club: string;
  /** Millions. */
  value: number;
  totalPoints: number;
  gameweekPoints: number;
  form: number;
  globalOwnershipPercentage: number;
  globalOwnershipCount: number;
  leagueOwnershipCount: number;
  leagueOwnershipPercentage: number;
  /** League ownership % minus global ownership %. Negative = a differential here. */
  ownershipDifference: number;
  /** Managers who have the player in their starting eleven. */
  leagueStartingCount: number;
  /**
   * Sum of multipliers across the league, as a percent of managers. A captain
   * counts twice, a benched player not at all.
   */
  effectiveOwnership: number;
  leagueCaptainCount: number;
  leagueViceCaptainCount: number;
  /** Team names of the managers who own the player. */
  owners: string[];
}

const POSITION_NAMES: Record<PositionId, string> = {
  1: "Goalkeeper",
  2: "Defender",
  3: "Midfielder",
  4: "Forward",
};

/**
 * Stats for every player in the game, with this league's ownership in the
 * current gameweek. Players nobody in the league owns are included with zero
 * owners. Returns an empty list before the season's first deadline.
 */
export function computePlayerStats(snapshot: LeagueSnapshot): PlayerStats[] {
  const { currentGw, bootstrap, league } = snapshot;
  if (currentGw === null) {
    return [];
  }
  const teams = snapshot.picks[currentGw] ?? {};
  const points = snapshot.points[currentGw] ?? {};
  const clubs = new Map(bootstrap.clubs.map((c) => [c.id, c.name]));
  const playersById = new Map(bootstrap.players.map((p) => [p.id, p]));

  interface Tally {
    owners: string[];
    starting: number;
    multiplierSum: number;
    captain: number;
    vice: number;
  }
  const tallies = new Map<number, Tally>();
  let managersWithTeam = 0;

  for (const manager of league.managers) {
    const team = teams[manager.entryId];
    if (!team) continue;
    managersWithTeam++;
    for (const [playerId, multiplier, role] of team.picks) {
      let tally = tallies.get(playerId);
      if (!tally) {
        tally = { owners: [], starting: 0, multiplierSum: 0, captain: 0, vice: 0 };
        tallies.set(playerId, tally);
      }
      tally.owners.push(manager.teamName);
      tally.multiplierSum += multiplier;
      if (multiplier > 0) tally.starting++;
      if (role === PICK_CAPTAIN) tally.captain++;
      if (role === PICK_VICE) tally.vice++;
    }
  }

  for (const player of bootstrap.players) {
    if (!tallies.has(player.id)) {
      tallies.set(player.id, { owners: [], starting: 0, multiplierSum: 0, captain: 0, vice: 0 });
    }
  }

  const percentOfLeague = (n: number) =>
    managersWithTeam > 0 ? (n / managersWithTeam) * 100 : 0;

  const stats: PlayerStats[] = [];
  tallies.forEach((tally, playerId) => {
    const player = playersById.get(playerId);
    const globalPercent = player?.selectedByPercent ?? 0;
    const leaguePercent = percentOfLeague(tally.owners.length);
    stats.push({
      id: playerId,
      name: player?.name ?? "Unknown player",
      position: player ? POSITION_NAMES[player.position] ?? "Unknown" : "Unknown",
      club: (player && clubs.get(player.clubId)) || "Unknown",
      value: player ? player.cost / 10 : 0,
      totalPoints: player?.totalPoints ?? 0,
      gameweekPoints: points[playerId] ?? 0,
      form: player?.form ?? 0,
      globalOwnershipPercentage: globalPercent,
      globalOwnershipCount: Math.round(
        (globalPercent / 100) * bootstrap.totalManagers
      ),
      leagueOwnershipCount: tally.owners.length,
      leagueOwnershipPercentage: leaguePercent,
      ownershipDifference: leaguePercent - globalPercent,
      leagueStartingCount: tally.starting,
      effectiveOwnership: percentOfLeague(tally.multiplierSum),
      leagueCaptainCount: tally.captain,
      leagueViceCaptainCount: tally.vice,
      owners: tally.owners,
    });
  });

  return stats.sort((a, b) => a.name.localeCompare(b.name));
}
