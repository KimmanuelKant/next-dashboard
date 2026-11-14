// src/app/dashboard/[leagueId]/player/page.tsx
import LeaguePlayerStats from "@/components/LeaguePlayerStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="player statistics">
      <Suspense fallback={<div>Loading player statistics...</div>}>
        <LeaguePlayerStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
