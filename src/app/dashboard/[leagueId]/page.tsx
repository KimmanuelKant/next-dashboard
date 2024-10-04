// src/app/dashboard/[leagueId]/page.tsx
import { redirect } from 'next/navigation';

export default function DashboardPage({ params }: { params: { leagueId: string } }) {
  redirect(`/dashboard/${params.leagueId}/team`);
}
