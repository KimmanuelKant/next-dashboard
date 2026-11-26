// src/components/LeagueGameweekStats.tsx

import { notFound } from "next/navigation";
import GameweekPicker from "@/components/GameweekPicker";
import CopyRecap from "@/components/CopyRecap";
import GameweekStatisticsTable from "@/components/GameweekStatisticsTable";
import LeagueNotices from "@/components/LeagueNotices";
import LiveStatus from "@/components/LiveStatus";
import NowPlaying from "@/components/NowPlaying";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computeGameweekHighlights, computeGameweekStats } from "@/lib/stats/gameweekStats";
import { leagueGameweek } from "@/lib/stats/leagueGameweek";
import { matchTimes } from "@/lib/stats/live";
import { gameweekRecap } from "@/lib/stats/recap";
import { leagueMatches } from "@/lib/stats/matches";

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
  const matches =
    fixtures && gw !== null ? leagueMatches(snapshot, leagueGameweek(snapshot, gw)) : null;
  // The whole game's figures, for scale: FPL's average and highest score,
  // and the player most teams captained.
  const mostCaptained = snapshot.bootstrap.players.find((p) => p.id === gameweek?.mostCaptained);
  const fplFigures =
    gameweek?.averageScore != null
      ? [
          `FPL average ${gameweek.finished ? "" : "so far "}${gameweek.averageScore}`,
          gameweek.highestScore != null ? `highest ${gameweek.highestScore}` : null,
          mostCaptained ? `most captained ${mostCaptained.name}` : null,
        ]
          .filter(Boolean)
          .join(", ") + "."
      : null;
  const status = (
    <>
      {fixtures ? (
        <LiveStatus {...matchTimes(fixtures)} updatedAt={snapshot.liveUpdatedAt} />
      ) : gameweek?.finished ? (
        "Final scores."
      ) : (
        "In progress. Scores can still change."
      )}
      {/* Apart from the line above, which can end in the Refresh button. */}
      {fplFigures && <span className="ms-2">· {fplFigures}</span>}
    </>
  );

  const highlights = computeGameweekHighlights(stats);
  // The same records as the cards, as text for a group chat.
  const recap =
    gameweek && highlights.length > 0 ? (
      <CopyRecap
        lines={gameweekRecap({
          leagueName: snapshot.league.name,
          gw: gameweek.id,
          live: fixtures !== null,
          highlights,
          averageScore: gameweek.averageScore,
          captainsLeft: stats.filter((row) => row.captainLeft).length,
        })}
        path={`/dashboard/${leagueId}/gameweek?gw=${gameweek.id}`}
      />
    ) : null;

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      {gameweek && (
        <GameweekPicker
          gameweeks={snapshot.gameweekIds}
          selected={gameweek.id}
          status={status}
          action={recap}
        />
      )}
      {matches && <NowPlaying {...matches} />}
      <GameweekStatisticsTable
        stats={stats}
        highlights={highlights}
        leagueName={snapshot.league.name}
        isLive={fixtures !== null}
        fplAverage={gameweek?.averageScore ?? null}
      />
    </>
  );
}
