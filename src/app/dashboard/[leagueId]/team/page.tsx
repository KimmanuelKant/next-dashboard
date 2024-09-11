// src/app/dashboard/[leagueId]/team/page.tsx
import TeamStatistics from "@/components/TeamStatistics";

export default function TeamPage({ params }: { params: { leagueId: string } }) {
  return <TeamStatistics leagueId={params.leagueId} />;
}
