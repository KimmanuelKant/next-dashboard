// src/lib/stats/recap.ts
// A gameweek in a few lines of text, for a league's group chat: built from
// the same records as the highlight cards, so it tells the stories that
// stood out. Visitors posting odd stats in their chats is how the site is
// found, so the recap ends with a link to the page.

import type { GameweekHighlight } from "./gameweekStats";

export interface RecapInput {
  leagueName: string;
  gw: number;
  /** The gameweek is being played: nothing is won yet. */
  live: boolean;
  /** The records shown as cards, in their order. */
  highlights: GameweekHighlight[];
  /** FPL's average score this gameweek, for scale; null when unknown. */
  averageScore: number | null;
  /** While live: how many teams still have their captain to play. */
  captainsLeft: number;
}

/** "Ann", "Ann and Bo", "Ann, Bo and Cy", "Ann, Bo and 2 others". */
export function teamList(teams: string[]): string {
  if (teams.length <= 1) return teams[0] ?? "";
  if (teams.length <= 3) return `${teams.slice(0, -1).join(", ")} and ${teams[teams.length - 1]}`;
  return `${teams.slice(0, 2).join(", ")} and ${teams.length - 2} others`;
}

const pts = (value: number) => `${value} pt${value === 1 ? "" : "s"}`;
const places = (value: number) => `${value} place${value === 1 ? "" : "s"}`;

/** One line for a record. */
function recapLine(record: GameweekHighlight, input: RecapInput): string {
  const who = teamList(record.teams);
  const shared = record.teams.length > 1;
  const { value, detail } = record;
  switch (record.kind) {
    case "winner": {
      const average =
        input.averageScore !== null
          ? ` (FPL average ${input.live ? "so far " : ""}${input.averageScore})`
          : "";
      if (input.live) return `${who} top so far with ${value}${average}.`;
      return `${who} ${shared ? "shared the win" : "won"} with ${value}${average}.`;
    }
    case "lowest":
      return input.live ? `${who} bottom so far with ${value}.` : `${who} lowest with ${value}.`;
    case "climber":
      return input.live
        ? `${who} up ${places(value)} so far.`
        : `${who} climbed ${places(value)}.`;
    case "captaincy":
      return `${who} lost ${pts(value)} to the captain choice.`;
    case "bench":
      return `${who} left ${pts(value)} on the bench.`;
    case "hit":
      return `${who} took a −${value} hit.`;
    case "swing":
      return `${detail ?? "One player"} won ${who} ${pts(value)} against the league.`;
    case "swingAgainst":
      return `${detail ?? "One player"} cost ${who} ${pts(value)} against the league.`;
    case "unique":
      return `${who} scored ${pts(value)} from players nobody else had.`;
    case "transfers":
      return `${who} gained ${pts(value)} from transfers, after hits.`;
    case "transfersBackfired":
      return `${who} lost ${pts(value)} on transfers, after hits.`;
  }
}

/** The recap's lines, without the link (the browser adds it, knowing the address). */
export function gameweekRecap(input: RecapInput): string[] {
  const heading = `${input.leagueName}, GW${input.gw}${input.live ? " so far" : ""}:`;
  const lines = input.highlights.map((record) => recapLine(record, input));
  if (input.live && input.captainsLeft > 0) {
    lines.push(
      input.captainsLeft === 1
        ? "1 team still has its captain to play."
        : `${input.captainsLeft} teams still have their captain to play.`
    );
  }
  return [heading, ...lines];
}
