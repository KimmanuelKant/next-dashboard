// src/app/dashboard/[leagueId]/awards/page.tsx
// Old address of the awards tab; kept so existing links and bookmarks work.
import { redirect } from "next/navigation";

export default async function AwardsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  redirect(`/dashboard/${encodeURIComponent(leagueId)}/season`);
}
