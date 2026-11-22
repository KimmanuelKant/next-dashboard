// src/app/dashboard/[leagueId]/gameweek/page.tsx
import LeagueGameweekStats from "@/components/LeagueGameweekStats";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Loading from "@/components/Loading";

export const metadata = { title: "This Gameweek" };

/** The "gw" parameter as a gameweek number; null when missing or not a number. */
function parseGameweek(value: string | string[] | undefined): number | null {
  return typeof value === "string" && /^\d{1,2}$/.test(value) ? Number(value) : null;
}

export default async function GameweekPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ gw?: string | string[] }>;
}) {
  const { leagueId } = await params;
  const { gw } = await searchParams;

  return (
    <ErrorBoundary what="gameweek statistics">
      <Suspense fallback={<Loading what="gameweek statistics" />}>
        <LeagueGameweekStats leagueId={leagueId} requestedGameweek={parseGameweek(gw)} />
      </Suspense>
    </ErrorBoundary>
  );
}
