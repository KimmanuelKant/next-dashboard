// src/app/dashboard/[leagueId]/gameweek/page.tsx
import LeagueGameweekStats from "@/components/LeagueGameweekStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = { title: "This Gameweek" };

export default async function GameweekPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  return (
    <ErrorBoundary what="gameweek statistics">
      <Suspense fallback={<div>Loading gameweek statistics...</div>}>
        <LeagueGameweekStats leagueId={leagueId} />
      </Suspense>
    </ErrorBoundary>
  );
}
