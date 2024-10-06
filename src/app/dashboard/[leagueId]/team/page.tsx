// src/app/dashboard/[leagueId]/team/page.tsx
import TeamStatistics from "@/components/TeamStatistics";
import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function TeamPage({ params }: { params: { leagueId: string } }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading team statistics...</div>}>
        <TeamStatistics leagueId={params.leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
