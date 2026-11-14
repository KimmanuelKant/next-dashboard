// src/components/PlayerStatisticsTable.tsx
"use client";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { Preset } from "@/components/DataTable";
import type { PlayerStats } from "@/lib/stats/playerStats";

const columnHelper = createColumnHelper<PlayerStats>();

const percent = (value: number) => `${value.toFixed(1)}%`;
const signedPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}`;

const columns = [
  columnHelper.accessor("name", { id: "name", header: "Player" }),
  columnHelper.accessor("position", { id: "position", header: "Position" }),
  columnHelper.accessor("club", { id: "club", header: "Club" }),
  columnHelper.accessor("value", {
    id: "value",
    header: "Price",
    cell: ({ getValue }) => `£${getValue().toFixed(1)}m`,
  }),
  columnHelper.accessor("totalPoints", { id: "totalPoints", header: "Total Points" }),
  columnHelper.accessor("gameweekPoints", { id: "gameweekPoints", header: "GW Points" }),
  columnHelper.accessor("form", {
    id: "form",
    header: "Form",
    cell: ({ getValue }) => getValue().toFixed(1),
  }),
  columnHelper.accessor("leagueOwnershipCount", { id: "leagueOwnershipCount", header: "League Owners" }),
  columnHelper.accessor("leagueOwnershipPercentage", {
    id: "leagueOwnershipPercentage",
    header: "League Ownership %",
    cell: ({ getValue }) => percent(getValue()),
  }),
  columnHelper.accessor("globalOwnershipPercentage", {
    id: "globalOwnershipPercentage",
    header: "Global Ownership %",
    cell: ({ getValue }) => percent(getValue()),
  }),
  columnHelper.accessor("ownershipDifference", {
    id: "ownershipDifference",
    header: "League vs Global",
    cell: ({ getValue }) => signedPercent(getValue()),
  }),
  columnHelper.accessor("globalOwnershipCount", {
    id: "globalOwnershipCount",
    header: "Global Owners",
    cell: ({ getValue }) => `~${getValue().toLocaleString("en-GB")}`,
  }),
  columnHelper.accessor("leagueStartingCount", { id: "leagueStartingCount", header: "Starting" }),
  columnHelper.accessor("effectiveOwnership", {
    id: "effectiveOwnership",
    header: "Effective Ownership %",
    cell: ({ getValue }) => percent(getValue()),
  }),
  columnHelper.accessor("leagueCaptainCount", { id: "leagueCaptainCount", header: "Captained" }),
  columnHelper.accessor("leagueViceCaptainCount", { id: "leagueViceCaptainCount", header: "Vice Captained" }),
  columnHelper.accessor((row) => row.owners.length, {
    id: "owners",
    header: "Owned By",
    cell: ({ row }) => row.original.owners.join(", "),
  }),
];

const descriptions: Record<string, string> = {
  name: "The player's name.",
  position: "The player's position.",
  club: "The Premier League club the player belongs to.",
  value: "The player's current price.",
  totalPoints: "Points the player has scored this season.",
  gameweekPoints: "Points the player has scored in the current gameweek.",
  form: "Average points per match over the last 30 days.",
  leagueOwnershipCount: "Number of managers in this league who own the player.",
  leagueOwnershipPercentage: "Share of managers in this league who own the player.",
  globalOwnershipPercentage: "Share of all FPL managers who own the player.",
  ownershipDifference: "League ownership minus global ownership, in percentage points. Negative means the player is rarer here than in the game overall.",
  globalOwnershipCount: "Approximate number of FPL managers worldwide who own the player.",
  leagueStartingCount: "Number of managers in this league with the player in their starting eleven.",
  effectiveOwnership: "Ownership weighted by points multiplier: a captain counts twice, a benched player not at all.",
  leagueCaptainCount: "Number of managers in this league who captained the player.",
  leagueViceCaptainCount: "Number of managers in this league who vice-captained the player.",
  owners: "The teams in this league that own the player.",
};

const presets: Preset[] = [
  {
    name: "Differentials",
    columns: ["name", "club", "value", "gameweekPoints", "leagueOwnershipCount", "leagueOwnershipPercentage", "globalOwnershipPercentage", "ownershipDifference", "owners"],
  },
  {
    name: "Ownership Overview",
    columns: ["name", "leagueOwnershipCount", "leagueOwnershipPercentage", "leagueStartingCount", "effectiveOwnership", "globalOwnershipPercentage", "globalOwnershipCount"],
  },
  {
    name: "Captaincy Overview",
    columns: ["name", "leagueCaptainCount", "leagueViceCaptainCount", "effectiveOwnership", "gameweekPoints"],
  },
  {
    name: "Player Details",
    columns: ["name", "position", "club", "value", "totalPoints", "form"],
  },
  { name: "All Columns" },
];

export default function PlayerStatisticsTable({ players }: { players: PlayerStats[] }) {
  return (
    <DataTable
      data={players}
      columns={columns}
      presets={presets}
      descriptions={descriptions}
      initialPreset="Differentials"
      initialSorting={[{ id: "leagueOwnershipCount", desc: false }]}
    />
  );
}
