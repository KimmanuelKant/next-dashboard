// src/app/dashboard/[leagueId]/not-found.tsx
import Link from "next/link";

export default function LeagueNotFound() {
  return (
    <div className="container py-5 text-center">
      <h1 className="h3">League not found</h1>
      <p>
        That league ID does not match a classic Fantasy Premier League league.
        Check the number and try again.
      </p>
      <Link className="btn btn-primary" href="/">
        Enter another league ID
      </Link>
    </div>
  );
}
