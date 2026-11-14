// src/app/dashboard/[leagueId]/history/page.tsx
import LeagueHistoryView from "@/components/LeagueHistoryView";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="league history">
      <Suspense fallback={<div>Loading league history...</div>}>
        <LeagueHistoryView leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
