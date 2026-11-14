// src/lib/fpl/snapshot.ts
// One object holding everything the stats need for a league. Every table on
// the site is computed from this, so adding a stat needs no new fetching.

import { cache } from "react";
import {
  getBootstrap,
  getGameweekData,
  getLeague,
  getLeagueHistories,
  getLeaguePicks,
} from "./sources";
import { LeagueSnapshot } from "./types";

/**
 * Loads the snapshot for a league. Returns null when the league does not exist.
 * Wrapped in React's cache() so the layout and the page share one load per request.
 */
export const getLeagueSnapshot = cache(
  async (leagueId: string): Promise<LeagueSnapshot | null> => {
    const [bootstrap, league] = await Promise.all([
      getBootstrap(),
      getLeague(leagueId),
    ]);
    if (!league) {
      return null;
    }

    const { season } = bootstrap;
    const currentGw = bootstrap.gameweeks.find((g) => g.isCurrent)?.id ?? null;
    const played = bootstrap.gameweeks.filter(
      (g) => currentGw !== null && g.id <= currentGw
    );
    const entryIds = league.managers.map((m) => m.entryId);

    const [dataList, picksList, histories] = await Promise.all([
      Promise.all(played.map((g) => getGameweekData(season, g.id, g.finished))),
      Promise.all(
        played.map((g) =>
          getLeaguePicks(season, leagueId, entryIds, g.id, g.finished)
        )
      ),
      getLeagueHistories(season, leagueId, entryIds),
    ]);

    const snapshot: LeagueSnapshot = {
      league,
      bootstrap,
      currentGw,
      gameweekIds: played.map((g) => g.id),
      points: {},
      incidents: {},
      picks: {},
      histories,
    };
    played.forEach((g, i) => {
      snapshot.points[g.id] = dataList[i].points;
      snapshot.incidents[g.id] = dataList[i].incidents;
      snapshot.picks[g.id] = picksList[i];
    });
    return snapshot;
  }
);
