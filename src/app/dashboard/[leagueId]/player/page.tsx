// src/app/dashboard/[leagueId]/player/page.tsx
import PlayerStatistics from "@/components/PlayerStatistics";

export default function PlayerPage({ params }: { params: { leagueId: string } }) {
  return <PlayerStatistics leagueId={params.leagueId} />;
}
