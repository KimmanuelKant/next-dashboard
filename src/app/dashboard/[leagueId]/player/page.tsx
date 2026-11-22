// src/app/dashboard/[leagueId]/player/page.tsx
// Old address of the Scout table; kept so existing links and bookmarks work.
import { redirect } from "next/navigation";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  redirect(`/dashboard/${encodeURIComponent(leagueId)}/scout`);
}
