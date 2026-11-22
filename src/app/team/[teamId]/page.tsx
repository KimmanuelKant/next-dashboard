// src/app/team/[teamId]/page.tsx
// Lists the classic leagues a team plays in, for visitors who know their
// team ID but not the league ID.
import Link from "next/link";
import { getTeamLeagues } from "@/lib/fpl/sources";
import type { TeamLeague, TeamLeagues } from "@/lib/fpl/types";
import { MAX_MANAGERS } from "@/lib/leagueId";
import { isValidTeamId } from "@/lib/teamId";

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="container py-5 text-center">
      <h1 className="h3">{title}</h1>
      <p>{text}</p>
      <Link className="btn btn-primary" href="/">
        Back to the front page
      </Link>
    </div>
  );
}

function LeagueList({ leagues, teamId }: { leagues: TeamLeague[]; teamId: string }) {
  return (
    <div className="list-group mb-4">
      {leagues.map((league) => (
        <Link
          key={league.id}
          // The team ID goes along so the league pages can highlight this team.
          href={`/dashboard/${league.id}/gameweek?team=${teamId}`}
          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-3"
        >
          <span>{league.name}</span>
          <span className="text-secondary small text-end">
            {league.rank !== null &&
              `Rank ${league.rank.toLocaleString("en-GB")}${
                league.size ? ` of ${league.size.toLocaleString("en-GB")}` : ""
              }`}
            {league.size !== null && league.size > MAX_MANAGERS && (
              <>
                <br />
                top {MAX_MANAGERS} shown
              </>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function TeamLeaguesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const notFound = (
    <Message
      title="Team not found"
      text="That team ID does not match a Fantasy Premier League team. Check the number and try again."
    />
  );
  if (!isValidTeamId(teamId)) {
    return notFound;
  }

  let team: TeamLeagues | null;
  try {
    team = await getTeamLeagues(teamId);
  } catch (error) {
    console.error("Failed to load team leagues:", error);
    return (
      <Message
        title="Could not reach FPL"
        text="The Fantasy Premier League site did not answer. Try again in a minute."
      />
    );
  }
  if (!team) {
    return notFound;
  }

  const own = team.leagues.filter((l) => !l.general);
  const general = team.leagues.filter((l) => l.general);

  return (
    <div className="container py-4" style={{ maxWidth: "640px" }}>
      <h1 className="h3 mb-1">{team.teamName}</h1>
      <p className="text-secondary">{team.managerName}</p>

      <h2 className="h5">Choose a league</h2>
      {own.length > 0 ? (
        <LeagueList leagues={own} teamId={teamId} />
      ) : (
        <p>This team is not in any private or public classic league.</p>
      )}

      {general.length > 0 && (
        <>
          <h2 className="h5">General leagues</h2>
          <LeagueList leagues={general} teamId={teamId} />
        </>
      )}

      <Link href="/">Enter another ID</Link>
    </div>
  );
}
