// src/components/LeagueGameweekStats.tsx

import { notFound } from "next/navigation";
import GameweekStatisticsTable from "@/components/GameweekStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computeGameweekStats } from "@/lib/stats/gameweekStats";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeagueGameweekStats({ leagueId }: { leagueId: string }) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }
  const gameweek = snapshot.bootstrap.gameweeks.find((g) => g.id === snapshot.currentGw);

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      {gameweek && (
        <p className="text-secondary small">
          Gameweek {gameweek.id}
          {gameweek.finished ? ", final scores." : ", in progress. Scores can still change."}
        </p>
      )}
      <GameweekStatisticsTable stats={computeGameweekStats(snapshot)} />
    </>
  );
}
