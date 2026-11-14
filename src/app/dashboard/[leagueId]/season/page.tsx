// src/app/dashboard/[leagueId]/season/page.tsx
import LeagueTeamStats from "@/components/LeagueTeamStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = { title: "Season" };

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="season statistics">
      <Suspense fallback={<div>Loading season statistics...</div>}>
        <LeagueTeamStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
