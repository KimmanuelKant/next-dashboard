// src/components/SeasonStatisticsTable.tsx
"use client";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { ColumnGroup, Preset } from "@/components/DataTable";
import type { ChipUse, LabelledValue, NamedCount, TeamStats } from "@/lib/stats/teamStats";

const columnHelper = createColumnHelper<TeamStats>();

const formatNumber = (value: number | null) =>
  value === null ? "–" : value.toLocaleString("en-GB");
const formatMoney = (value: number | null) =>
  value === null ? "–" : `£${value.toFixed(1)}m`;
const formatSigned = (value: number) => `${value > 0 ? "+" : ""}${value}`;
const formatChip = (uses: ChipUse[]) =>
  uses.length
    ? uses.map((use) => `${use.points} (GW${use.gw})`).join(", ")
    : "Not used";
const chipTotal = (uses: ChipUse[]) =>
  uses.length ? uses.reduce((sum, use) => sum + use.points, 0) : -1;
const formatHeld = (held: NamedCount | null) =>
  held ? `${held.name} (${held.count} GW)` : "–";
const formatLabelled = (item: LabelledValue | null, signed = false) =>
  item ? `${signed ? formatSigned(item.value) : item.value} (${item.label})` : "–";

const columns = [
  columnHelper.accessor("rank", { id: "rank", header: "Rank" }),
  columnHelper.accessor("managerName", { id: "managerName", header: "Manager Name" }),
  columnHelper.accessor("teamName", { id: "teamName", header: "Team Name" }),
  columnHelper.accessor("teamId", { id: "teamId", header: "Team ID" }),
  columnHelper.accessor("totalPoints", { id: "totalPoints", header: "Total Points" }),
  columnHelper.accessor("highestGameweekScore", { id: "highestGameweekScore", header: "Highest GW Score" }),

  // League race
  columnHelper.accessor("weeksAtTop", { id: "weeksAtTop", header: "Weeks at Top" }),
  columnHelper.accessor("weeksAtBottom", { id: "weeksAtBottom", header: "Weeks at Bottom" }),
  columnHelper.accessor("gameweekWins", { id: "gameweekWins", header: "GW Wins" }),
  columnHelper.accessor("bestLeaguePosition", {
    id: "bestLeaguePosition",
    header: "Best League Position",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
  columnHelper.accessor("worstLeaguePosition", {
    id: "worstLeaguePosition",
    header: "Worst League Position",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),

  // Transfers and value
  columnHelper.accessor("totalTransfers", { id: "totalTransfers", header: "Total Transfers" }),
  columnHelper.accessor("totalTransferPointsDeducted", { id: "totalTransferPointsDeducted", header: "Total Hits" }),
  columnHelper.accessor("transferGain", {
    id: "transferGain",
    header: "Transfer Gain",
    cell: ({ getValue }) => formatSigned(getValue()),
  }),
  columnHelper.accessor("transferGainAfterHits", {
    id: "transferGainAfterHits",
    header: "Transfer Gain After Hits",
    cell: ({ getValue }) => formatSigned(getValue()),
  }),
  columnHelper.accessor((row) => row.bestTransfer?.value ?? -Infinity, {
    id: "bestTransfer",
    header: "Best Transfer",
    cell: ({ row }) => formatLabelled(row.original.bestTransfer, true),
  }),
  columnHelper.accessor((row) => row.worstTransfer?.value ?? Infinity, {
    id: "worstTransfer",
    header: "Worst Transfer",
    cell: ({ row }) => formatLabelled(row.original.worstTransfer, true),
  }),
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

  // Chips. Chip columns sort on total points; "Not used" sorts last.
  columnHelper.accessor("wildcardsUsed", { id: "wildcardsUsed", header: "Wildcards Used" }),
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

  // Captaincy
  columnHelper.accessor("totalCaptainPoints", { id: "totalCaptainPoints", header: "Total Captain Points" }),
  columnHelper.accessor("captainPointsPercentage", {
    id: "captainPointsPercentage",
    header: "Captain Points %",
    cell: ({ getValue }) => `${getValue().toFixed(1)}%`,
  }),
  columnHelper.accessor("captaincyPointsLost", { id: "captaincyPointsLost", header: "Captaincy Points Lost" }),
  columnHelper.accessor("perfectCaptainWeeks", { id: "perfectCaptainWeeks", header: "Perfect Captain Weeks" }),
  columnHelper.accessor((row) => row.mostCaptained?.count ?? 0, {
    id: "mostCaptained",
    header: "Most Captained",
    cell: ({ row }) => {
      const most = row.original.mostCaptained;
      return most ? `${most.name} (${most.count})` : "–";
    },
  }),
  columnHelper.accessor("captainDiversity", { id: "captainDiversity", header: "Different Captains" }),

  // Points breakdown
  columnHelper.accessor("totalGKPoints", { id: "totalGKPoints", header: "GK Points" }),
  columnHelper.accessor("totalDEFPoints", { id: "totalDEFPoints", header: "DEF Points" }),
  columnHelper.accessor("totalMIDPoints", { id: "totalMIDPoints", header: "MID Points" }),
  columnHelper.accessor("totalFWDPoints", { id: "totalFWDPoints", header: "FWD Points" }),
  columnHelper.accessor("pointsOnBench", { id: "pointsOnBench", header: "Points on Bench" }),
  columnHelper.accessor((row) => row.biggestBenchedHaul?.value ?? -Infinity, {
    id: "biggestBenchedHaul",
    header: "Biggest Benched Haul",
    cell: ({ row }) => formatLabelled(row.original.biggestBenchedHaul),
  }),

  // Squad habits
  columnHelper.accessor((row) => row.favouriteClub?.count ?? 0, {
    id: "favouriteClub",
    header: "Favourite Club",
    cell: ({ row }) => {
      const club = row.original.favouriteClub;
      return club ? `${club.name} (${club.count}%)` : "–";
    },
  }),
  columnHelper.accessor((row) => row.mostHeld?.count ?? 0, {
    id: "mostHeld",
    header: "Most-Held Player",
    cell: ({ row }) => formatHeld(row.original.mostHeld),
  }),
  columnHelper.accessor((row) => row.longestSquadStreak?.count ?? 0, {
    id: "longestSquadStreak",
    header: "Longest Squad Streak",
    cell: ({ row }) => formatHeld(row.original.longestSquadStreak),
  }),
  columnHelper.accessor((row) => row.longestServingStarter?.count ?? 0, {
    id: "longestServingStarter",
    header: "Longest-Serving Starter",
    cell: ({ row }) => formatHeld(row.original.longestServingStarter),
  }),

  // Mishaps
  columnHelper.accessor("yellowCards", { id: "yellowCards", header: "Yellow Cards" }),
  columnHelper.accessor("redCards", { id: "redCards", header: "Red Cards" }),
  columnHelper.accessor("ownGoals", { id: "ownGoals", header: "Own Goals" }),
  columnHelper.accessor("penaltiesMissed", { id: "penaltiesMissed", header: "Penalties Missed" }),

  // Overall ranks
  columnHelper.accessor("overallRank", {
    id: "overallRank",
    header: "Overall Rank",
    cell: ({ getValue }) => formatNumber(getValue()),
  }),
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
];

const descriptions: Record<string, string> = {
  rank: "The manager's rank within the league.",
  managerName: "The name of the team manager.",
  teamName: "The name of the team.",
  teamId: "The FPL ID of the team.",
  totalPoints: "Total points this season, after transfer hits.",
  highestGameweekScore: "The best single gameweek score.",
  weeksAtTop: "Gameweeks spent in first place in this league.",
  weeksAtBottom: "Gameweeks spent in last place in this league.",
  gameweekWins: "Gameweeks with the highest score in this league, after hits. Ties count for everyone tied.",
  bestLeaguePosition: "The highest position reached in this league.",
  worstLeaguePosition: "The lowest position in this league.",
  totalTransfers: "Transfers made this season.",
  totalTransferPointsDeducted: "Points deducted for extra transfers.",
  transferGain: "What the players bought scored in their first gameweek, minus what the players sold scored that same week. Counts points whether or not the player was in the starting eleven. Free Hit weeks are left out.",
  transferGainAfterHits: "Transfer gain minus the points paid in hits.",
  bestTransfer: "The single transfer with the biggest first-week gain.",
  worstTransfer: "The single transfer with the biggest first-week loss.",
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
  captaincyPointsLost: "Points lost over the season by not giving the armband to the highest-scoring player in the starting eleven each week.",
  perfectCaptainWeeks: "Gameweeks where the armband was on the highest-scoring player in the starting eleven.",
  mostCaptained: "The player most often chosen as captain, with the number of times.",
  captainDiversity: "Number of different players chosen as captain this season.",
  totalGKPoints: "Points from goalkeepers, including captaincy.",
  totalDEFPoints: "Points from defenders, including captaincy.",
  totalMIDPoints: "Points from midfielders, including captaincy.",
  totalFWDPoints: "Points from forwards, including captaincy.",
  pointsOnBench: "Points left on the bench this season.",
  biggestBenchedHaul: "The highest score by a single player left on the bench, with the player and gameweek.",
  favouriteClub: "The club whose players have filled the most squad places over the season, with its share of all squad places.",
  mostHeld: "The player who has been in the squad for the most gameweeks in total.",
  longestSquadStreak: "The longest unbroken run of gameweeks any player has spent in the squad. Being left out of a Free Hit squad does not break a run.",
  longestServingStarter: "Of the current starting eleven, the player who has started the most gameweeks in a row. Being left out of a Free Hit team does not break a run.",
  yellowCards: "Yellow cards received by players in the starting eleven.",
  redCards: "Red cards received by players in the starting eleven.",
  ownGoals: "Own goals scored by players in the starting eleven.",
  penaltiesMissed: "Penalties missed by players in the starting eleven.",
  overallRank: "The team's current overall rank among all FPL managers.",
  bestOverallRank: "The best overall rank reached this season.",
  worstOverallRank: "The worst overall rank this season.",
  bestGameweekRank: "The best rank for a single gameweek among all FPL managers.",
  worstGameweekRank: "The worst rank for a single gameweek among all FPL managers.",
};

// Each group is both a heading in the column picker and a preset view.
const groups: ColumnGroup[] = [
  { name: "Standings", columns: ["rank", "totalPoints", "highestGameweekScore"] },
  {
    name: "League race",
    columns: ["weeksAtTop", "weeksAtBottom", "gameweekWins", "bestLeaguePosition", "worstLeaguePosition"],
  },
  {
    name: "Transfers and value",
    columns: ["totalTransfers", "totalTransferPointsDeducted", "transferGain", "transferGainAfterHits", "bestTransfer", "worstTransfer", "teamValue", "bank"],
  },
  {
    name: "Chips",
    columns: ["wildcardsUsed", "tripleCaptain", "benchBoost", "freeHit", "chipsUsed", "chipPointsGained"],
  },
  {
    name: "Captaincy",
    columns: ["totalCaptainPoints", "captainPointsPercentage", "captaincyPointsLost", "perfectCaptainWeeks", "mostCaptained", "captainDiversity"],
  },
  {
    name: "Points breakdown",
    columns: ["totalGKPoints", "totalDEFPoints", "totalMIDPoints", "totalFWDPoints", "pointsOnBench", "biggestBenchedHaul"],
  },
  {
    name: "Squad habits",
    columns: ["favouriteClub", "mostHeld", "longestSquadStreak", "longestServingStarter"],
  },
  { name: "Mishaps", columns: ["yellowCards", "redCards", "ownGoals", "penaltiesMissed"] },
  {
    name: "Overall ranks",
    columns: ["overallRank", "bestOverallRank", "worstOverallRank", "bestGameweekRank", "worstGameweekRank"],
  },
];

const presets: Preset[] = [
  ...groups.map((group) => ({
    name: group.name,
    columns:
      group.name === "Standings"
        ? ["rank", "managerName", "teamName", "totalPoints", "highestGameweekScore"]
        : ["teamName", ...group.columns],
  })),
  { name: "All Columns" },
];

export default function SeasonStatisticsTable({ stats }: { stats: TeamStats[] }) {
  return (
    <DataTable
      data={stats}
      columns={columns}
      presets={presets}
      groups={groups}
      descriptions={descriptions}
      initialPreset="Standings"
    />
  );
}
