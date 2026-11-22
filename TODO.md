# TODO

Stats are organised by what the row is (manager, player, gameweek, pair of
managers) and by the question they answer. "This gameweek" and "season" stats
live on separate tabs. New stats go into the tables as columns and views.

Most stats below are computed from the league snapshot as it is. Those
marked **(trim)** need a field that FPL already sends but `sources.ts`
discards: keep it and raise the cache key's version. Those marked
**(fetch)** need a new request; see "Data to fetch" at the end.

## Getting into a league (first priority)
Most visitors land on the front page and never reach a league. Some type a
team name where the league ID goes.
- Instructions for finding the ID in the FPL phone app, where there is no
  URL to read it from. A large share of visitors are on Android.
- League History chart on a phone: its own height and text size (it is drawn
  at a fixed size and scaled down), highlighting your team and the leader.

## Next stats (best value for the effort)
- Gameweek: swing vs league and unique points.
- Season: seller's remorse.
- Season: manager of the month, and previous seasons (trim).
- Scout: upcoming fixtures (fetch `/fixtures/`).

## Gameweek: stats still to add
- Swing vs league: per player, (your multiplier minus the league's average
  multiplier) times points, summed; and the player who swung the week most.
  A highlight card.
- Unique points: points from players no one else in the league started.
- Score against the league average; starters who blanked (2 points or fewer).
- Vice captain stepped in (the captain did not play).
- Cards, own goals and missed penalties this gameweek (the Season tab has
  them, this tab does not).
- Transfer gain this gameweek: points of players bought minus players sold.
- Automatic substitutions and starters who did not play (trim:
  `automatic_subs` from picks, or `minutes` from `/event/{gw}/live/`).
- Against the global average and highest score; captain against the most
  captained player in the game (trim: `events[]` in bootstrap).

## Season: stats still to add, by group
- Standings: gap to leader, form over the last 5 gameweeks, weeks above the
  league average.
- League race: biggest climb and fall, consistency (standard deviation of
  gameweek scores: "boom or bust").
- League race: manager of the month, from the month ranges in
  `bootstrap.phases` (trim). Monthly wins as a column and a highlight card.
- Chips: chip timing against the league average.
- Captaincy: captain blanks (armband returned 2 points or fewer), vice
  captain saves.
- Transfers: seller's remorse (points scored by players after they were
  sold), bought too late (points a player scored before being bought),
  knee-jerk transfers (sold within 1-2 gameweeks of buying), hits that paid
  off (transfer gain larger than the hit).
- Points breakdown: by club, share of points from the top 3 players.
- Points breakdown (trim, `/event/{gw}/live/`): bonus points, goals and
  clean sheets by the starting eleven, actual points against xGI ("luck").
- Squad habits: template score (how common the squad is in the league),
  players used over the season.
- Money: team value growth since GW1, average money in the bank.
- Mishaps: points lost to automatic substitutions (trim).
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
  out within the league this gameweek.
- Price change since the start of the season (`startCost` is loaded, not
  shown).
- Times captained in the league this season.
- Injured and doubtful players flagged (trim: `status`, `news` and
  `chance_of_playing_next_round` in bootstrap).

## League History
- Lead changes, average position.
- Chart of points behind the leader.

## Manager vs manager
- Compare two teams: shared players, each side's unique players, and where
  the points gap came from.
- Squad twin: the rival whose squads overlapped most with yours.
- Nemesis and favourite victim: the rival you beat least and most often
  week by week.

## What-ifs
- Never made a transfer; always captained the same player.
- All-play-all record, as if the league were head-to-head.

## Usability
- Remember column choices in the browser.
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
