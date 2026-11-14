// src/app/dashboard/[leagueId]/team/page.tsx
// Old address of the season table; kept so existing links and bookmarks work.
import { redirect } from "next/navigation";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  redirect(`/dashboard/${encodeURIComponent(leagueId)}/season`);
}
