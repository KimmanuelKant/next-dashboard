// src/app/dashboard/[leagueId]/history/page.tsx
import LeagueHistoryView from "@/components/LeagueHistoryView";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Loading from "@/components/Loading";

export const metadata = { title: "Charts" };

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="charts">
      <Suspense fallback={<Loading what="charts" />}>
        <LeagueHistoryView leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
