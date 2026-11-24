// src/lib/site.ts
// Shared values for page titles, link previews and search engines.

export const SITE_NAME = "MyFPL.net";
export const SITE_URL = "https://www.myfpl.net";

/**
 * The front page's title and description, which search results show. They
 * lead with the words people search for ("FPL mini-league stats",
 * "differentials"). The title stays under about 60 characters and the
 * description under about 160, the lengths Google shows before cutting off.
 */
export const SITE_TITLE = "FPL Mini-League Stats and Differentials | MyFPL.net";
export const SITE_DESCRIPTION =
  "Free Fantasy Premier League mini-league stats: find differentials, see who owns whom, compare captains, chips and transfers, and chart your league's race.";

/**
 * The site's own classic league in FPL, which visitors are invited to join
 * from the front page. Once it has enough teams to show the site at its
 * best, it becomes the example league linked from the front page too. The
 * code is also for typing in the FPL phone app (Leagues, Join a league).
 */
export const MYFPL_LEAGUE = {
  id: "2504598",
  code: "sfcd6q",
  joinUrl: "https://fantasy.premierleague.com/leagues/auto-join/sfcd6q",
};

/**
 * Image shown when a link to the site is shared: the logo on the site's dark
 * background, at the 1200x630 size chat apps and social sites show large.
 */
export const PREVIEW_IMAGE = {
  url: "/preview.png",
  width: 1200,
  height: 630,
  alt: "MyFPL.net logo",
};
