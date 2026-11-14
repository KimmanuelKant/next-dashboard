// src/components/TeamStatisticsTable.tsx
"use client";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { Preset } from "@/components/DataTable";
import type { ChipUse, TeamStats } from "@/lib/stats/teamStats";

const columnHelper = createColumnHelper<TeamStats>();

const formatNumber = (value: number | null) =>
  value === null ? "–" : value.toLocaleString("en-GB");
const formatMoney = (value: number | null) =>
  value === null ? "–" : `£${value.toFixed(1)}m`;
const formatChip = (uses: ChipUse[]) =>
  uses.length
    ? uses.map((use) => `${use.points} (GW${use.gw})`).join(", ")
    : "Not used";
const chipTotal = (uses: ChipUse[]) =>
  uses.length ? uses.reduce((sum, use) => sum + use.points, 0) : -1;

const columns = [
  columnHelper.accessor("rank", { id: "rank", header: "Rank" }),
  columnHelper.accessor("managerName", { id: "managerName", header: "Manager Name" }),
  columnHelper.accessor("teamName", { id: "teamName", header: "Team Name" }),
  columnHelper.accessor("teamId", { id: "teamId", header: "Team ID" }),
  columnHelper.accessor("totalPoints", { id: "totalPoints", header: "Total Points" }),
  columnHelper.accessor("eventTotal", { id: "eventTotal", header: "GW Total" }),
  columnHelper.accessor("overallRank", {
    id: "overallRank",
    header: "Overall Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("totalTransfers", { id: "totalTransfers", header: "Total Transfers" }),
  columnHelper.accessor("transfersThisWeek", { id: "transfersThisWeek", header: "GW Transfers" }),
  columnHelper.accessor("teamValue", {
    id: "teamValue",
    header: "Team Value",
    cell: ({ getValue }) => formatMoney(getValue()),
  }),
  columnHelper.accessor("bank", {
    id: "bank",
    header: "Bank",
    cell: ({ getValue }) => formatMoney(getValue()),
  }),
  columnHelper.accessor("wildcardsUsed", { id: "wildcardsUsed", header: "Wildcards Used" }),
  // Chip columns sort on total points; "Not used" sorts last.
  columnHelper.accessor((row) => chipTotal(row.tripleCaptain), {
    id: "tripleCaptain",
    header: "Triple Captain",
    cell: ({ row }) => formatChip(row.original.tripleCaptain),
  }),
  columnHelper.accessor((row) => chipTotal(row.benchBoost), {
    id: "benchBoost",
    header: "Bench Boost",
    cell: ({ row }) => formatChip(row.original.benchBoost),
  }),
  columnHelper.accessor((row) => chipTotal(row.freeHit), {
    id: "freeHit",
    header: "Free Hit",
    cell: ({ row }) => formatChip(row.original.freeHit),
  }),
  columnHelper.accessor((row) => row.chipsUsed.length, {
    id: "chipsUsed",
    header: "Chips Used",
    cell: ({ row }) => row.original.chipsUsed.join(", ") || "None",
  }),
  columnHelper.accessor("chipPointsGained", { id: "chipPointsGained", header: "Chip Points Gained" }),
  columnHelper.accessor("totalCaptainPoints", { id: "totalCaptainPoints", header: "Total Captain Points" }),
  columnHelper.accessor("captainPointsPercentage", {
    id: "captainPointsPercentage",
    header: "Captain Points %",
    cell: ({ getValue }) => `${getValue().toFixed(1)}%`,
  }),
  columnHelper.accessor((row) => row.mostCaptained?.count ?? 0, {
    id: "mostCaptained",
    header: "Most Captained",
    cell: ({ row }) => {
      const most = row.original.mostCaptained;
      return most ? `${most.name} (${most.count})` : "–";
    },
  }),
  columnHelper.accessor("captainDiversity", { id: "captainDiversity", header: "Different Captains" }),
  columnHelper.accessor("pointsOnBench", { id: "pointsOnBench", header: "Points on Bench" }),
  columnHelper.accessor("totalTransferPointsDeducted", { id: "totalTransferPointsDeducted", header: "Total Hits" }),
  columnHelper.accessor("captain", { id: "captain", header: "Captain" }),
  columnHelper.accessor("viceCaptain", { id: "viceCaptain", header: "Vice Captain" }),
  columnHelper.accessor("highestGameweekScore", { id: "highestGameweekScore", header: "Highest GW Score" }),
  columnHelper.accessor("bestOverallRank", {
    id: "bestOverallRank",
    header: "Best Overall Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("worstOverallRank", {
    id: "worstOverallRank",
    header: "Worst Overall Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("bestGameweekRank", {
    id: "bestGameweekRank",
    header: "Best GW Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("worstGameweekRank", {
    id: "worstGameweekRank",
    header: "Worst GW Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("totalGKPoints", { id: "totalGKPoints", header: "GK Points" }),
  columnHelper.accessor("totalDEFPoints", { id: "totalDEFPoints", header: "DEF Points" }),
  columnHelper.accessor("totalMIDPoints", { id: "totalMIDPoints", header: "MID Points" }),
  columnHelper.accessor("totalFWDPoints", { id: "totalFWDPoints", header: "FWD Points" }),
];

const descriptions: Record<string, string> = {
  rank: "The manager's rank within the league.",
  managerName: "The name of the team manager.",
  teamName: "The name of the team.",
  teamId: "The FPL ID of the team.",
  totalPoints: "Total points this season, after transfer hits.",
  eventTotal: "Points scored in the current gameweek.",
  overallRank: "The team's current overall rank among all FPL managers.",
  totalTransfers: "Transfers made this season.",
  transfersThisWeek: "Transfers made for the current gameweek.",
  teamValue: "Squad value including money in the bank.",
  bank: "Money in the bank.",
  wildcardsUsed: "Number of Wildcards played.",
  tripleCaptain: "Points the tripled player scored, and the gameweek. That is the extra gained by playing the chip.",
  benchBoost: "Points the four bench players scored, and the gameweek.",
  freeHit: "The team's score in the Free Hit gameweek.",
  chipsUsed: "Every chip played, with the gameweek.",
  chipPointsGained: "Extra points from Triple Captain and Bench Boost. Free Hit and Wildcard are not included, since their gain cannot be measured.",
  totalCaptainPoints: "Points from the player who wore the armband each week (the vice captain when the captain did not play), including the multiplier.",
  captainPointsPercentage: "Captain points as a share of all points scored before hits.",
  mostCaptained: "The player most often chosen as captain, with the number of times.",
  captainDiversity: "Number of different players chosen as captain this season.",
  pointsOnBench: "Points left on the bench this season.",
  totalTransferPointsDeducted: "Points deducted for extra transfers.",
  captain: "Captain in the current gameweek.",
  viceCaptain: "Vice captain in the current gameweek.",
  highestGameweekScore: "The best single gameweek score.",
  bestOverallRank: "The best overall rank reached this season.",
  worstOverallRank: "The worst overall rank this season.",
  bestGameweekRank: "The best rank for a single gameweek.",
  worstGameweekRank: "The worst rank for a single gameweek.",
  totalGKPoints: "Points from goalkeepers, including captaincy.",
  totalDEFPoints: "Points from defenders, including captaincy.",
  totalMIDPoints: "Points from midfielders, including captaincy.",
  totalFWDPoints: "Points from forwards, including captaincy.",
};

const presets: Preset[] = [
  {
    name: "Default View",
    columns: ["rank", "managerName", "teamName", "totalPoints", "eventTotal"],
  },
  {
    name: "Transfers and Value",
    columns: ["managerName", "totalTransfers", "transfersThisWeek", "totalTransferPointsDeducted", "teamValue", "bank"],
  },
  {
    name: "Chips Usage",
    columns: ["managerName", "wildcardsUsed", "tripleCaptain", "benchBoost", "freeHit", "chipPointsGained"],
  },
  {
    name: "Captaincy",
    columns: ["managerName", "captain", "viceCaptain", "mostCaptained", "captainDiversity", "totalCaptainPoints", "captainPointsPercentage"],
  },
  {
    name: "Rankings",
    columns: ["managerName", "overallRank", "bestOverallRank", "worstOverallRank", "bestGameweekRank", "worstGameweekRank"],
  },
  {
    name: "Points Distribution",
    columns: ["managerName", "totalGKPoints", "totalDEFPoints", "totalMIDPoints", "totalFWDPoints", "pointsOnBench", "totalPoints"],
  },
  { name: "All Columns" },
];

export default function TeamStatisticsTable({ stats }: { stats: TeamStats[] }) {
  return (
    <DataTable
      data={stats}
      columns={columns}
      presets={presets}
      descriptions={descriptions}
      initialPreset="Default View"
    />
  );
}
