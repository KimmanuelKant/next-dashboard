// src/app/dashboard/[leagueId]/layout.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import RememberLeague from "@/components/RememberLeague";
import { isValidLeagueId } from "@/lib/leagueId";
import { getLeague } from "@/lib/fpl/sources";
import { PREVIEW_IMAGE, SITE_NAME } from "@/lib/site";

type Params = Promise<{ leagueId: string }>;

async function leagueTitle(leagueId: string): Promise<string | null> {
  try {
    const league = await getLeague(leagueId);
    return league ? league.name : null;
  } catch (error) {
    // FPL is unreachable: still render the page shell with a generic title.
    console.error("Failed to load league name:", error);
    return `League ${leagueId}`;
  }
}

/** Puts the league name in the browser tab and in shared-link previews. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { leagueId } = await params;
  const name = isValidLeagueId(leagueId) ? await leagueTitle(leagueId) : null;
  if (name === null) {
    return {};
  }
  const title = `${name} | ${SITE_NAME}`;
  const description = `Mini-league statistics for ${name}: gameweek scores, season records, differentials and league history.`;
  return {
    // Tab pages set their own name, which fills the %s.
    title: { default: title, template: `%s – ${title}` },
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      images: [PREVIEW_IMAGE],
    },
  };
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { leagueId } = await params;

  if (!isValidLeagueId(leagueId)) {
    notFound();
  }

  const title = await leagueTitle(leagueId);
  if (title === null) {
    notFound();
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center column-gap-3 mb-3">
        <h1 className="h3 mb-0">{title}</h1>
        <div className="d-flex flex-wrap align-items-center column-gap-3 small">
          {/* These read the URL's query string, which needs a Suspense boundary. */}
          <Suspense>
            <RememberLeague leagueId={leagueId} leagueName={title} />
          </Suspense>
          <Link href="/">Change league</Link>
        </div>
      </div>
      <Suspense>
        <DashboardNav leagueId={leagueId} />
      </Suspense>
      <div>{children}</div>
    </div>
  );
}
