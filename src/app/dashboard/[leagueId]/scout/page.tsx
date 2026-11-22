// src/app/dashboard/[leagueId]/scout/page.tsx
import LeaguePlayerStats from "@/components/LeaguePlayerStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Loading from "@/components/Loading";

export const metadata = { title: "Scout" };

export default async function ScoutPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="the scout table">
      <Suspense fallback={<Loading what="the scout table" />}>
        <LeaguePlayerStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
