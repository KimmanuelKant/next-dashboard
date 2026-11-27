// src/components/SeasonStatisticsTable.tsx
"use client";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { ColumnGroup, Preset } from "@/components/DataTable";
import { HighlightCard, toHighlight } from "@/components/Highlights";
import MyTeamButton from "@/components/MyTeamButton";
import Narrow from "@/components/Narrow";
import { useMyTeamId } from "@/lib/myTeam";
import type {
  ChipUse,
  LabelledValue,
  NamedCount,
  SeasonHighlight,
  TeamStats,
} from "@/lib/stats/teamStats";
import type { PositionMove } from "@/lib/stats/leagueHistory";
import { chipCode, chipLabel } from "@/lib/chips";

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
// "▲3 (GW7)", or "▲3" on a phone, where the gameweek waits in the team panel.
const formatMove = (move: PositionMove | null, arrow: string) =>
  move ? (
    <Narrow short={`${arrow}${move.places}`}>
      {arrow}
      {move.places} (GW{move.gw})
    </Narrow>
  ) : (
    "–"
  );
const formatLabelled = (item: LabelledValue | null, signed = false) =>
  item ? `${signed ? formatSigned(item.value) : item.value} (${item.label})` : "–";

const columns = [
  columnHelper.accessor("rank", {
    id: "rank",
    header: "Rank",
    // "3=" for teams level on points, as in the gameweek table.
    cell: ({ row }) => `${row.original.rank}${row.original.rankTied ? "=" : ""}`,
  }),
  columnHelper.accessor("managerName", { id: "managerName", header: "Manager Name" }),
  columnHelper.accessor("teamName", { id: "teamName", header: "Team Name" }),
  columnHelper.accessor("teamId", { id: "teamId", header: "Team ID" }),
  columnHelper.accessor("totalPoints", { id: "totalPoints", header: "Total Points" }),
  columnHelper.accessor("gapToLeader", {
    id: "gapToLeader",
    header: "Gap to Leader",
    // Nothing to show for the leader.
    cell: ({ getValue }) => getValue() || "–",
  }),
  columnHelper.accessor("highestGameweekScore", { id: "highestGameweekScore", header: "Highest GW Score" }),
  columnHelper.accessor("formLast5", { id: "formLast5", header: "Form (Last 5)" }),
  columnHelper.accessor("weeksAboveAverage", { id: "weeksAboveAverage", header: "Weeks Above Average" }),
  columnHelper.accessor((row) => row.scoreSpread ?? undefined, {
    id: "scoreSpread",
    header: "Boom or Bust",
    cell: ({ row }) => row.original.scoreSpread?.toFixed(1) ?? "–",
    sortUndefined: "last",
  }),

  // League race
  columnHelper.accessor("weeksAtTop", { id: "weeksAtTop", header: "Weeks at Top" }),
  columnHelper.accessor("longestRunAtTop", { id: "longestRunAtTop", header: "Longest Run at Top" }),
  columnHelper.accessor("leadsTaken", { id: "leadsTaken", header: "Times Took the Lead" }),
  columnHelper.accessor("weeksAtBottom", { id: "weeksAtBottom", header: "Weeks at Bottom" }),
  columnHelper.accessor("gameweekWins", { id: "gameweekWins", header: "GW Wins" }),
  columnHelper.accessor((row) => row.months.filter((month) => month.won).length, {
    id: "monthsWon",
    header: "Months Won",
    cell: ({ row, getValue }) => {
      const won = row.original.months.filter((month) => month.won);
      if (won.length === 0) return "0";
      return (
        <Narrow short={String(getValue())}>
          {getValue()} ({won.map((month) => month.name.slice(0, 3)).join(", ")})
        </Narrow>
      );
    },
  }),
  columnHelper.accessor((row) => row.months.at(-1)?.points, {
    id: "monthPoints",
    header: "This Month",
    cell: ({ getValue }) => getValue() ?? "–",
    sortUndefined: "last",
  }),
  // Moves sort on the places; a team that never climbed (or fell) goes last.
  columnHelper.accessor((row) => row.biggestClimb?.places, {
    id: "biggestClimb",
    header: "Biggest Climb",
    cell: ({ row }) => formatMove(row.original.biggestClimb, "▲"),
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.biggestFall?.places, {
    id: "biggestFall",
    header: "Biggest Fall",
    cell: ({ row }) => formatMove(row.original.biggestFall, "▼"),
    sortUndefined: "last",
  }),
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
  columnHelper.accessor((row) => row.averageLeaguePosition ?? undefined, {
    id: "averageLeaguePosition",
    header: "Average Position",
    cell: ({ row }) => row.original.averageLeaguePosition?.toFixed(1) ?? "–",
    sortUndefined: "last",
  }),

  // Transfers and value
  columnHelper.accessor("totalTransfers", { id: "totalTransfers", header: "Total Transfers" }),
  columnHelper.accessor((row) => row.freeTransfers ?? undefined, {
    id: "freeTransfers",
    header: "Free Transfers",
    cell: ({ getValue }) => getValue() ?? "–",
    sortUndefined: "last",
  }),
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
  // Sorted by the share that paid off; a manager who never took a hit goes last.
  columnHelper.accessor((row) => (row.hitWeeks ? row.hitsPaidOff / row.hitWeeks : undefined), {
    id: "hitsPaidOff",
    header: "Hits That Paid Off",
    cell: ({ row }) =>
      row.original.hitWeeks ? `${row.original.hitsPaidOff} of ${row.original.hitWeeks}` : "–",
    sortUndefined: "last",
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
  // Sorted on the points; a team with no such player goes last.
  columnHelper.accessor((row) => row.sellersRemorse?.points, {
    id: "sellersRemorse",
    header: "Seller's Remorse",
    cell: ({ row }) => {
      const sold = row.original.sellersRemorse;
      if (!sold) return "–";
      // On a phone the points and the name, on one line; the gameweek is in the team panel.
      return (
        <Narrow short={`${sold.points} ${sold.name}`}>
          {sold.points} ({sold.name}, sold GW{sold.gw})
        </Narrow>
      );
    },
    sortUndefined: "last",
  }),
  columnHelper.accessor((row) => row.biggestProfitSale?.value ?? 0, {
    id: "biggestProfitSale",
    header: "Biggest Profit Sale",
    cell: ({ row }) => {
      const sale = row.original.biggestProfitSale;
      return sale ? `+£${sale.value.toFixed(1)}m (${sale.label})` : "–";
    },
  }),
  columnHelper.accessor("totalSaleProfit", {
    id: "totalSaleProfit",
    header: "Profit on Sales",
    cell: ({ getValue }) => {
      const value = getValue();
      return `${value > 0 ? "+" : value < 0 ? "-" : ""}£${Math.abs(value).toFixed(1)}m`;
    },
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

  // Chips. Chip columns sort on total points; "Not used" sorts last. Chips
  // left come first: what to expect from a rival at the next deadline.
  columnHelper.accessor((row) => row.chipsLeft?.length, {
    id: "chipsLeft",
    header: "Chips Left",
    cell: ({ row }) => {
      const left = row.original.chipsLeft;
      if (left === null) return "–";
      if (left.length === 0) return "None";
      return (
        <Narrow short={left.map(chipCode).join(" ")}>{left.map(chipLabel).join(", ")}</Narrow>
      );
    },
    sortUndefined: "last",
  }),
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
  rank: "The manager's rank within the league. Teams level on points share a rank, marked with =.",
  managerName: "The name of the team manager.",
  teamName: "The name of the team.",
  teamId: "The FPL ID of the team.",
  totalPoints: "Total points this season, after transfer hits.",
  gapToLeader: "Points behind the league's leader on the season total.",
  highestGameweekScore: "The best single gameweek score.",
  formLast5: "Points scored over the last five gameweeks, after transfer hits.",
  weeksAboveAverage: "Gameweeks with a score above the league's average that week, after hits. The average counts only the teams that had a team that week.",
  scoreSpread: "How far the gameweek scores swing either side of the team's own average: their standard deviation, after hits. High is boom or bust, low is steady.",
  weeksAtTop: "Gameweeks spent in first place in this league.",
  longestRunAtTop: "The most gameweeks in a row in first place in this league. Teams level at the top all count as first.",
  leadsTaken: "Gameweeks in which the team went top of the league from a lower place.",
  weeksAtBottom: "Gameweeks spent in last place in this league.",
  monthsWon: "Months of FPL's monthly standings in which the team scored the most points in this league, after hits, with the months. A month counts once all its gameweeks are finished; ties count for everyone tied.",
  monthPoints: "Points in the latest month of FPL's monthly standings, after hits: so far, while the month is played.",
  gameweekWins: "Gameweeks with the highest score in this league, after hits. Ties count for everyone tied.",
  bestLeaguePosition: "The highest position reached in this league.",
  worstLeaguePosition: "The lowest position in this league.",
  averageLeaguePosition: "The average position in this league over the gameweeks the team played.",
  biggestClimb: "The most places gained in this league in one gameweek, and the gameweek.",
  biggestFall: "The most places lost in this league in one gameweek, and the gameweek.",
  totalTransfers: "Transfers made this season.",
  freeTransfers: "Free transfers for the next gameweek, worked out from the team's season with FPL's rules: one more after each deadline, at most five saved, none used on a Wildcard or Free Hit week. Transfers already made for the next gameweek are not taken off.",
  totalTransferPointsDeducted: "Points deducted for extra transfers.",
  transferGain: "What the players bought scored in their first gameweek, minus what the players sold scored that same week. Counts points whether or not the player was in the starting eleven. Free Hit weeks are left out.",
  transferGainAfterHits: "Transfer gain minus the points paid in hits.",
  hitsPaidOff: "Of the gameweeks in which the manager took a hit, those whose transfers gained more than the hit cost that same gameweek.",
  bestTransfer: "The single transfer with the biggest first-week gain.",
  worstTransfer: "The single transfer with the biggest first-week loss.",
  sellersRemorse: "The player sold who has scored the most points since, while out of the squad: from the gameweek he was sold until he was bought back, or until now. Counts his points whether or not he would have started. Free Hit transfers are left out.",
  biggestProfitSale: "The sale that made the most money: selling price minus buying price, with the player and the gameweek he was sold. For a player in the squad from the start, the buying price is his start-of-season price.",
  totalSaleProfit: "Profit and loss on every player sold this season, added up. Free Hit weeks are left out.",
  teamValue: "Squad value including money in the bank.",
  bank: "Money in the bank.",
  wildcardsUsed: "Number of Wildcards played.",
  tripleCaptain: "Points the tripled player scored, and the gameweek. That is the extra gained by playing the chip.",
  benchBoost: "Points the four bench players scored, and the gameweek.",
  freeHit: "The team's score in the Free Hit gameweek.",
  chipsUsed: "Every chip played, with the gameweek.",
  chipsLeft: "Chips the team can still play in this half of the season. Each chip can be played once before the turn of the year and once after.",
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

// Headers for phone-width screens, where the full ones are wider than the data.
// WC, TC, BB, FH and OR are the usual FPL abbreviations.
const shortHeaders: Record<string, string> = {
  rank: "Pos",
  managerName: "Manager",
  teamName: "Team",
  teamId: "ID",
  totalPoints: "Pts",
  gapToLeader: "To 1st",
  highestGameweekScore: "Best GW",
  formLast5: "Form",
  weeksAboveAverage: "Wks > Avg",
  scoreSpread: "Swing",
  weeksAtTop: "Wks 1st",
  longestRunAtTop: "Run 1st",
  leadsTaken: "Leads",
  biggestClimb: "Climb",
  biggestFall: "Fall",
  averageLeaguePosition: "Avg Pos",
  weeksAtBottom: "Wks Last",
  gameweekWins: "Wins",
  monthsWon: "Months",
  monthPoints: "Month",
  freeTransfers: "FTs",
  chipsLeft: "Left",
  bestLeaguePosition: "Best Pos",
  worstLeaguePosition: "Worst Pos",
  totalTransfers: "Trfs",
  totalTransferPointsDeducted: "Hits",
  transferGain: "Trf Gain",
  transferGainAfterHits: "Net Gain",
  hitsPaidOff: "Hits Paid",
  bestTransfer: "Best Trf",
  worstTransfer: "Worst Trf",
  sellersRemorse: "Remorse",
  biggestProfitSale: "Best Sale",
  totalSaleProfit: "Sale Profit",
  teamValue: "Value",
  wildcardsUsed: "WC",
  tripleCaptain: "TC",
  benchBoost: "BB",
  freeHit: "FH",
  chipsUsed: "Chips",
  chipPointsGained: "Chip Pts",
  totalCaptainPoints: "Capt Pts",
  captainPointsPercentage: "Capt %",
  captaincyPointsLost: "Capt Lost",
  perfectCaptainWeeks: "Perfect Wks",
  mostCaptained: "Most Capt",
  captainDiversity: "Captains",
  totalGKPoints: "GK",
  totalDEFPoints: "DEF",
  totalMIDPoints: "MID",
  totalFWDPoints: "FWD",
  pointsOnBench: "Bench",
  biggestBenchedHaul: "Top Benched",
  favouriteClub: "Fav Club",
  mostHeld: "Most Held",
  longestSquadStreak: "Squad Streak",
  longestServingStarter: "Starter Streak",
  yellowCards: "YC",
  redCards: "RC",
  ownGoals: "OG",
  penaltiesMissed: "Pen Miss",
  overallRank: "OR",
  bestOverallRank: "Best OR",
  worstOverallRank: "Worst OR",
  bestGameweekRank: "Best GW Rk",
  worstGameweekRank: "Worst GW Rk",
};

// Each group is both a heading in the column picker and a view.
const groups: ColumnGroup[] = [
  {
    name: "Standings",
    columns: ["rank", "totalPoints", "gapToLeader", "highestGameweekScore", "formLast5", "weeksAboveAverage", "scoreSpread"],
  },
  {
    name: "League race",
    columns: ["weeksAtTop", "longestRunAtTop", "leadsTaken", "weeksAtBottom", "gameweekWins", "monthsWon", "monthPoints", "biggestClimb", "biggestFall", "bestLeaguePosition", "worstLeaguePosition", "averageLeaguePosition"],
  },
  {
    name: "Transfers and value",
    columns: ["totalTransfers", "freeTransfers", "totalTransferPointsDeducted", "transferGain", "transferGainAfterHits", "hitsPaidOff", "bestTransfer", "worstTransfer", "sellersRemorse", "biggestProfitSale", "totalSaleProfit", "teamValue", "bank"],
  },
  {
    name: "Chips",
    columns: ["chipsLeft", "wildcardsUsed", "tripleCaptain", "benchBoost", "freeHit", "chipsUsed", "chipPointsGained"],
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

// The view's button gets a shorter name than the group's heading where
// needed, so that more views fit across a phone.
const viewNames: Record<string, string> = {
  "Transfers and value": "Transfers",
  "Points breakdown": "Points",
};

// What the widest views keep on a phone besides the team name; the rest is
// a tap away ("more columns"), and in the team panel. Views left out are
// narrow enough to show whole. Keyed by the view's name.
const phoneColumns: Record<string, string[]> = {
  Standings: ["rank", "totalPoints", "gapToLeader", "formLast5", "scoreSpread"],
  "League race": ["gameweekWins", "longestRunAtTop", "biggestClimb", "biggestFall"],
  // Free transfers rather than the season's total: what to expect at the
  // next deadline. Net Gain already has the hits taken off; Hits and Value
  // make room for Seller's Remorse.
  Transfers: ["freeTransfers", "transferGainAfterHits", "sellersRemorse"],
  Chips: ["chipsLeft", "wildcardsUsed", "chipPointsGained"],
  Captaincy: ["totalCaptainPoints", "captaincyPointsLost", "mostCaptained"],
};

const presets: Preset[] = [
  ...groups.map((group) => {
    const name = viewNames[group.name] ?? group.name;
    return {
      name,
      columns:
        group.name === "Standings"
          ? ["rank", "managerName", "teamName", "totalPoints", "gapToLeader", "highestGameweekScore", "formLast5", "weeksAboveAverage", "scoreSpread"]
          : ["teamName", ...group.columns],
      phoneColumns: phoneColumns[name],
    };
  }),
  { name: "All columns" },
];

const points = (value: number) => `${value} pts`;

// The card for each of the season's records. `view` must be the name of a
// preset above. Titles are kept short enough for one line on a phone.
const highlightCards: Record<SeasonHighlight["kind"], HighlightCard> = {
  gameweekWins: {
    title: "Most GW wins",
    value: (value) => `${value} ${value === 1 ? "win" : "wins"}`,
    view: "League race",
    column: "gameweekWins",
    desc: true,
  },
  highestScore: {
    title: "Highest GW score",
    value: points,
    view: "Standings",
    column: "highestGameweekScore",
    desc: true,
  },
  monthWinner: {
    title: "Manager of the month",
    value: (value, month) => (month ? `${month}, ${points(value)}` : points(value)),
    view: "League race",
    column: "monthsWon",
    desc: true,
  },
  climb: {
    title: "Biggest climb",
    value: (value, gw) => `▲${value} ${value === 1 ? "place" : "places"}${gw ? `, ${gw}` : ""}`,
    view: "League race",
    column: "biggestClimb",
    desc: true,
  },
  fall: {
    title: "Biggest fall",
    value: (value, gw) => `▼${value} ${value === 1 ? "place" : "places"}${gw ? `, ${gw}` : ""}`,
    view: "League race",
    column: "biggestFall",
    desc: true,
  },
  runAtTop: {
    title: "Longest run at top",
    value: (value) => `${value} ${value === 1 ? "week" : "weeks"} in a row`,
    view: "League race",
    column: "longestRunAtTop",
    desc: true,
  },
  boomOrBust: {
    title: "Most boom or bust",
    value: (value) => `Swings ±${value.toFixed(1)} pts`,
    view: "Standings",
    column: "scoreSpread",
    desc: true,
  },
  transfers: {
    title: "Best transfer gain",
    value: (value) => `+${points(value)}`,
    view: "Transfers",
    column: "transferGainAfterHits",
    desc: true,
  },
  sellersRemorse: {
    title: "Seller's remorse",
    value: (value, player) => (player ? `${player}, ${points(value)}` : points(value)),
    view: "Transfers",
    column: "sellersRemorse",
    desc: true,
  },
  captaincy: {
    title: "Worst captaincy",
    value: (value) => `${points(value)} lost`,
    view: "Captaincy",
    column: "captaincyPointsLost",
    desc: true,
  },
  bench: { title: "Most left on bench", value: points, view: "Points", column: "pointsOnBench", desc: true },
  yellowCards: {
    title: "Most yellow cards",
    value: (value) => `${value} ${value === 1 ? "card" : "cards"}`,
    view: "Mishaps",
    column: "yellowCards",
    desc: true,
  },
};

export default function SeasonStatisticsTable({
  stats,
  highlights,
  leagueName,
}: {
  stats: TeamStats[];
  highlights: SeasonHighlight[];
  leagueName: string;
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
      initialPreset="Standings"
      shortHeaders={shortHeaders}
      stickyColumn="teamName"
      subtitleColumn="managerName"
      wrapColumns={["bestTransfer", "worstTransfer", "biggestProfitSale", "chipsUsed"]}
      detailNoun="team"
      detailHint={
        myTeam === null ? "Select a team to see all its stats, or to mark it as yours." : undefined
      }
      detailAction={(row) => <MyTeamButton teamId={row.teamId} leagueName={leagueName} />}
      highlightRow={(row) => row.teamId === myTeam}
    />
  );
}
