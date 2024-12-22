// src/lib/fplApi.ts

import { FplBootstrapStatic } from "@/types/fpl/FplBootstrapStatic";
import { FplLeagueStandings } from "@/types/fpl/FplLeagueStandings";
import { FplEventLive } from "@/types/fpl/FplEventLive";
import { FplEntryHistory } from "@/types/fpl/FplEntryHistory";
import { FplEntryEventPicks } from "@/types/fpl/FplEntryEventPicks";

const debugManagerEntryId = 295349; // The manager ID you want to debug

/**
 * Fetches the bootstrap-static data and logs key information.
 */
export async function getBootstrapData(): Promise<FplBootstrapStatic> {
  console.log("\n=== DEBUG: getBootstrapData called ===");
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    {
      cache: "no-store", // Ensure fresh data
    }
  );
  console.log("getBootstrapData fetch status:", res.status);

  if (!res.ok) {
    throw new Error("Failed to fetch bootstrap-static data");
  }

  const rawText = await res.text();
  // Truncate to avoid excessive logging
  const truncated = rawText.slice(0, 800);
  console.log(
    `Raw bootstrap-static JSON (truncated to 800 chars):\n${truncated}\n...`
  );

  const data: FplBootstrapStatic = JSON.parse(rawText);

  // Log completed gameweeks
  const finishedGameweeks = data.events
    .filter((e) => e.finished)
    .map((e) => e.id);
  console.log("Completed gameweeks (finished=true):", finishedGameweeks);

  return data;
}

/**
 * Fetches league standings and logs detailed information for the debug manager.
 */
export async function getLeagueStandings(
  leagueId: string | number
): Promise<FplLeagueStandings> {
  console.log("\n=== DEBUG: getLeagueStandings called ===");
  console.log("League ID:", leagueId);

  const res = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );
  console.log("getLeagueStandings fetch status:", res.status);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch league standings for leagueId: ${leagueId}`
    );
  }

  const rawText = await res.text();
  // Truncate to avoid excessive logging
  const truncated = rawText.slice(0, 800);
  console.log(
    `Raw league standings JSON (truncated to 800 chars):\n${truncated}\n...`
  );

  const data: FplLeagueStandings = JSON.parse(rawText);

  // Attempt to find the debug manager
  if (data?.standings?.results && Array.isArray(data.standings.results)) {
    const manager = data.standings.results.find(
      (r) => r.entry === debugManagerEntryId
    );
    if (manager) {
      console.log(
        `\nDEBUG: Manager ${debugManagerEntryId} found in league standings:`
      );
      console.log({
        rank: manager.rank,
        total: manager.total,
        event_total: manager.event_total,
        entry: manager.entry,
        entry_name: manager.entry_name,
        player_name: manager.player_name,
      });
    } else {
      console.log(
        `\nDEBUG: Manager ${debugManagerEntryId} not found in league standings.`
      );
    }
  } else {
    console.log(
      "\nDEBUG: No .standings.results array in parsed league standings data."
    );
  }

  return data;
}

/**
 * Fetches live data for a specific gameweek.
 */
export async function getLiveDataForGameweek(
  gameweek: number
): Promise<FplEventLive> {
  console.log(
    `\n=== DEBUG: getLiveDataForGameweek called for GW ${gameweek} ===`
  );

  const res = await fetch(
    `https://fantasy.premierleague.com/api/event/${gameweek}/live/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );
  console.log(
    `getLiveDataForGameweek GW ${gameweek} fetch status:`,
    res.status
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
  console.log(`\n=== DEBUG: getEntryHistory called for team ID ${teamId} ===`);

  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${teamId}/history/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );
  console.log(`getEntryHistory team ID ${teamId} fetch status:`, res.status);

  if (!res.ok) {
    throw new Error(`Failed to fetch manager history for team ID ${teamId}`);
  }

  const data: FplEntryHistory = await res.json();
  console.log(`DEBUG: Manager ${teamId} history fetched successfully.`);
  console.log(
    `Manager ${teamId} total points (latest GW):`,
    data.current[data.current.length - 1].total_points
  );

  return data;
}

/**
 * Fetches the picks for a specific team and gameweek.
 */
export async function getEntryEventPicks(
  teamId: number,
  gameweek: number
): Promise<FplEntryEventPicks> {
  console.log(
    `\n=== DEBUG: getEntryEventPicks called for team ${teamId}, GW ${gameweek} ===`
  );

  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/`,
    {
      cache: "no-store", // Ensure fresh data
    }
  );
  console.log(
    `getEntryEventPicks team ${teamId} GW ${gameweek} fetch status:`,
    res.status
  );

  if (!res.ok) {
    // It's possible that picks are not available for some GWs. Handle gracefully.
    console.warn(
      `Warning: Failed to fetch picks for team ${teamId}, GW ${gameweek}. Status: ${res.status}`
    );
    return { gw: gameweek, picks: [] };
  }

  const data: FplEntryEventPicks = await res.json();
  return data;
}

// You can add more functions here for transfers, fixtures, etc., as needed.
