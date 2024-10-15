// src/app/dashboard/[leagueId]/player/page.tsx

import PlayerStatistics from '@/components/PlayerStatistics';

interface PageProps {
  params: {
    leagueId: string;
  };
}

export default function PlayerPage({ params }: PageProps) {
  const { leagueId } = params;

  return (
    <div>
      <PlayerStatistics leagueId={leagueId} />
    </div>
  );
}
