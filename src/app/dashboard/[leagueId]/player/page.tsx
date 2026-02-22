// src/app/dashboard/[leagueId]/player/page.tsx
import LeaguePlayerStats from "@/components/LeaguePlayerStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

type PageProps = {
  params: Promise<{ leagueId: string }>;
};

export default async function PlayerPage({ params }: PageProps) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading player statistics...</div>}>
        <LeaguePlayerStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}