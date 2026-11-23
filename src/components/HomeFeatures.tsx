// src/components/HomeFeatures.tsx
// What a league's dashboard offers, below the front page's first screen.
// The front page is the only page search engines index (see robots.ts), and
// without this section it holds little more than two input boxes. A server
// component, so the text is in the HTML crawlers read.
import { MAX_MANAGERS } from "@/lib/leagueId";

const features = [
  {
    title: "Scout: differentials and who owns whom",
    text: "Every player, owned in your league or not, with league ownership next to global ownership, effective ownership and captaincy counts. Filter by position, club, price, owner and number of owners to find the differentials your rivals do not have.",
  },
  {
    title: "This Gameweek",
    text: "Live projected scores while matches are played, with bonus points and automatic substitutions as they stand. Each manager's score, captain, chip, transfers in and out, bench points and the points won or lost on the captaincy choice. Earlier gameweeks open too.",
  },
  {
    title: "Season",
    text: "Transfers and hits, chips, captaincy, ranks, points by position, weeks at the top and bottom of the league, favourite club, most-held player, cards and own goals, for every manager.",
  },
  {
    title: "League History",
    text: "A chart and a table of every team's league position and score, gameweek by gameweek: the whole race for your mini-league title.",
  },
];

export default function HomeFeatures() {
  return (
    <section className="container pb-5" aria-labelledby="features-heading">
      <h2 id="features-heading" className="h4 text-center mb-4">
        FPL mini-league stats the official site does not show
      </h2>
      <div className="row g-3">
        {features.map(({ title, text }) => (
          <div key={title} className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h3 className="h6 card-title">{title}</h3>
                <p className="card-text small mb-0">{text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-body-secondary small mt-4 mb-0">
        Free, with no sign-up. Works for any classic Fantasy Premier League
        mini-league; leagues of up to {MAX_MANAGERS} teams load in full.
      </p>
    </section>
  );
}
