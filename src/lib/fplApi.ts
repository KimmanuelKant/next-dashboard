// src/lib/fplApi.ts

import { FplBootstrapStatic } from '@/types/fpl/FplBootstrapStatic';
import { FplLeagueStandings } from '@/types/fpl/FplLeagueStandings';
import { FplEventLive } from '@/types/fpl/FplEventLive';
import { FplEntryHistory } from '@/types/fpl/FplEntryHistory';
import { FplEntryEventPicks } from '@/types/fpl/FplEntryEventPicks';

export async function getBootstrapData(): Promise<FplBootstrapStatic> {
  const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  if (!res.ok) {
    throw new Error('Failed to fetch bootstrap-static data');
  }
  return res.json();
}

export async function getLeagueStandings(leagueId: string | number): Promise<FplLeagueStandings> {
  const res = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch league standings for leagueId: ${leagueId}`);
  }
  return res.json();
}

export async function getLiveDataForGameweek(gameweek: number): Promise<FplEventLive> {
  const res = await fetch(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch live data for gameweek ${gameweek}`);
  }
  return res.json();
}

export async function getEntryHistory(teamId: number): Promise<FplEntryHistory> {
  const res = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/history/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch manager history for team ID ${teamId}`);
  }
  return res.json();
}

export async function getEntryEventPicks(teamId: number, gameweek: number): Promise<FplEntryEventPicks> {
  const res = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/`);
  if (!res.ok) {
    // It's possible that picks are not available for some GWs. Handle gracefully.
    throw new Error(`Failed to fetch picks for team ${teamId}, GW ${gameweek}`);
  }
  return res.json();
}

// adding transfers data, fixtures, etc. as needed

