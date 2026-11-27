# MyFPL.net

A dashboard for Fantasy Premier League mini-leagues. Enter a classic league ID
and get sortable, customisable tables the official site does not offer:

- **Scout**: every player, owned in the league or not, with league vs
  global ownership, effective ownership, captaincy counts and who owns whom,
  and a mark on injured, doubtful and suspended players with FPL's news.
  Built for finding differentials and making informed transfers.
  Filter by name, position, club, owner, price and number of owners. While
  a gameweek is played, a Live view shows each player's points with
  provisional bonus and what he costs the teams that do not start him.
- **This Gameweek**: a strip of every team's score as dots, with the league
  and FPL averages and your own team marked (`ScoreSpread`, between the
  highlight cards and the table); each manager's score and how far it is from the league
  average, the gap to the leader, the team above and your own team,
  captain (and whether the vice captain stepped in), chip, transfers in
  and out and what each gained that week, bench, points lost to the captaincy choice, the blanks, cards
  and own goals, the players who swung the gameweek for and against each
  team, points from players nobody else in the league started, the
  automatic substitutions, and how the score and the captain compare with
  FPL's average and its most captained player. Earlier gameweeks can be opened as well. While a
  gameweek is played, a Live view projects each score and the league table
  with provisional bonus and automatic substitutions, and the page
  refreshes itself during matches, marking the scores that changed at
  the last update. A strip shows the matches on now (or next), with their
  score and how many of the league's teams have a player in each.
  "Copy recap" gives the gameweek in a few lines for a group chat, built
  from the highlight cards, with a link back (a "so far" version while it
  is played; `src/lib/stats/recap.ts`).
- **Season**: per-manager form, "boom or bust" swing, climbs and falls in
  the table, runs at the top, months won (manager of the month), free
  transfers and chips left for the next deadline, transfers, hits (and how
  many paid off), seller's remorse (the player sold who has scored most
  since) and its mirror, bought too late, knee-jerk sales, chips and when
  they were played against the league, captaincy with blanks and vice
  captain saves, ranks, points by position and by club, the share of the
  top three players, weeks at the top and bottom, template score (how
  common the squad is in the league), players used, favourite club,
  most-held player and squad streaks, cards and own goals.
  `src/lib/stats/habits.ts` holds the stats that set a team against the
  whole league (template score, chip timing).
- **Charts** (the `history` route, once League History): line charts of
  every team's league position, gap to the leader, points against the
  league average, total points, gameweek score and overall rank, gameweek
  by gameweek. The chart and highlighted teams are in the address
  (`?chart=gap-to-leader&teams=1,2`); the series are `CHART_SERIES` in
  `src/lib/stats/leagueHistory.ts`. Below it a heatmap of every score
  against the league's average that week, with the chips marked
  (`LeagueHeatmap`), and a table of positions and scores.

Leagues of up to 100 teams are loaded in full; larger leagues show the top 100.

## Stack

Next.js (App Router) on Vercel, React, TanStack Table, Bootstrap. Data comes
from the public Fantasy Premier League API. There is no database and no login.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # type check, lint and tests in one go
npm test         # unit tests for the statistics
npm run lint
npm run build
```

Requires Node 20.9 or newer.

`AGENTS.md` holds the project's rules for AI coding agents, and `.mcp.json`
connects them to the running dev server and to Vercel (deployments, logs and
Web Analytics; sign in once with `/mcp` in Claude Code).

## How it works

```
src/lib/fpl/http.ts       FPL API access: concurrency limit and retries
src/lib/fpl/sources.ts    Fetch, trim and cache each kind of FPL data
src/lib/fpl/types.ts      The trimmed shapes, including LeagueSnapshot
src/lib/fpl/snapshot.ts   getLeagueSnapshot(): everything known about a league
src/lib/stats/            Pure functions that turn a snapshot into table rows
src/types/fpl/            Shapes of the raw FPL API responses
src/components/           DataTable (shared), one table definition per tab,
                          and the chart on the Charts tab
src/app/page.tsx          Front page: the league ID and team ID boxes
src/app/team/[teamId]/    A team's leagues, for visitors who only know
                          their team ID
src/app/dashboard/[leagueId]/   The tabs: gameweek, season, scout, history (Charts)
```

A tab is three small pieces. The route (`season/page.tsx`) renders a server
component (`LeagueTeamStats`), which loads the snapshot, computes the rows
(`computeTeamStats`) and hands them to a table definition
(`SeasonStatisticsTable`): the columns, their explanations and the preset
views. The `awards`, `player` and `team` routes under the dashboard only
redirect from old addresses.

The Gameweek and Season tabs open with highlight cards (gameweek winner, worst
captain call, most yellow cards). `src/lib/stats/records.ts` finds who holds
each record; the table definition says what its card reads and which view it
opens.

The live projection (`src/lib/stats/live.ts`) works from the gameweek's
matches, one request for the whole game (`/fixtures/?event={gw}`), loaded
only while the current gameweek is unfinished. It adds the bonus as the
bonus points system stands in matches whose bonus FPL has not yet added,
and makes the automatic substitutions FPL will make after the last match.
`LiveStatus` shows when the scores were fetched, offers a refresh, and
refreshes the page every minute while a match is played. The browser
compares each update with the one before (`src/lib/liveChanges.ts`, given
to `DataTable` as `trackChanges`): a changed score is marked "+6" until
the next update that changes anything, and the rows that changed glow
briefly. The server is not involved, so this costs no requests.
`src/lib/stats/matches.ts` picks the matches for the "Now playing" strip
from the same fixtures.

`src/lib/stats/leagueGameweek.ts` works out what each team counts on in a
gameweek: every player's multiplier, after the projected substitutions
while the gameweek is played, and the league's average of it. Swing, unique
points and Scout's effective ownership are built on it, so they agree with
the projected scores.

Every table keeps its view and sorting in the page address
(`?view=mishaps&sort=-yellowCards`, see `src/lib/tableUrl.ts`), so a link to a
particular table can be shared; the Share link at the top of a league does
that. The Gameweek tab also takes `?gw=7` for an earlier gameweek.

A league's link, pasted into a chat, shows a picture drawn for that league
(`src/app/dashboard/[leagueId]/opengraph-image.tsx`): its name, its leader
and the gameweek's top score. It is drawn from the standings and bootstrap
only, never the full league load, and Vercel's CDN keeps it for ten
minutes. `robots.ts` lets the link-preview fetchers into league pages.

A visitor's own team is highlighted on every tab. It is known from the
address (`?team=`) when they came in with a team ID, or from the "This is my
team" button in a team's panel, which also remembers the league in the
browser.

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
