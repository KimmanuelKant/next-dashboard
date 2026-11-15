// src/components/GameweekStatisticsTable.tsx
"use client";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { ColumnGroup, Preset } from "@/components/DataTable";
import { HighlightCard, toHighlight } from "@/components/Highlights";
import Narrow from "@/components/Narrow";
import type { GameweekHighlight, GameweekStats } from "@/lib/stats/gameweekStats";
import { useMyTeamId } from "@/lib/myTeam";

const columnHelper = createColumnHelper<GameweekStats>();

const formatNumber = (value: number | null) =>
  value === null ? "–" : value.toLocaleString("en-GB");
const formatNamed = (item: { name: string; count: number } | null) =>
  item ? `${item.name} (${item.count})` : "–";

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
    cell: ({ row }) => {
      const change = row.original.positionChange;
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
    },
  }),
  columnHelper.accessor("teamName", { id: "teamName", header: "Team Name" }),
  columnHelper.accessor("managerName", { id: "managerName", header: "Manager Name" }),
  columnHelper.accessor("score", { id: "score", header: "GW Score" }),
  columnHelper.accessor("hit", {
    id: "hit",
    header: "Hit",
    cell: ({ getValue }) => (getValue() ? `-${getValue()}` : "0"),
  }),
  columnHelper.accessor("netScore", { id: "netScore", header: "Score After Hit" }),
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
  columnHelper.accessor("captainPoints", { id: "captainPoints", header: "Captain Points" }),
  columnHelper.accessor((row) => row.bestCaptain?.count ?? 0, {
    id: "bestCaptain",
    header: "Best Captain Option",
    cell: ({ row }) => formatNamed(row.original.bestCaptain),
  }),
  columnHelper.accessor("captaincyPointsLost", { id: "captaincyPointsLost", header: "Captaincy Points Lost" }),
  columnHelper.accessor((row) => row.chip ?? "", {
    id: "chip",
    header: "Chip",
    cell: ({ row }) => row.original.chip ?? "–",
  }),
  columnHelper.accessor("transfers", { id: "transfers", header: "Transfers" }),
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
];

const descriptions: Record<string, string> = {
  position: "The team's position in this league now. Teams level on points share a position, marked with =.",
  positionChange: "Places gained or lost in this league since the previous gameweek. A team that draws level on points with the one above moves up, while the team it joins stays where it was.",
  teamName: "The name of the team.",
  managerName: "The name of the team manager.",
  score: "Points scored this gameweek, before transfer hits.",
  hit: "Points deducted for extra transfers this gameweek.",
  netScore: "Points scored this gameweek after transfer hits.",
  leagueGameweekRank: "Where this gameweek's score (after hits) ranks within the league.",
  gameweekRank: "Where this gameweek's score ranks among all FPL managers.",
  overallRank: "The team's overall rank among all FPL managers.",
  captain: "The player chosen as captain.",
  viceCaptain: "The player chosen as vice captain.",
  captainPoints: "Points from the armband this gameweek, including the multiplier. The vice captain's if the captain did not play.",
  bestCaptain: "The highest-scoring player in the starting eleven, with their points before any multiplier.",
  captaincyPointsLost: "Points lost by not giving the armband to the highest-scoring starter.",
  chip: "The chip played this gameweek, if any.",
  transfers: "Transfers made for this gameweek.",
  teamValue: "Squad value including money in the bank.",
  valueChange: "How much the squad value (including the bank) went up or down since the previous gameweek.",
  playersIn: "Players in the squad now who were not in it last gameweek. After a Free Hit, the comparison is with the squad before it.",
  playersOut: "Players who were in the squad last gameweek and are not now.",
  benchPoints: "Points left on the bench this gameweek.",
  topBenched: "The highest-scoring player left on the bench, with their points.",
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
  leagueGameweekRank: "Lge Rank",
  gameweekRank: "GW Rank",
  overallRank: "Overall",
  viceCaptain: "Vice",
  captainPoints: "Capt Pts",
  bestCaptain: "Best Capt",
  captaincyPointsLost: "Capt Lost",
  transfers: "Trfs",
  teamValue: "Value",
  valueChange: "Value ±",
  playersIn: "In",
  playersOut: "Out",
  benchPoints: "Bench",
  topBenched: "Top Benched",
};

const groups: ColumnGroup[] = [
  {
    name: "Scores",
    columns: ["position", "positionChange", "score", "hit", "netScore", "leagueGameweekRank", "gameweekRank", "overallRank"],
  },
  {
    name: "Captaincy",
    columns: ["captain", "viceCaptain", "captainPoints", "bestCaptain", "captaincyPointsLost"],
  },
  { name: "Transfers, chips and value", columns: ["chip", "transfers", "playersIn", "playersOut", "teamValue", "valueChange"] },
  { name: "Bench and best player", columns: ["benchPoints", "topBenched", "bestPlayer"] },
];

// Each group is also a view. The view's button gets a shorter name than the
// group's heading where needed, so that more views fit across a phone.
const viewNames: Record<string, string> = {
  "Transfers, chips and value": "Transfers",
  "Bench and best player": "Bench",
};

const presets: Preset[] = [
  {
    name: "Overview",
    columns: ["position", "positionChange", "teamName", "netScore", "captain", "chip", "hit", "benchPoints"],
  },
  ...groups.map((group) => ({
    name: viewNames[group.name] ?? group.name,
    columns: ["teamName", ...group.columns],
  })),
  { name: "All columns" },
];

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
};

export default function GameweekStatisticsTable({
  stats,
  highlights,
}: {
  stats: GameweekStats[];
  highlights: GameweekHighlight[];
}) {
  const myTeam = useMyTeamId();
  return (
    <DataTable
      data={stats}
      columns={columns}
      presets={presets}
      groups={groups}
      descriptions={descriptions}
      highlights={highlights.map((record) => toHighlight(record, highlightCards[record.kind]))}
      initialPreset="Overview"
      initialSorting={[{ id: "position", desc: false }]}
      shortHeaders={shortHeaders}
      stickyColumn="teamName"
      subtitleColumn="managerName"
      wrapColumns={["playersIn", "playersOut"]}
      detailNoun="team"
      highlightRow={(row) => row.teamId === myTeam}
    />
  );
}
