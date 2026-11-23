// src/components/LeagueGameweekStats.tsx

import { notFound } from "next/navigation";
import GameweekPicker from "@/components/GameweekPicker";
import GameweekStatisticsTable from "@/components/GameweekStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import LiveStatus from "@/components/LiveStatus";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computeGameweekHighlights, computeGameweekStats } from "@/lib/stats/gameweekStats";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeagueGameweekStats({
  leagueId,
  requestedGameweek,
}: {
  leagueId: string;
  /** The gameweek asked for in the address; null for the current one. */
  requestedGameweek: number | null;
}) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }
  // A gameweek that has not been played (a mistyped or stale link) shows the
  // current one instead.
  const gw =
    requestedGameweek !== null && snapshot.gameweekIds.includes(requestedGameweek)
      ? requestedGameweek
      : snapshot.currentGw;
  const gameweek = snapshot.bootstrap.gameweeks.find((g) => g.id === gw);
  const stats = computeGameweekStats(snapshot, gw);

  // The live projection belongs to the current gameweek while FPL has not
  // marked it finished.
  const fixtures = gw === snapshot.currentGw ? snapshot.liveFixtures : null;
  const playing = fixtures?.some((f) => f.started && !f.done) ?? false;
  const nextKickoff =
    fixtures
      ?.filter((f) => !f.started && f.kickoff !== null)
      .map((f) => f.kickoff as string)
      .sort()[0] ?? null;
  const status = fixtures ? (
    <LiveStatus playing={playing} nextKickoff={nextKickoff} updatedAt={snapshot.liveUpdatedAt} />
  ) : gameweek?.finished ? (
    "Final scores."
  ) : (
    "In progress. Scores can still change."
  );

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      {gameweek && (
        <GameweekPicker gameweeks={snapshot.gameweekIds} selected={gameweek.id} status={status} />
      )}
      <GameweekStatisticsTable
        stats={stats}
        highlights={computeGameweekHighlights(stats)}
        leagueName={snapshot.league.name}
        isLive={fixtures !== null}
      />
    </>
  );
}
