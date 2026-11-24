// src/app/dashboard/[leagueId]/opengraph-image.tsx
// The picture shown when a league's link is pasted into a chat: the
// league's name, its leader and the gameweek's top score, so the preview
// itself tells the league something. It applies to every tab of the league.
//
// It is drawn from the standings and bootstrap alone (both cached, one or
// two requests), never from the full league snapshot: a link preview must
// not cost a full league load, and an old link can be shared at any time.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getBootstrap, getLeague } from "@/lib/fpl/sources";
import { isValidLeagueId } from "@/lib/leagueId";
import { teamList } from "@/lib/stats/recap";

export const alt = "The league's leader and this gameweek's top score, on MyFPL.net";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// The route is drawn on request (the league is in the address), so the
// picture is kept by Vercel's CDN for ten minutes instead: a link shared in
// a busy chat is fetched by many previews at once. Chat apps keep their own
// copy of a preview, often for much longer, so fresher would not show.
const CACHE_CONTROL = "public, max-age=600, s-maxage=600";

const logoSrc = `data:image/png;base64,${await readFile(
  join(process.cwd(), "public/myfplnetlogo.png"),
  "base64"
)}`;
// The site's generic picture, for a league that does not exist.
const genericPreview = await readFile(join(process.cwd(), "public/preview.png"));

// The site's dark theme (Bootstrap's dark body and secondary text).
const BACKGROUND = "#212529";
const TEXT = "#f8f9fa";
const MUTED = "#adb5bd";
const BORDER = "#495057";

function Stat({ label, teams, value }: { label: string; teams: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "20px 24px",
        border: `2px solid ${BORDER}`,
        borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 24, color: MUTED, textTransform: "uppercase", letterSpacing: 2 }}>
        {label}
      </div>
      {/* Long names (or several teams level) get a smaller size. */}
      <div
        style={{
          fontSize: teams.length > 40 ? 26 : teams.length > 22 ? 31 : 38,
          color: TEXT,
          marginTop: 8,
          lineHeight: 1.15,
        }}
      >
        {teams}
      </div>
      <div style={{ fontSize: 30, color: MUTED, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  // A failed request to FPL throws: the error is not kept as this league's picture.
  const league = isValidLeagueId(leagueId) ? await getLeague(leagueId) : null;
  if (!league) {
    return new Response(new Uint8Array(genericPreview), {
      headers: { "Content-Type": "image/png", "Cache-Control": CACHE_CONTROL },
    });
  }
  const bootstrap = await getBootstrap();
  const gameweek = bootstrap.gameweeks.find((g) => g.isCurrent);
  const managers = league.managers;

  const leaders = managers.filter((m) => m.rank === 1);
  // The standings carry each team's points in the current gameweek, before hits.
  const topScore = Math.max(0, ...managers.map((m) => m.eventTotal));
  const topScorers = managers.filter((m) => m.eventTotal === topScore);
  const points = (value: number) => `${value.toLocaleString("en-GB")} pts`;
  // Long names get a smaller size, so that they fit in two lines.
  const nameSize = league.name.length > 40 ? 52 : league.name.length > 24 ? 62 : 74;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: BACKGROUND,
          padding: 56,
          alignItems: "center",
          gap: 48,
        }}
      >
        {/* ImageResponse draws plain elements; next/image does not work here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={300} height={292} alt="" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <div style={{ fontSize: nameSize, color: TEXT, lineHeight: 1.1 }}>{league.name}</div>
          {gameweek && leaders.length > 0 && (
            <div style={{ display: "flex", gap: 24 }}>
              <Stat
                label="Leader"
                teams={teamList(leaders.map((m) => m.teamName))}
                value={points(leaders[0].total)}
              />
              {topScore > 0 && (
                <Stat
                  label={`GW${gameweek.id} ${gameweek.finished ? "top score" : "so far"}`}
                  teams={teamList(topScorers.map((m) => m.teamName))}
                  value={points(topScore)}
                />
              )}
            </div>
          )}
          <div style={{ fontSize: 26, color: MUTED }}>
            Differentials, swings and records on MyFPL.net
          </div>
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
