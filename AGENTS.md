# MyFPL.net: notes for coding agents

A dashboard for Fantasy Premier League mini-leagues, live at
https://www.myfpl.net. A visitor enters a league ID and gets sortable tables
of statistics about that league. `README.md` describes the features and the
layout of the code ("How it works"); read it first. `TODO.md` is the backlog.

## Checking your work

- `npm run check` runs the type check, the linter and the tests. Run it before
  you call a change done. The parts alone: `npm run typecheck`,
  `npm run lint`, `npm test`.
- Run the tests with `npm test`, not `npx vitest`. On Windows, Vitest fails
  when the shell's working directory has a lower-case drive letter;
  `scripts/test.mjs` corrects that. Arguments pass through:
  `npm test -- watch`.
- The linter reports one warning, `react-hooks/incompatible-library` on
  `useReactTable()` in `src/components/DataTable.tsx`. It is expected (React
  Compiler skips components that use TanStack Table). Leave it.
- To look at a page, run `npm run dev` and open
  `http://localhost:3000/dashboard/<leagueId>/gameweek`. League pages read
  the live FPL API, so they need network access and the ID of a real classic
  league. Ask the user for one, and use a small league.
- While the dev server runs, the Next.js MCP server set up in `.mcp.json`
  reports build errors, runtime errors and routes, so a full `npm run build`
  is not needed to find out whether the code compiles. `.mcp.json` starts it
  through `cmd /c`, which Windows needs; on other systems the command is
  `npx -y next-devtools-mcp@latest`.

## Constraints

- Hosting is Vercel's free plan and there is no budget. No database, no
  login, no paid services.
- Scope: finding differentials in a mini-league, and fun or odd statistics.
  Chat, accounts and other social features are out of scope.
- Styling is Bootstrap 5 with react-bootstrap, dark theme. Use Bootstrap's
  classes and components as intended before adding CSS to
  `src/styles/global.css`.
- Only classic leagues are supported. A league is loaded up to
  `MAX_MANAGERS` (100) teams.
- Every push triggers a Vercel deployment. Push only when the user has said
  you may.

## Adding or changing a statistic

Every table is computed from one `LeagueSnapshot` (`src/lib/fpl/types.ts`),
loaded by `getLeagueSnapshot()`. A new statistic normally needs no new
fetching:

1. Compute it in a pure function in `src/lib/stats/`, as a new field on the
   row type (`TeamStats`, `GameweekStats`, `PlayerStats`, `LeagueHistoryRow`).
2. Test it in `src/lib/stats/stats.test.ts`, which builds a small snapshot
   by hand.
3. Show it in the table for that tab (`src/components/*Table.tsx`): add the
   column, its entry in `descriptions` (the explanation visitors read), its
   entry in `shortHeaders` (the header on phones), and its place in `groups`
   or `presets`.

A preset's name is the text on its button and its name in the page address
(`?view=league-race`). Keep it short, and avoid renaming one: links to the
old name then open the default view.

The Gameweek and Season tabs show highlight cards above the table. To add
one, add the record to `computeGameweekHighlights()` or
`computeSeasonHighlights()` with `teamRecord()`, and its card to
`highlightCards` in the table file. Six cards fill three rows on a phone;
replace one before adding a seventh.

## FPL API and caching

- `fplGet()` in `src/lib/fpl/http.ts` is the only code that calls the FPL
  API. It limits concurrency and retries. Do not call `fetch` on the FPL API
  anywhere else.
- Loading a league that is not cached costs two requests per team, plus one
  per team per gameweek played. Before adding a request per team or per
  player, check whether the snapshot already holds the data.
- `src/lib/fpl/sources.ts` trims each raw response to a compact shape and
  caches that. Never cache a raw response.
- Each cache key carries a version (`"fpl-league-v1"`). When you change the
  shape of cached data, raise the version in its key: finished gameweeks are
  cached without expiry, so entries in the old shape would otherwise be
  served for the rest of the season.
- Cache keys include the season, because FPL reuses league IDs every season.
- A failed fetch must throw, not return an empty result, so that the failure
  is not cached.
- Route parameters must pass `isValidLeagueId()` or `isValidTeamId()` before
  they are used in a request to the FPL API.
- League and team pages are closed to search engines in `src/app/robots.ts`,
  because every view costs a server render and FPL requests. Keep them out
  of the sitemap.

## Phones

A large share of visitors use a phone. Check a change to a page or table at a
width of about 380px as well as on a desktop. `DataTable` keeps the name
column in view while a table scrolls sideways, and opens a panel listing
every column when a row is selected. Below 576px it also switches to the
short headers and folds the subtitle column into the name column. `<Narrow>`
renders a short and a full version of a text and lets CSS pick one.

## Conventions

- Each file starts with a comment giving its path. Comments say why the code
  is the way it is, in plain English.
- `@/` in an import means `src/`.
- Components are server components unless they need state or browser APIs;
  those start with `"use client"`.
- The `awards`, `player` and `team` routes under
  `src/app/dashboard/[leagueId]/` only redirect from old addresses. Keep them
  so existing links and bookmarks work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
