// src/app/dashboard/[leagueId]/page.tsx
import { redirect } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  redirect(`/dashboard/${leagueId}/team`);
}