// src/components/GameweekStatisticsTable.tsx
"use client";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { ColumnGroup, Preset } from "@/components/DataTable";
import { HighlightCard, toHighlight } from "@/components/Highlights";
import MyTeamButton from "@/components/MyTeamButton";
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
  columnHelper.accessor((row) => row.projectedPosition ?? undefined, {
    id: "projectedPosition",
    header: "Projected Position",
    cell: ({ row }) =>
      row.original.projectedPosition === null
        ? "–"
        : `${row.original.projectedPosition}${row.original.projectedPositionTied ? "=" : ""}`,
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
  columnHelper.accessor((row) => row.playersLeft ?? undefined, {
    id: "playersLeft",
    header: "Players Left",
    cell: ({ getValue }) => getValue() ?? "–",
    sortUndefined: "last",
  }),
  columnHelper.accessor("score", { id: "score", header: "GW Score" }),
  columnHelper.accessor("hit", {
    id: "hit",
    header: "Hit",
    cell: ({ getValue }) => (getValue() ? `-${getValue()}` : "0"),
  }),
  columnHelper.accessor("netScore", { id: "netScore", header: "Score After Hit" }),
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
      if (automaticSubs.length === 0) return "–";
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
  position: "The team's position in this league after this gameweek. Teams level on points share a position, marked with =.",
  positionChange: "Places gained or lost in this league since the previous gameweek. A team that draws level on points with the one above moves up, while the team it joins stays where it was.",
  teamName: "The name of the team.",
  managerName: "The name of the team manager.",
  score: "Points scored this gameweek, before transfer hits.",
  hit: "Points deducted for extra transfers this gameweek.",
  netScore: "Points scored this gameweek after transfer hits.",
  projectedPosition: "The team's position in this league if the gameweek ended with the projected scores. Teams level on points share a position, marked with =.",
  provisionalBonus: "Bonus points the team's players would get if their matches ended now, from FPL's bonus points system. FPL adds the bonus shortly after each match; until then it is not in the score. Doubled for the captain.",
  automaticSubs: "Substitutes who would come on for starters who did not play, in bench order and keeping a valid formation, as FPL does after the gameweek's last match. Also the armband passing to the vice captain when the captain did not play. In brackets, the points they add.",
  projectedScore: "This gameweek's score after hits, with the provisional bonus and the automatic substitutions added. It changes while matches are being played.",
  playersLeft: "Players in the team whose match has not finished: still to kick off, or being played.",
  projectedTotal: "The team's season total with the projected score for this gameweek.",
  stillToPlay: "The players counted in Players Left, by name. (C) marks the one with the armband.",
  leagueGameweekRank: "Where this gameweek's score (after hits) ranks within the league.",
  gameweekRank: "Where this gameweek's score ranks among all FPL managers.",
  overallRank: "The team's overall rank among all FPL managers after this gameweek.",
  captain: "The player chosen as captain.",
  viceCaptain: "The player chosen as vice captain.",
  captainPoints: "Points from the armband this gameweek, including the multiplier. The vice captain's if the captain did not play.",
  bestCaptain: "The highest-scoring player in the starting eleven, with their points before any multiplier.",
  captaincyPointsLost: "Points lost by not giving the armband to the highest-scoring starter.",
  chip: "The chip played this gameweek, if any.",
  transfers: "Transfers made for this gameweek.",
  teamValue: "Squad value including money in the bank.",
  valueChange: "How much the squad value (including the bank) went up or down since the previous gameweek.",
  playersIn: "Players in the squad this gameweek who were not in it the gameweek before. After a Free Hit, the comparison is with the squad before it.",
  playersOut: "Players who were in the squad the gameweek before and are not in it this gameweek.",
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
  projectedPosition: "Proj Pos",
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

// The live projection, shown only while the current gameweek is being
// played. For a finished gameweek these columns would be empty, so they are
// left out of the table altogether.
const liveGroup: ColumnGroup = {
  name: "Live",
  columns: ["projectedPosition", "projectedScore", "playersLeft", "netScore", "provisionalBonus", "automaticSubs", "projectedTotal", "stillToPlay"],
};
const liveOnly = new Set(liveGroup.columns.filter((id) => id !== "netScore"));

function presetsFor(shownGroups: ColumnGroup[]): Preset[] {
  return [
    {
      name: "Overview",
      columns: ["position", "positionChange", "teamName", "netScore", "captain", "chip", "hit", "benchPoints"],
    },
    ...shownGroups.map((group) => ({
      name: viewNames[group.name] ?? group.name,
      columns: ["teamName", ...group.columns],
    })),
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

// While the gameweek is played, nobody has won it yet: the cards say so,
// and the scores are the projected ones, as in the Live view. Titles are
// kept short enough for one line on a phone.
const liveHighlightCards: Record<GameweekHighlight["kind"], HighlightCard> = {
  ...highlightCards,
  winner: { title: "Top so far", value: points, view: "Live", column: "projectedScore", desc: true },
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
  const table = isLive ? live : finished;
  return (
    <DataTable
      // A new table when the gameweek goes from live to finished (or the
      // visitor steps to another gameweek), as the columns differ.
      key={isLive ? "live" : "finished"}
      data={stats}
      columns={table.columns}
      presets={table.presets}
      groups={table.groups}
      descriptions={descriptions}
      highlights={highlights.map((record) =>
        toHighlight(record, (isLive ? liveHighlightCards : highlightCards)[record.kind])
      )}
      initialPreset={isLive ? "Live" : "Overview"}
      initialSorting={[{ id: isLive ? "projectedPosition" : "position", desc: false }]}
      shortHeaders={shortHeaders}
      stickyColumn="teamName"
      subtitleColumn="managerName"
      wrapColumns={["playersIn", "playersOut", "automaticSubs", "stillToPlay"]}
      detailNoun="team"
      detailHint={
        myTeam === null ? "Select a team to see all its stats, or to mark it as yours." : undefined
      }
      detailAction={(row) => <MyTeamButton teamId={row.teamId} leagueName={leagueName} />}
      highlightRow={(row) => row.teamId === myTeam}
    />
  );
}
