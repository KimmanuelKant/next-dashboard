// src/app/dashboard/[leagueId]/team/page.tsx
import LeagueTeamStats from "@/components/LeagueTeamStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="team statistics">
      <Suspense fallback={<div>Loading team statistics...</div>}>
        <LeagueTeamStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
