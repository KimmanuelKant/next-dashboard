// src/app/dashboard/[leagueId]/team/page.tsx
import LeagueTeamStats from "@/components/LeagueTeamStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

type PageProps = {
  params: Promise<{ leagueId: string }>;
};

export default async function TeamPage({ params }: PageProps) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading team statistics...</div>}>
        <LeagueTeamStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}