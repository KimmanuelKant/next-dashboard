// src/app/dashboard/[leagueId]/team/page.tsx
import LeagueTeamStats from "@/components/LeagueTeamStats";
import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function TeamPage({ params }: { params: { leagueId: string } }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading team statistics...</div>}>
        <LeagueTeamStats leagueId={params.leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
