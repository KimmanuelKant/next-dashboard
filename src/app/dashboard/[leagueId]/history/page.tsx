// src/app/dashboard/[leagueId]/history/page.tsx
import LeagueHistoryView from "@/components/LeagueHistoryView";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Loading from "@/components/Loading";

export const metadata = { title: "League History" };

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="league history">
      <Suspense fallback={<Loading what="league history" />}>
        <LeagueHistoryView leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
