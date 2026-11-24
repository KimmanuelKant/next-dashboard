// src/components/GameweekStatisticsTable.tsx
"use client";
import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { ColumnGroup, Preset } from "@/components/DataTable";
import { HighlightCard, toHighlight } from "@/components/Highlights";
import MyTeamButton from "@/components/MyTeamButton";
import Narrow from "@/components/Narrow";
import type { ChangeTracking } from "@/lib/liveChanges";
import type { GameweekHighlight, GameweekStats } from "@/lib/stats/gameweekStats";
import { useMyTeamId } from "@/lib/myTeam";

const columnHelper = createColumnHelper<GameweekStats>();

const formatNumber = (value: number | null) =>
  value === null ? "–" : value.toLocaleString("en-GB");
const formatNamed = (item: { name: string; count: number } | null) =>
  item ? `${item.name} (${item.count})` : "–";
/** "+12", "−3.5" (a true minus sign), "0"; "–" when unknown. */
function formatSigned(value: number | undefined) {
  if (value === undefined) return "–";
  const size = Math.abs(value).toLocaleString("en-GB", { maximumFractionDigits: 1 });
  return value > 0 ? `+${size}` : value < 0 ? `−${size}` : "0";
}
/** Points behind; nothing to show for the team in front. */
const formatGap = (value: number | undefined) => (value ? String(value) : "–");
const formatList = (items: string[]) => items.join(", ") || "–";
/** "Palmer (+9.6)", "Haaland (−7)". */
const formatSwing = (item: { name: string; count: number } | null) =>
  item ? `${item.name} (${formatSigned(item.count)})` : "–";

/**
 * Points ahead of (+) or behind (−) the visitor's own team on the total.
 * Built in the browser, where the visitor's team is known; without one,
 * every cell is empty.
 */
function vsYouColumn(myTotal: number | null, myTeam: number | null) {
  return columnHelper.accessor(
    (row) => (myTotal === null || row.total === null ? undefined : row.total - myTotal),
    {
      id: "vsYou",
      header: "Vs Your Team",
      cell: ({ row, getValue }) =>
        row.original.teamId === myTeam ? "You" : formatSigned(getValue()),
      sortUndefined: "last",
    }
  );
}

/** Places gained or lost, for the change and the projected change. */
function formatChange(change: number | null) {
  if (change === null) return "–";
  if (change === 0) return <Narrow short="–">No change</Narrow>;
  // The arrow's shape shows the direction, so it never depends on colour
  // alone. Phones get the arrow and number only, to keep the column narrow.
  return change > 0 ? (
    <span className="text-success-emphasis">
      <Narrow short={`▲${change}`}>▲ Up {change}</Narrow>
    </span>
  ) : (
    <span className="text-danger-emphasis">
      <Narrow short={`▼${-change}`}>▼ Down {-change}</Narrow>
    </span>
  );
}

const columns = [
  columnHelper.accessor("position", {
    id: "position",
    header: "Position",
    // "3=" for teams level on points. Without the mark, a team that draws
    // level shows "Up 1" while every other row says "No change".
    cell: ({ row }) => `${row.original.position}${row.original.positionTied ? "=" : ""}`,
  }),
  columnHelper.accessor((row) => row.positionChange ?? 0, {
    id: "positionChange",
    header: "Change",
    cell: ({ row }) => formatChange(row.original.positionChange),
  }),
  columnHelper.accessor((row) => row.projectedPosition ?? undefined, {
    id: "projectedPosition",
    header: "Projected Position",
    cell: ({ row }) =>
      row.original.projectedPosition === null
        ? "–"
        : `${row.original.projectedPosition}${row.original.projectedPositionTied ? "=" : ""}`,
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.projectedPositionChange ?? undefined, {
    id: "projectedPositionChange",
    header: "Projected Change",
    cell: ({ row }) => formatChange(row.original.projectedPositionChange),
    sortUndefined: "last",
  }),
  columnHelper.accessor("teamName", { id: "teamName", header: "Team Name" }),
  columnHelper.accessor("managerName", { id: "managerName", header: "Manager Name" }),
  // Next to the name, so that a phone shows them without scrolling.
  columnHelper.accessor((row) => row.projectedScore ?? undefined, {
    id: "projectedScore",
    header: "Projected Score",
    cell: ({ getValue }) => getValue() ?? "–",
    sortUndefined: "last",
  }),
  // Sorted with the multipliers counted, so that "3 (C)" comes above "3".
  columnHelper.accessor((row) => row.multipliedLeft ?? undefined, {
    id: "playersLeft",
    header: "Players Left",
    cell: ({ row }) =>
      row.original.playersLeft === null
        ? "–"
        : `${row.original.playersLeft}${row.original.captainLeft ? " (C)" : ""}`,
    sortUndefined: "last",
  }),
  columnHelper.accessor("score", { id: "score", header: "GW Score" }),
  columnHelper.accessor("hit", {
    id: "hit",
    header: "Hit",
    cell: ({ getValue }) => (getValue() ? `-${getValue()}` : "0"),
  }),
  columnHelper.accessor("netScore", { id: "netScore", header: "Score After Hit" }),
  columnHelper.accessor((row) => row.vsAverage ?? undefined, {
    id: "vsAverage",
    header: "Vs League Average",
    cell: ({ getValue }) => formatSigned(getValue()),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.vsGlobalAverage ?? undefined, {
    id: "vsGlobalAverage",
    header: "Vs FPL Average",
    cell: ({ getValue }) => formatSigned(getValue()),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.gapToLeader ?? undefined, {
    id: "gapToLeader",
    header: "Gap to Leader",
    cell: ({ getValue }) => formatGap(getValue()),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.gapToAbove ?? undefined, {
    id: "gapToAbove",
    header: "Gap to Team Above",
    cell: ({ getValue }) => formatGap(getValue()),
    sortUndefined: "last",
  }),
  vsYouColumn(null, null),
  columnHelper.accessor((row) => row.provisionalBonus ?? undefined, {
    id: "provisionalBonus",
    header: "Provisional Bonus",
    cell: ({ getValue }) => {
      const value = getValue();
      return value === undefined ? "–" : value > 0 ? `+${value}` : "0";
    },
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.automaticSubPoints ?? undefined, {
    id: "automaticSubs",
    header: "Automatic Subs",
    cell: ({ row }) => {
      const { automaticSubs, automaticSubPoints } = row.original;
      // Null: not known (see GameweekStats).
      if (automaticSubs.length === 0) return automaticSubPoints === 0 ? "None" : "–";
      const gain = automaticSubPoints ? ` (+${automaticSubPoints})` : "";
      return automaticSubs.join(", ") + gain;
    },
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.projectedTotal ?? undefined, {
    id: "projectedTotal",
    header: "Projected Total",
    cell: ({ getValue }) => formatNumber(getValue() ?? null),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.stillToPlay.length, {
    id: "stillToPlay",
    header: "Still to Play",
    cell: ({ row }) => row.original.stillToPlay.join(", ") || "–",
  }),
  columnHelper.accessor((row) => row.leagueGameweekRank ?? undefined, {
    id: "leagueGameweekRank",
    header: "League GW Rank",
    cell: ({ getValue }) => getValue() ?? "–",
    sortUndefined: "last",
  }),
  columnHelper.accessor("gameweekRank", {
    id: "gameweekRank",
    header: "Global GW Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("overallRank", {
    id: "overallRank",
    header: "Overall Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("captain", {
    id: "captain",
    header: "Captain",
    cell: ({ getValue }) => getValue() || "–",
  }),
  columnHelper.accessor("viceCaptain", {
    id: "viceCaptain",
    header: "Vice Captain",
    cell: ({ getValue }) => getValue() || "–",
  }),
  columnHelper.accessor((row) => (row.viceStepIn ? 1 : 0), {
    id: "viceStepIn",
    header: "Vice Stepped In",
    cell: ({ row }) => (row.original.viceStepIn ? "Yes" : "–"),
  }),
  columnHelper.accessor("captainPoints", { id: "captainPoints", header: "Captain Points" }),
  columnHelper.accessor((row) => row.bestCaptain?.count ?? 0, {
    id: "bestCaptain",
    header: "Best Captain Option",
    cell: ({ row }) => formatNamed(row.original.bestCaptain),
  }),
  columnHelper.accessor("captaincyPointsLost", { id: "captaincyPointsLost", header: "Captaincy Points Lost" }),
  columnHelper.accessor((row) => row.vsMostCaptained ?? undefined, {
    id: "vsMostCaptained",
    header: "Vs FPL's Top Captain",
    cell: ({ getValue }) => formatSigned(getValue()),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.chip ?? "", {
    id: "chip",
    header: "Chip",
    cell: ({ row }) => row.original.chip ?? "–",
  }),
  columnHelper.accessor("transfers", { id: "transfers", header: "Transfers" }),
  columnHelper.accessor((row) => row.transferGain ?? undefined, {
    id: "transferGain",
    header: "Transfer Gain",
    cell: ({ getValue }) => formatSigned(getValue()),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.transferGainAfterHit ?? undefined, {
    id: "transferGainAfterHit",
    header: "Gain After Hit",
    cell: ({ getValue }) => formatSigned(getValue()),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.transferOutcomes.length, {
    id: "transferOutcomes",
    header: "Each Transfer",
    cell: ({ row }) => formatList(row.original.transferOutcomes),
  }),
  columnHelper.accessor((row) => row.teamValue ?? undefined, {
    id: "teamValue",
    header: "Team Value",
    cell: ({ getValue }) => {
      const value = getValue();
      return value === undefined ? "–" : `£${value.toFixed(1)}m`;
    },
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.valueChange ?? undefined, {
    id: "valueChange",
    header: "Value Change",
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === undefined) return "–";
      if (value === 0) return <Narrow short="0">No change</Narrow>;
      return `${value > 0 ? "+" : "-"}£${Math.abs(value).toFixed(1)}m`;
    },
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.playersIn.length, {
    id: "playersIn",
    header: "Players In",
    cell: ({ row }) => row.original.playersIn.join(", ") || "–",
  }),
  columnHelper.accessor((row) => row.playersOut.length, {
    id: "playersOut",
    header: "Players Out",
    cell: ({ row }) => row.original.playersOut.join(", ") || "–",
  }),
  columnHelper.accessor("benchPoints", { id: "benchPoints", header: "Points on Bench" }),
  columnHelper.accessor((row) => row.topBenched?.count ?? -Infinity, {
    id: "topBenched",
    header: "Top Benched Player",
    cell: ({ row }) => formatNamed(row.original.topBenched),
  }),
  columnHelper.accessor((row) => row.bestPlayer?.count ?? -Infinity, {
    id: "bestPlayer",
    header: "Best Player",
    cell: ({ row }) => formatNamed(row.original.bestPlayer),
  }),
  columnHelper.accessor((row) => row.blanks.length, {
    id: "blanks",
    header: "Blanks",
    cell: ({ row }) => formatList(row.original.blanks),
  }),
  columnHelper.accessor((row) => row.notReplaced.length, {
    id: "notReplaced",
    header: "Not Replaced",
    cell: ({ row }) => formatList(row.original.notReplaced),
  }),
  columnHelper.accessor("mishapCount", {
    id: "mishaps",
    header: "Cards and Mistakes",
    cell: ({ row }) => formatList(row.original.mishaps),
  }),
  columnHelper.accessor((row) => row.swingGain?.count ?? undefined, {
    id: "swingGain",
    header: "Biggest Swing For",
    cell: ({ row }) => formatSwing(row.original.swingGain),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.swingLoss?.count ?? undefined, {
    id: "swingLoss",
    header: "Biggest Swing Against",
    cell: ({ row }) => formatSwing(row.original.swingLoss),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.uniquePoints ?? undefined, {
    id: "uniquePoints",
    header: "Unique Points",
    cell: ({ getValue }) => getValue() ?? "–",
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.uniquePlayers.length, {
    id: "uniquePlayers",
    header: "Unique Players",
    cell: ({ row }) => formatList(row.original.uniquePlayers),
  }),
];

const descriptions: Record<string, string> = {
  position: "The team's position in this league after this gameweek. Teams level on points share a position, marked with =.",
  positionChange: "Places gained or lost in this league since the previous gameweek. A team that draws level on points with the one above moves up, while the team it joins stays where it was.",
  teamName: "The name of the team.",
  managerName: "The name of the team manager.",
  score: "Points scored this gameweek, before transfer hits.",
  hit: "Points deducted for extra transfers this gameweek.",
  netScore: "Points scored this gameweek after transfer hits.",
  vsAverage: "Points above (+) or below (−) the league's average score this gameweek, after hits. Only teams that played this gameweek count towards the average. While the gameweek is played, the projected score against the average projected score.",
  gapToLeader: "Points behind the league's leader on the season total after this gameweek. While the gameweek is played, on the projected totals.",
  gapToAbove: "Points behind the nearest team above in the league on the season total after this gameweek: what it takes to climb a place. While the gameweek is played, on the projected totals.",
  vsYou: "Points ahead of (+) or behind (−) your own team on the season total after this gameweek; on the projected totals while it is played. Select your team in the table and mark it as yours to fill this column.",
  blanks: "Players who counted for the team, played, and scored 2 points or fewer, once their matches are over. While the gameweek is played, the provisional bonus counts.",
  notReplaced: "Starters who did not play and whom no substitute replaced, so their place scored nothing. While the gameweek is played, shown once no substitute is left to play.",
  mishaps: "Yellow and red cards, own goals and missed penalties of the players who counted for the team this gameweek.",
  swingGain: "The player who won the team the most points against the rest of the league this gameweek: his points times how much more he counted for this team than for the league's average team. A captain few others had, or a player few others started. While the gameweek is played, with the provisional bonus and the projected substitutions.",
  swingLoss: "The player who cost the team the most points against the rest of the league: one the league had and this team did not start, or captained less. A team's swings added up are its score before hits less the league's average.",
  uniquePoints: "Points, with the captain's multiplier, from players who counted for this team and for no other team in the league this gameweek.",
  uniquePlayers: "The players counted in Unique Points, with the points each brought.",
  projectedPosition: "The team's position in this league if the gameweek ended with the projected scores. Teams level on points share a position, marked with =.",
  projectedPositionChange: "Places the team would gain or lose this gameweek if it ended with the projected scores, compared with its position before the gameweek.",
  provisionalBonus: "Bonus points the team's players would get if their matches ended now, from FPL's bonus points system. FPL adds the bonus shortly after each match; until then it is not in the score. Doubled for the captain.",
  automaticSubs: "Substitutes who came on for starters who did not play, and the armband passing to the vice captain when the captain did not play. In brackets, the points they added. While the gameweek is played, the ones FPL would make now: in bench order and keeping a valid formation, as FPL does after the last match. Not known for some earlier gameweeks.",
  vsGlobalAverage: "Points above (+) or below (−) the average score of every FPL team this gameweek, after hits. While the gameweek is played, the projected score against FPL's average so far.",
  vsMostCaptained: "The armband's points against what FPL's most captained player scored with the same armband. Plus when going against the crowd paid off; 0 for a team that captained him.",
  projectedScore: "This gameweek's score after hits, with the provisional bonus and the automatic substitutions added. It changes while matches are being played; a mark such as +6 shows how it changed at the last update, and teams that changed glow briefly.",
  playersLeft: "Players who count for the team and whose match has not finished: still to kick off, or being played. (C) when the one with the armband is among them; sorting counts him twice (three times with Triple Captain).",
  projectedTotal: "The team's season total with the projected score for this gameweek.",
  stillToPlay: "The players counted in Players Left, by name. (C) marks the one with the armband.",
  leagueGameweekRank: "Where this gameweek's score (after hits) ranks within the league.",
  gameweekRank: "Where this gameweek's score ranks among all FPL managers.",
  overallRank: "The team's overall rank among all FPL managers after this gameweek.",
  captain: "The player chosen as captain.",
  viceCaptain: "The player chosen as vice captain.",
  viceStepIn: "Yes when the captain did not play and the armband passed to the vice captain. While the gameweek is played, also when it is about to pass: the captain's matches are over without him playing, and the vice captain has played.",
  captainPoints: "Points from the armband this gameweek, including the multiplier. The vice captain's if the captain did not play.",
  bestCaptain: "The highest-scoring player in the starting eleven, with their points before any multiplier.",
  captaincyPointsLost: "Points lost by not giving the armband to the highest-scoring starter.",
  chip: "The chip played this gameweek, if any.",
  transfers: "Transfers made for this gameweek.",
  teamValue: "Squad value including money in the bank.",
  valueChange: "How much the squad value (including the bank) went up or down since the previous gameweek.",
  playersIn: "Players in the squad this gameweek who were not in it the gameweek before. After a Free Hit, the comparison is with the squad before it.",
  playersOut: "Players who were in the squad the gameweek before and are not in it this gameweek.",
  transferGain: "What the players bought for this gameweek scored, minus what the players they replaced scored. Points count whether or not the player started. Free Hit transfers count too: they were real for this gameweek. While the gameweek is played, with the provisional bonus.",
  transferGainAfterHit: "The transfer gain less the points paid in hits: above 0, the transfers paid for themselves this gameweek.",
  transferOutcomes: "Each transfer made for this gameweek, with what it gained or lost: the points of the player bought minus those of the player sold.",
  benchPoints: "Points left on the bench this gameweek. While the gameweek is played, the bench after the projected automatic substitutions.",
  topBenched: "The highest-scoring player left on the bench, with their points. While the gameweek is played, the bench after the projected automatic substitutions.",
  bestPlayer: "The player who contributed the most points, including any captaincy multiplier.",
};

// Headers for phone-width screens, where the full ones are wider than the data.
const shortHeaders: Record<string, string> = {
  position: "Pos",
  positionChange: "+/−",
  teamName: "Team",
  managerName: "Manager",
  score: "Gross",
  netScore: "Pts",
  vsAverage: "Vs Avg",
  vsGlobalAverage: "Vs FPL",
  vsMostCaptained: "Vs Top C",
  gapToLeader: "To 1st",
  gapToAbove: "To Next",
  vsYou: "Vs You",
  notReplaced: "No Sub",
  mishaps: "Mishaps",
  swingGain: "Swing +",
  swingLoss: "Swing −",
  uniquePoints: "Unique",
  uniquePlayers: "Unique Players",
  projectedPosition: "Proj Pos",
  projectedPositionChange: "Proj +/−",
  provisionalBonus: "Bonus",
  automaticSubs: "Subs",
  projectedScore: "Proj",
  playersLeft: "Left",
  projectedTotal: "Proj Total",
  stillToPlay: "To Play",
  leagueGameweekRank: "Lge Rank",
  gameweekRank: "GW Rank",
  overallRank: "Overall",
  viceCaptain: "Vice",
  viceStepIn: "Vice In",
  captainPoints: "Capt Pts",
  bestCaptain: "Best Capt",
  captaincyPointsLost: "Capt Lost",
  transfers: "Trfs",
  teamValue: "Value",
  valueChange: "Value ±",
  playersIn: "In",
  playersOut: "Out",
  transferGain: "Trf Gain",
  transferGainAfterHit: "Net Gain",
  transferOutcomes: "Each Trf",
  benchPoints: "Bench",
  topBenched: "Top Benched",
};

const groups: ColumnGroup[] = [
  {
    name: "Scores",
    columns: ["position", "positionChange", "score", "hit", "netScore", "vsAverage", "vsGlobalAverage", "gapToLeader", "gapToAbove", "vsYou", "leagueGameweekRank", "gameweekRank", "overallRank"],
  },
  {
    name: "Captaincy",
    columns: ["captain", "viceCaptain", "viceStepIn", "captainPoints", "bestCaptain", "captaincyPointsLost", "vsMostCaptained"],
  },
  {
    name: "Transfers, chips and value",
    columns: ["chip", "transfers", "hit", "transferGain", "transferGainAfterHit", "transferOutcomes", "playersIn", "playersOut", "teamValue", "valueChange"],
  },
  { name: "Bench and best player", columns: ["benchPoints", "topBenched", "automaticSubs", "bestPlayer"] },
  { name: "Blanks and mishaps", columns: ["blanks", "notReplaced", "mishaps"] },
  {
    name: "Swing and differentials",
    columns: ["netScore", "vsAverage", "swingGain", "swingLoss", "uniquePoints", "uniquePlayers"],
  },
];

// Each group is also a view. The view's button gets a shorter name than the
// group's heading where needed, so that more views fit across a phone.
const viewNames: Record<string, string> = {
  "Transfers, chips and value": "Transfers",
  "Bench and best player": "Bench",
  "Blanks and mishaps": "Mishaps",
  "Swing and differentials": "Swing",
};

// The live projection, shown only while the current gameweek is being
// played. Columns only it has would be empty for a finished gameweek, so
// they are left out of the table altogether.
const liveGroup: ColumnGroup = {
  name: "Live",
  columns: ["projectedPosition", "projectedPositionChange", "projectedScore", "playersLeft", "vsYou", "gapToLeader", "gapToAbove", "vsAverage", "chip", "netScore", "provisionalBonus", "automaticSubs", "projectedTotal", "stillToPlay"],
};
const liveOnly = new Set(["projectedPosition", "projectedPositionChange", "projectedScore", "playersLeft", "provisionalBonus", "projectedTotal", "stillToPlay"]);

// What each view keeps on a phone besides the team name: enough to read a
// row without scrolling sideways. The rest is a tap away ("more columns"),
// and in the team panel. Keyed by the view's name.
const phoneColumns: Record<string, string[]> = {
  Overview: ["position", "positionChange", "netScore", "captain"],
  Live: ["projectedPosition", "projectedPositionChange", "projectedScore", "playersLeft"],
  Scores: ["position", "positionChange", "netScore", "vsAverage"],
  Captaincy: ["captain", "captainPoints", "captaincyPointsLost"],
  Transfers: ["transferGainAfterHit", "playersIn"],
  Bench: ["benchPoints", "topBenched"],
  Mishaps: ["blanks", "mishaps"],
  Swing: ["swingGain", "uniquePoints"],
};

function presetsFor(shownGroups: ColumnGroup[]): Preset[] {
  return [
    {
      name: "Overview",
      columns: ["position", "positionChange", "teamName", "netScore", "captain", "chip", "hit", "benchPoints"],
      phoneColumns: phoneColumns.Overview,
    },
    ...shownGroups.map((group) => {
      const name = viewNames[group.name] ?? group.name;
      return { name, columns: ["teamName", ...group.columns], phoneColumns: phoneColumns[name] };
    }),
    { name: "All columns" },
  ];
}

const finished = {
  columns: columns.filter((column) => !liveOnly.has(column.id as string)),
  groups,
  presets: presetsFor(groups),
};
const live = {
  columns,
  groups: [liveGroup, ...groups],
  presets: presetsFor([liveGroup, ...groups]),
};

// While the gameweek is played the page updates itself every minute. A
// team whose projected score changed at the last update is marked ("+6");
// one that only lost its place to another is highlighted.
const liveChanges: ChangeTracking<GameweekStats> = {
  rowKey: (row) => row.teamId,
  marked: { projectedScore: (row) => row.projectedScore },
  unmarked: { projectedPosition: (row) => row.projectedPosition },
};

const points = (value: number) => `${value} pts`;

// The card for each of the gameweek's records. `view` must be the name of a
// preset above.
const highlightCards: Record<GameweekHighlight["kind"], HighlightCard> = {
  winner: { title: "Gameweek winner", value: points, view: "Scores", column: "netScore", desc: true },
  climber: {
    title: "Biggest climber",
    value: (value) => `▲ Up ${value}`,
    view: "Scores",
    column: "positionChange",
    desc: true,
  },
  captaincy: {
    title: "Worst captain call",
    value: (value) => `${points(value)} lost`,
    view: "Captaincy",
    column: "captaincyPointsLost",
    desc: true,
  },
  bench: { title: "Most left on bench", value: points, view: "Bench", column: "benchPoints", desc: true },
  hit: { title: "Biggest hit", value: (value) => `−${points(value)}`, view: "Scores", column: "hit", desc: true },
  lowest: { title: "Lowest score", value: points, view: "Scores", column: "netScore", desc: false },
  swing: {
    title: "Biggest swing",
    value: (value, player) => `${player} +${value}`,
    view: "Swing",
    column: "swingGain",
    desc: true,
  },
  swingAgainst: {
    title: "Swung against",
    value: (value, player) => `${player} −${value}`,
    view: "Swing",
    column: "swingLoss",
    desc: false,
  },
  transfers: {
    title: "Best transfers",
    value: (value) => `+${points(value)} after hits`,
    view: "Transfers",
    column: "transferGainAfterHit",
    desc: true,
  },
  transfersBackfired: {
    title: "Transfers backfired",
    value: (value) => `−${points(value)} after hits`,
    view: "Transfers",
    column: "transferGainAfterHit",
    desc: false,
  },
  unique: { title: "Most unique points", value: points, view: "Swing", column: "uniquePoints", desc: true },
};

// While the gameweek is played, nobody has won it yet: the cards say so,
// and the scores are the projected ones, as in the Live view. Titles are
// kept short enough for one line on a phone.
const liveHighlightCards: Record<GameweekHighlight["kind"], HighlightCard> = {
  ...highlightCards,
  winner: { title: "Top so far", value: points, view: "Live", column: "projectedScore", desc: true },
  climber: {
    ...highlightCards.climber,
    view: "Live",
    column: "projectedPositionChange",
  },
  lowest: { title: "Bottom so far", value: points, view: "Live", column: "projectedScore", desc: false },
};

export default function GameweekStatisticsTable({
  stats,
  highlights,
  leagueName,
  isLive,
}: {
  stats: GameweekStats[];
  highlights: GameweekHighlight[];
  leagueName: string;
  /** The gameweek is being played: the live projection is shown, and opens first. */
  isLive: boolean;
}) {
  const myTeam = useMyTeamId();
  const myTotal = stats.find((row) => row.teamId === myTeam)?.total ?? null;
  const base = isLive ? live : finished;
  // "Vs your team" needs the visitor's team, known only in the browser. The
  // column is swapped rather than the rows changed, so that the row panel
  // stays open when the visitor marks their team from it. Without a team the
  // views leave the column out; the column picker still lists it.
  const table = useMemo(
    () => ({
      columns: base.columns.map((column) =>
        column.id === "vsYou" ? vsYouColumn(myTotal, myTeam) : column
      ),
      presets:
        myTeam === null
          ? base.presets.map((preset) => ({
              ...preset,
              columns: preset.columns?.filter((id) => id !== "vsYou"),
            }))
          : base.presets,
    }),
    [base, myTotal, myTeam]
  );
  return (
    <DataTable
      // A new table when the gameweek goes from live to finished (or the
      // visitor steps to another gameweek), as the columns differ.
      key={isLive ? "live" : "finished"}
      data={stats}
      columns={table.columns}
      presets={table.presets}
      groups={base.groups}
      descriptions={descriptions}
      highlights={highlights.map((record) =>
        toHighlight(record, (isLive ? liveHighlightCards : highlightCards)[record.kind])
      )}
      initialPreset={isLive ? "Live" : "Overview"}
      initialSorting={[{ id: isLive ? "projectedPosition" : "position", desc: false }]}
      shortHeaders={shortHeaders}
      stickyColumn="teamName"
      subtitleColumn="managerName"
      wrapColumns={["playersIn", "playersOut", "automaticSubs", "stillToPlay", "blanks", "notReplaced", "mishaps", "uniquePlayers", "transferOutcomes"]}
      detailNoun="team"
      detailHint={
        myTeam === null ? "Select a team to see all its stats, or to mark it as yours." : undefined
      }
      detailAction={(row) => <MyTeamButton teamId={row.teamId} leagueName={leagueName} />}
      highlightRow={(row) => row.teamId === myTeam}
      trackChanges={isLive ? liveChanges : undefined}
    />
  );
}
