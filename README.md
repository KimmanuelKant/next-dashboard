# MyFPL.net

A dashboard for Fantasy Premier League mini-leagues. Enter a classic league ID
and get sortable, customisable tables the official site does not offer:

- **Player Statistics**: every player owned in the league, with league vs
  global ownership, effective ownership, captaincy counts and who owns whom.
  Built for finding differentials.
- **Team Statistics**: per-manager transfers, hits, chips, captaincy, ranks and
  points by position.

Leagues of up to 100 teams are loaded in full; larger leagues show the top 100.

## Stack

Next.js (App Router) on Vercel, React, TanStack Table, Bootstrap. Data comes
from the public Fantasy Premier League API. There is no database and no login.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests for the statistics
npm run lint
npm run build
```

Requires Node 20.9 or newer.

## How it works

```
src/lib/fpl/http.ts       FPL API access: concurrency limit and retries
src/lib/fpl/sources.ts    Fetch, trim and cache each kind of FPL data
src/lib/fpl/snapshot.ts   getLeagueSnapshot(): everything known about a league
src/lib/stats/            Pure functions that turn a snapshot into table rows
src/components/           DataTable (shared) and the two table definitions
src/app/dashboard/[leagueId]/   Routes: team, player
```

Every table is computed from one **league snapshot** (standings, each manager's
history, each manager's squad per gameweek, player points per gameweek). To add
a statistic, write a pure function over the snapshot in `src/lib/stats/` and a
column for it; no new fetching is needed.

### Caching

Finished gameweeks never change, so their squads and points are cached without
expiry, one small entry per league per gameweek. Standings, histories and the
gameweek in progress are cached for a few minutes. Raw FPL responses are never
cached, only the trimmed data. A failed FPL request is never cached.

League IDs are reused by FPL each season, so cache keys include the season.
