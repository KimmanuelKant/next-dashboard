// src/app/dashboard/[leagueId]/player/page.tsx

import LeaguePlayerStats from '@/components/LeaguePlayerStats';
import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

interface PageProps {
  params: {
    leagueId: string;
  };
}

export default function PlayerPage({ params }: PageProps) {
  const { leagueId } = params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading player statistics...</div>}>
      <LeaguePlayerStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
