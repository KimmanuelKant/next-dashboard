// src/lib/fpl/sources.ts
// Fetches FPL data, trims it to what the app needs, and caches the result.
//
// Caching rules:
// - Finished gameweeks never change, so their points and picks are cached
//   without expiry. One cache entry per gameweek (not per manager) keeps the
//   number of cache reads per page view low.
// - Everything else (bootstrap, standings, histories, the gameweek in
//   progress and its matches) is cached for a few minutes.
// - Failed fetches throw, so a failure is never cached.

import { unstable_cache } from "next/cache";
import type { FplBootstrapStatic } from "@/types/fpl/FplBootstrapStatic";
import type { FplLeagueStandings } from "@/types/fpl/FplLeagueStandings";
import type { FplEventLive } from "@/types/fpl/FplEventLive";
import type { FplEntryHistory } from "@/types/fpl/FplEntryHistory";
import type { FplEntryTransfers } from "@/types/fpl/FplEntryTransfers";
import type { FplEntryEventPicks } from "@/types/fpl/FplEntryEventPicks";
import type { FplEntry } from "@/types/fpl/FplEntry";
import type { FplFixtures } from "@/types/fpl/FplFixtures";
import { fplGet, FplError } from "./http";
import { MAX_MANAGERS } from "@/lib/leagueId";
import {
  Bootstrap,
  GameweekData,
  League,
  LeagueGameweekPicks,
  LiveFixture,
  LiveFixtures,
  ManagerHistory,
  Pick,
  PICK_CAPTAIN,
  PICK_NONE,
  PICK_VICE,
  PositionId,
  TeamLeagues,
} from "./types";

const MINUTE = 60;

async function fetchBootstrap(): Promise<Bootstrap> {
  const raw = await fplGet<FplBootstrapStatic>("/bootstrap-static/");
  if (!raw) {
    throw new FplError("/bootstrap-static/", 404);
  }
  const firstDeadline = raw.events[0]?.deadline_time;
  return {
    season: firstDeadline ? firstDeadline.slice(0, 4) : "unknown",
    totalManagers: raw.total_players,
    players: raw.elements.map((el) => ({
      id: el.id,
      name: el.web_name,
      position: el.element_type as PositionId,
      clubId: el.team,
      cost: el.now_cost,
      startCost: el.now_cost - el.cost_change_start,
      selectedByPercent: Number.parseFloat(el.selected_by_percent) || 0,
      totalPoints: el.total_points,
      form: Number.parseFloat(el.form) || 0,
    })),
    clubs: raw.teams.map((t) => ({
      id: t.id,
      name: t.name,
      shortName: t.short_name,
    })),
    gameweeks: raw.events.map((e) => ({
      id: e.id,
      finished: e.finished && e.data_checked,
      isCurrent: e.is_current,
      deadline: e.deadline_time,
      // FPL sends 0 and nulls for a gameweek that has not started.
      averageScore: e.average_entry_score || null,
      highestScore: e.highest_score ?? null,
      mostCaptained: e.most_captained ?? null,
    })),
  };
}

export const getBootstrap = unstable_cache(fetchBootstrap, ["fpl-bootstrap-v3"], {
  revalidate: 5 * MINUTE,
});

async function fetchLeague(leagueId: string): Promise<League | null> {
  const raw = await fplGet<FplLeagueStandings>(
    `/leagues-classic/${leagueId}/standings/`
  );
  if (!raw) {
    return null;
  }
  const results = [...raw.standings.results];
  let hasNext = raw.standings.has_next;
  for (let page = 2; hasNext && results.length < MAX_MANAGERS; page++) {
    const next = await fplGet<FplLeagueStandings>(
      `/leagues-classic/${leagueId}/standings/?page_standings=${page}`
    );
    if (!next || next.standings.results.length === 0) {
      hasNext = false;
      break;
    }
    results.push(...next.standings.results);
    hasNext = next.standings.has_next;
  }
  return {
    id: raw.league.id,
    name: raw.league.name,
    hasMoreManagers: hasNext || results.length > MAX_MANAGERS,
    managers: results
      // Standings can shift between page requests; keep each team once.
      .filter((r, i) => results.findIndex((o) => o.entry === r.entry) === i)
      .slice(0, MAX_MANAGERS)
      .map((r) => ({
      entryId: r.entry,
      managerName: r.player_name,
      teamName: r.entry_name,
      rank: r.rank,
      lastRank: r.last_rank,
      total: r.total,
      eventTotal: r.event_total,
    })),
  };
}

/** League name and standings. Null when the league does not exist. */
export const getLeague = unstable_cache(fetchLeague, ["fpl-league-v1"], {
  revalidate: 2 * MINUTE,
});

async function fetchTeamLeagues(teamId: string): Promise<TeamLeagues | null> {
  const raw = await fplGet<FplEntry>(`/entry/${teamId}/`);
  if (!raw) {
    return null;
  }
  return {
    teamName: raw.name,
    managerName: `${raw.player_first_name} ${raw.player_last_name}`.trim(),
    leagues: (raw.leagues?.classic ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      general: l.league_type === "s",
      rank: l.entry_rank || null,
      size: l.rank_count ?? null,
    })),
  };
}

/** A team's classic leagues. Null when the team does not exist. */
export const getTeamLeagues = unstable_cache(fetchTeamLeagues, ["fpl-team-leagues-v1"], {
  revalidate: 5 * MINUTE,
});

async function fetchGameweekData(gw: number): Promise<GameweekData> {
  const raw = await fplGet<FplEventLive>(`/event/${gw}/live/`);
  if (!raw) {
    throw new FplError(`/event/${gw}/live/`, 404);
  }
  const data: GameweekData = {
    points: {},
    incidents: {},
    minutes: {},
    fetchedAt: new Date().toISOString(),
  };
  for (const el of raw.elements) {
    const s = el.stats;
    data.points[el.id] = s.total_points;
    if (s.minutes > 0) {
      data.minutes[el.id] = s.minutes;
    }
    if (s.yellow_cards || s.red_cards || s.own_goals || s.penalties_missed) {
      data.incidents[el.id] = [
        s.yellow_cards,
        s.red_cards,
        s.own_goals,
        s.penalties_missed,
      ];
    }
  }
  return data;
}

export function getGameweekData(
  season: string,
  gw: number,
  finished: boolean
): Promise<GameweekData> {
  return unstable_cache(
    () => fetchGameweekData(gw),
    ["fpl-gameweek-v4", season, String(gw), finished ? "final" : "live"],
    { revalidate: finished ? false : MINUTE }
  )();
}

async function fetchLiveFixtures(gw: number): Promise<LiveFixtures> {
  const raw = await fplGet<FplFixtures>(`/fixtures/?event=${gw}`);
  if (!raw) {
    throw new FplError(`/fixtures/?event=${gw}`, 404);
  }
  const fixtures = raw.map((f): LiveFixture => {
    const stat = (identifier: string) => {
      const found = f.stats.find((s) => s.identifier === identifier);
      return found ? [...found.h, ...found.a] : [];
    };
    // FPL fills in a match's bonus when it adds it to the players' points,
    // shortly after the final whistle.
    const bonusAdded = stat("bonus").length > 0;
    return {
      id: f.id,
      homeClubId: f.team_h,
      awayClubId: f.team_a,
      kickoff: f.kickoff_time ?? null,
      started: f.started ?? false,
      done: f.finished || f.finished_provisional,
      homeScore: f.team_h_score ?? null,
      awayScore: f.team_a_score ?? null,
      minutes: f.minutes,
      bonusAdded,
      bps: bonusAdded ? [] : stat("bps").map((s): [number, number] => [s.element, s.value]),
    };
  });
  return { fixtures, fetchedAt: new Date().toISOString() };
}

/**
 * The matches of a gameweek that is still being played, for the live
 * projection. One request for the whole game, not per league, so it is
 * cached as briefly as the live points.
 */
export function getLiveFixtures(season: string, gw: number): Promise<LiveFixtures> {
  return unstable_cache(
    () => fetchLiveFixtures(gw),
    ["fpl-live-fixtures-v3", season, String(gw)],
    { revalidate: MINUTE }
  )();
}

async function fetchLeaguePicks(
  entryIds: number[],
  gw: number
): Promise<LeagueGameweekPicks> {
  const result: LeagueGameweekPicks = {};
  await Promise.all(
    entryIds.map(async (entryId) => {
      // 404 means the manager had no team that gameweek (joined later).
      const raw = await fplGet<FplEntryEventPicks>(
        `/entry/${entryId}/event/${gw}/picks/`
      );
      if (!raw || raw.picks.length === 0) {
        result[entryId] = null;
        return;
      }
      const picks: Pick[] = [...raw.picks]
        .sort((a, b) => a.position - b.position)
        .map((p) => [
          p.element,
          p.multiplier,
          p.is_captain ? PICK_CAPTAIN : p.is_vice_captain ? PICK_VICE : PICK_NONE,
        ]);
      const autoSubs = (raw.automatic_subs as { element_in: number; element_out: number }[]).map(
        (sub): [number, number] => [sub.element_in, sub.element_out]
      );
      result[entryId] = { chip: raw.active_chip, picks, autoSubs };
    })
  );
  return result;
}

/** Short stable fingerprint of a league's members, for cache keys. */
function membersKey(entryIds: number[]): string {
  let hash = 5381;
  for (const id of [...entryIds].sort((a, b) => a - b)) {
    hash = (hash * 33 + id) >>> 0;
  }
  return `${entryIds.length}-${hash.toString(36)}`;
}

/**
 * Every team's picks for one gameweek. The key's version was not raised
 * when `autoSubs` was added: that would have fetched the picks of every
 * team for every finished gameweek again, two thousand requests for a big
 * league. Picks cached before then lack the field, and the code reads that
 * as "not known"; gameweeks finished since, and leagues loaded since, have
 * it. Raise the version for any change the code cannot read that way.
 */
export function getLeaguePicks(
  season: string,
  leagueId: string,
  entryIds: number[],
  gw: number,
  finished: boolean
): Promise<LeagueGameweekPicks> {
  return unstable_cache(
    () => fetchLeaguePicks(entryIds, gw),
    [
      "fpl-picks-v1",
      season,
      leagueId,
      membersKey(entryIds),
      String(gw),
      finished ? "final" : "live",
    ],
    { revalidate: finished ? false : 5 * MINUTE }
  )();
}

async function fetchLeagueHistories(
  entryIds: number[]
): Promise<Record<number, ManagerHistory>> {
  const result: Record<number, ManagerHistory> = {};
  await Promise.all(
    entryIds.map(async (entryId) => {
      const [raw, transfers] = await Promise.all([
        fplGet<FplEntryHistory>(`/entry/${entryId}/history/`),
        fplGet<FplEntryTransfers>(`/entry/${entryId}/transfers/`),
      ]);
      result[entryId] = {
        gameweeks: (raw?.current ?? []).map((g) => ({
          gw: g.event,
          points: g.points,
          totalPoints: g.total_points,
          rank: g.rank ?? null,
          overallRank: g.overall_rank ?? null,
          bank: g.bank,
          value: g.value,
          transfers: g.event_transfers,
          transfersCost: g.event_transfers_cost,
          benchPoints: g.points_on_bench,
        })),
        chips: (raw?.chips ?? []).map((c) => ({ name: c.name, gw: c.event })),
        transfers: [...(transfers ?? [])]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((t) => ({
            gw: t.event,
            playerIn: t.element_in,
            playerOut: t.element_out,
            inCost: t.element_in_cost,
            outCost: t.element_out_cost,
          })),
      };
    })
  );
  return result;
}

export function getLeagueHistories(
  season: string,
  leagueId: string,
  entryIds: number[]
): Promise<Record<number, ManagerHistory>> {
  return unstable_cache(
    () => fetchLeagueHistories(entryIds),
    ["fpl-histories-v3", season, leagueId, membersKey(entryIds)],
    { revalidate: 5 * MINUTE }
  )();
}
