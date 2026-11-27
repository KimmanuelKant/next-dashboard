// src/components/HomeFeatures.tsx
// What a league's dashboard offers, below the front page's first screen.
// The front page is the only page search engines index (see robots.ts), and
// without this section it holds little more than two input boxes. A server
// component, so the text is in the HTML crawlers read.
import { MAX_MANAGERS } from "@/lib/leagueId";

const features = [
  {
    title: "Scout: differentials and who owns whom",
    text: "Every player, owned in your league or not, with league ownership next to global ownership, effective ownership and captaincy counts. Injured and doubtful players are marked with FPL's news. Filter by position, club, price, owner and number of owners to find the differentials your rivals do not have.",
  },
  {
    title: "This Gameweek",
    text: "Live projected scores while matches are played, with bonus points and automatic substitutions as they stand. Each manager's score, captain, chip, transfers in and out, bench points and the points won or lost on the captaincy choice. Earlier gameweeks open too.",
  },
  {
    title: "Season",
    text: "Form over the last five gameweeks, the biggest climbs and falls in the table, longest runs at the top, who is boom or bust, manager of the month, each rival's free transfers and chips left, transfers and hits, seller's remorse, players bought too late, knee-jerk sales, chip timing, captain blanks, template scores, ranks, points by position and club, cards and own goals, for every manager.",
  },
  {
    title: "Charts: the race for the title",
    text: "Every team's league position, gap to the leader, total points, gameweek score and overall rank, gameweek by gameweek, with your rivals highlighted, and a heatmap of every team's hot and cold weeks against the league average. Pick a chart and the teams to compare, and share the link.",
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
