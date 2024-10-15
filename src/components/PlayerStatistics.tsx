// src/components/PlayerStatistics.tsx

import React from 'react';
import { ApiTeam, Pick, Player, GameEvent } from '@/types';
import PlayerStatisticsTable from '@/components/PlayerStatisticsTable';

interface PlayerStatisticsProps {
  leagueId: string;
}

export default async function PlayerStatistics({ leagueId }: PlayerStatisticsProps) {
  try {
    // Fetch league standings data to get the team IDs
    const standingsRes = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
      { cache: 'no-store' }
    );
    if (!standingsRes.ok) {
      throw new Error('Failed to fetch league standings');
    }
    const standingsData = await standingsRes.json();
    const teams: ApiTeam[] = standingsData.standings.results;

    // Fetch player data (names and IDs)
    const playersRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    if (!playersRes.ok) {
      throw new Error('Failed to fetch player data');
    }
    const playersData = await playersRes.json();
    const players: Player[] = playersData.elements;

    // Fetch events to get the latest finished gameweek
    const events: GameEvent[] = playersData.events;
    const latestFinishedEvent = events
      .filter((event) => event.finished)
      .sort((a, b) => b.id - a.id)[0];

    if (!latestFinishedEvent) {
      throw new Error('No finished gameweeks found');
    }

    const latestGameweek = latestFinishedEvent.id;

    // Create a map of player IDs to player names
    const playerMap = new Map<number, string>();
    players.forEach((player) => {
      playerMap.set(player.id, player.web_name);
    });

    // Set to store unique player IDs selected by teams in the league
    const selectedPlayerIds = new Set<number>();

    // Fetch picks for each team
    const teamPromises = teams.map(async (team) => {
      const teamId = team.entry;

      // Fetch the picks for the latest finished gameweek
      const picksRes = await fetch(
        `https://fantasy.premierleague.com/api/entry/${teamId}/event/${latestGameweek}/picks/`,
        { cache: 'no-store' }
      );
      if (!picksRes.ok) {
        console.warn(`Failed to fetch picks for team ${teamId} in GW ${latestGameweek}`);
        return;
      }
      const picksData = await picksRes.json();
      const picks: Pick[] = picksData.picks;

      // Add player IDs to the set
      picks.forEach((pick) => {
        selectedPlayerIds.add(pick.element);
      });
    });

    // Wait for all team data to be fetched
    await Promise.all(teamPromises);

    // Get the names of the selected players
    const selectedPlayers = Array.from(selectedPlayerIds).map((playerId) => {
      const playerName = playerMap.get(playerId) || 'Unknown Player';
      return {
        id: playerId,
        name: playerName,
      };
    });

    // Sort the players by name
    selectedPlayers.sort((a, b) => a.name.localeCompare(b.name));

    // Render the table
    return <PlayerStatisticsTable players={selectedPlayers} />;
  } catch (error) {
    console.error('Error fetching player statistics:', error);
    return <div>Error loading player statistics.</div>;
  }
}
