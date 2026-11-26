// src/components/LeagueHistoryView.tsx

import { notFound } from "next/navigation";
import LeagueNotices from "@/components/LeagueNotices";
import LeagueChart from "@/components/LeagueChart";
import LeagueHeatmap from "@/components/LeagueHeatmap";
import LeagueHistoryTable from "@/components/LeagueHistoryTable";
import { getLeagueSnapshot } from "@/lib/fpl/snapshot";
import { computeLeagueHistory } from "@/lib/stats/leagueHistory";

// Errors thrown here are caught by the ErrorBoundary in the page.
export default async function LeagueHistoryView({ leagueId }: { leagueId: string }) {
  const snapshot = await getLeagueSnapshot(leagueId);
  if (!snapshot) {
    notFound();
  }
  const history = computeLeagueHistory(snapshot);

  return (
    <>
      <LeagueNotices snapshot={snapshot} />
      <LeagueChart history={history} />
      <LeagueHeatmap history={history} />
      <h2 className="h5">Week by week</h2>
      <LeagueHistoryTable history={history} />
    </>
  );
}
