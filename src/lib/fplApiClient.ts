// src/lib/fplApi.ts

import { FplBootstrapStatic } from "@/types/fpl/FplBootstrapStatic";
import { FplLeagueStandings } from "@/types/fpl/FplLeagueStandings";
import { FplEventLive } from "@/types/fpl/FplEventLive";
import { FplEntryHistory } from "@/types/fpl/FplEntryHistory";
import { FplEntryEventPicks } from "@/types/fpl/FplEntryEventPicks";

/**
 * Fetches the bootstrap-static data.
 */
export async function getBootstrapData(): Promise<FplBootstrapStatic> {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    {
      cache: "no-store", // Ensure fresh data
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch bootstrap-static data");
  }

  const rawText = await res.text();
  const data: FplBootstrapStatic = JSON.parse(rawText);

  return data;
}

/**
 * Fetches league standings.
 */
export async function getLeagueStandings(
  leagueId: string | number
): Promise<FplLeagueStandings> {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch league standings for leagueId: ${leagueId}`
    );
  }

  const rawText = await res.text();
  const data: FplLeagueStandings = JSON.parse(rawText);

  return data;
}

/**
 * Fetches live data for a specific gameweek.
 */
export async function getLiveDataForGameweek(
  gameweek: number
): Promise<FplEventLive> {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/event/${gameweek}/live/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch live data for gameweek ${gameweek}`);
  }

  const data: FplEventLive = await res.json();
  return data;
}

/**
 * Fetches the entry history for a specific team.
 */
export async function getEntryHistory(
  teamId: number
): Promise<FplEntryHistory> {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${teamId}/history/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch manager history for team ID ${teamId}`);
  }

  const data: FplEntryHistory = await res.json();
  return data;
}

/**
 * Fetches the picks for a specific team and gameweek.
 */
export async function getEntryEventPicks(
  teamId: number,
  gameweek: number
): Promise<FplEntryEventPicks> {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );

  if (!res.ok) {
    // Return a complete FplEntryEventPicks object with default values
    return {
      picks: [],
      event: gameweek,
      active_chip: null,
      automatic_subs: [],
      entry_history: {
        event: gameweek,
        points: 0,
        total_points: 0,
        rank: 0,
        rank_sort: 0,
        overall_rank: 0,
        percentile_rank: 0,
        bank: 0,
        value: 0,
        event_transfers: 0,
        event_transfers_cost: 0,
        points_on_bench: 0,
      },
    };
  }

  const data: FplEntryEventPicks = await res.json();
  return data;
}

