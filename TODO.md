# TODO

Stats are organised by what the row is (manager, player, gameweek, pair of
managers) and by the question they answer. "This gameweek" and "season" stats
live on separate tabs. New stats go into the tables as columns and views.

Most stats below are computed from the league snapshot as it is. Those
marked **(trim)** need a field that FPL already sends but `sources.ts`
discards: keep it and raise the cache key's version. Those marked
**(fetch)** need a new request; see "Data to fetch" at the end.

## Sharing (how the site grows)
Visitors finding odd stats and posting them in their league's group chat is
the way to grow without self-promotion.
- The MyFPL.net league (`MYFPL_LEAGUE` in `site.ts`) is linked from the
  front page for visitors to join. Once it has ten or so teams, link it
  as an example league too, for visitors without their own ID to hand.
- Later: let visitors pick a stat or an outlier themselves and make a
  highlight card from it to share. A chart from the Charts tab is already a
  link (see Charts); the next step is a preview image that draws the chart,
  so the link shows the graph when pasted in a group chat. Each image is a
  server render: cache it by address.

## Next stats (best value for the effort)
- Season: previous seasons (trim, see Veterans below).
- Scout: upcoming fixtures (fetch `/fixtures/`).

## Live (while a gameweek is played)
- Phone columns: check every view on a real phone at about 380px and tune
  each view's `phoneColumns`. The Live view on the Gameweek tab still
  scrolls a little sideways at 380px.
- Highlight cards: tune `STANDOUT_TO_EARN` and `MIN_HIGHLIGHTS` in
  `records.ts` after a few gameweeks. Maybe a little chance among the
  records that earn a card when more than six do, so a refresh can show
  others.
- Not planned: push notifications or alerts (they need accounts or a store
  of subscriptions); refreshing more often than once a minute (every
  refresh is a server render, and live points are cached for a minute);
  "expected points still to come" (a guess dressed up as a number).

## Gameweek: stats still to add
- Score spread as a share card: the strip and its sentence ("You scored 66:
  4th of 20") as an image for a group chat.
- Automatic substitutions in finished gameweeks are kept since November
  2026 (`autoSubs`), but not for gameweeks a league had cached before then
  (see `getLeaguePicks`). Next season every gameweek has them; then the
  Season tab can add up points gained from automatic substitutions.

## Season: stats still to add, by group
- Chips: chip timeline, a dot per chip per team along the gameweeks (who
  still holds what, who copied whom). Chip timing against the league is a
  column (`chipTiming()` in `habits.ts`).
- Free transfers are worked out from FPL's rules in `deadline.ts`, since
  FPL does not publish other teams'. Check them against a real team now
  and then; a one-off top-up for everyone (as for AFCON in 2025/26) would
  need adding there.
- Transfers: seller's remorse and bought too late each show one player;
  a total over every sale or purchase would need the other side's points
  set against it to mean anything. Bought too late is large for most
  teams (any in-form player bought mid-season has scored before); watch
  whether it reads as a story or as noise.
- Points breakdown (trim, `/event/{gw}/live/`): bonus points, goals and
  clean sheets by the starting eleven, actual points against xGI ("luck").
- Money: team value growth since GW1 is left out: every team starts on
  £100m, so it would only repeat the team value less 100. Average money in
  the bank is a column.
- Mishaps: points gained from automatic substitutions (from `autoSubs`;
  complete from next season, see the Gameweek section).
- Veterans (trim, `past` in `/entry/{id}/history/`): seasons played, best
  overall rank and best points total in earlier seasons.

## Scout (informed transfers)
- "Pick your team" view: your differentials (you own, few rivals do) and your
  threats (rivals own, you do not).
- Upcoming fixtures and their difficulty per player; blank and double
  gameweeks (fetch `/fixtures/`).
- The league's template eleven.
- Points earned in the league: multiplier times points over every team and
  gameweek ("who carried this league").
- League ownership trend: owners now, last gameweek and GW1; transfers in and
  out within the league this gameweek. Transfer flow: players sold on one
  side, bought on the other, band width the number of teams in the league.
- Price change since the start of the season (`startCost` is loaded, not
  shown).
- Times captained in the league this season.

## Charts (the League History tab, renamed)
The tab is becoming a chart builder. A series is one number per team per
gameweek (`CHART_SERIES` in `leagueHistory.ts`); the visitor picks the
series and the teams to highlight, and both go in the page address, so any
chart is a link. Keep the `/history` address so old links work.
- How to show a series: as it is, running total, against the league
  average, against the leader, as a choice next to the series instead of a
  series of its own.
- More series: team value, money in the bank, bench points, hits, form
  over the last 5 gameweeks, rank in the league that week, captain points,
  unique points.
- One stat against another: one dot per team (hits against total points,
  bench points against position).
- Heatmap: check it on a phone once a league has 20 or more gameweeks
  (the squares then scroll sideways, starting at the latest week). Maybe
  a switch to FPL's overall average instead of the league's.
- Climbs and falls, runs at the top, form and "boom or bust" are on the
  Season tab (`summariseRace()` in `leagueHistory.ts`). Lead changes and
  average position are columns, not cards: they mostly repeat weeks at the
  top and the rank.

## Manager vs manager
- Compare two teams: shared players, each side's unique players, and where
  the points gap came from (gap breakdown: bars for captains, transfers and
  hits, bench, players only one side owns).
- Squad twin: the rival whose squads overlapped most with yours.
- Nemesis and favourite victim: the rival you beat least and most often
  week by week.
- Not planned for now: an ownership web (managers joined by how many players
  their squads share). It reads poorly on a phone and needs a layout
  library.

## What-ifs
- Never made a transfer; always captained the same player.
- All-play-all record, as if the league were head-to-head.

## Usability
- Remember column choices in the browser.
- Sparklines: a small form line in a table column.
- Scout's filters in the URL (the view and sorting already are); CSV export.
- Head-to-head leagues (only classic leagues are supported).

## Post-season screen
- An end-of-season summary for the league: the place for awards, built from
  the outliers already visible in the tables.

## Data to fetch
- `/fixtures/`: one request for the whole season, cached for hours. Upcoming
  fixtures and difficulty per player and per squad (fixture difficulty of
  each team's next 5 gameweeks).
- `/entry/{id}/`: one request per team, but rarely changes, so it can be
  cached for long. Country, favourite club ("supports Spurs, owns no Spurs
  players"), the gameweek the team started, how many leagues it plays in.
  Fun, but costs as much as the history request.
- `/element-summary/{id}/`: one request per player. Too costly league-wide;
  only on demand, for one player's panel in Scout.
