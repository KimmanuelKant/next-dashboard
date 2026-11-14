// src/components/LeagueHistoryTable.tsx
"use client";
import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { Preset } from "@/components/DataTable";
import { useMyTeamId } from "@/lib/myTeam";
import type { LeagueHistory, LeagueHistoryRow } from "@/lib/stats/leagueHistory";

const columnHelper = createColumnHelper<LeagueHistoryRow>();

const SUMMARY = ["weeksAtTop", "weeksAtBottom", "gameweekWins", "bestPosition", "worstPosition"];

const descriptions: Record<string, string> = {};

export default function LeagueHistoryTable({ history }: { history: LeagueHistory }) {
  const myTeam = useMyTeamId();
  const { columns, presets } = useMemo(() => {
    const positionIds = history.gameweeks.map((gw) => `pos${gw}`);
    const scoreIds = history.gameweeks.map((gw) => `pts${gw}`);

    const columns = [
      columnHelper.accessor("teamName", { id: "teamName", header: "Team" }),
      columnHelper.accessor("managerName", { id: "managerName", header: "Manager" }),
      columnHelper.accessor("weeksAtTop", { id: "weeksAtTop", header: "Weeks at Top" }),
      columnHelper.accessor("weeksAtBottom", { id: "weeksAtBottom", header: "Weeks at Bottom" }),
      columnHelper.accessor("gameweekWins", { id: "gameweekWins", header: "GW Wins" }),
      columnHelper.accessor("bestPosition", {
        id: "bestPosition",
        header: "Best",
        cell: ({ getValue }) => getValue() ?? "–",
      }),
      columnHelper.accessor("worstPosition", {
        id: "worstPosition",
        header: "Worst",
        cell: ({ getValue }) => getValue() ?? "–",
      }),
      ...history.gameweeks.map((gw, i) =>
        // Missing weeks sort last in either direction.
        columnHelper.accessor((row) => row.positions[i] ?? undefined, {
          id: positionIds[i],
          header: `GW${gw}`,
          cell: ({ getValue }) => getValue() ?? "–",
          sortUndefined: "last",
        })
      ),
      ...history.gameweeks.map((gw, i) =>
        columnHelper.accessor((row) => row.scores[i] ?? undefined, {
          id: scoreIds[i],
          header: `GW${gw}`,
          cell: ({ getValue }) => getValue() ?? "–",
          sortUndefined: "last",
        })
      ),
    ];

    const presets: Preset[] = [
      { name: "League position", columns: ["teamName", ...positionIds] },
      { name: "Gameweek score (after hits)", columns: ["teamName", ...scoreIds] },
      { name: "Summary", columns: ["teamName", "managerName", ...SUMMARY] },
    ];
    return { columns, presets };
  }, [history]);

  const lastGw = history.gameweeks[history.gameweeks.length - 1];

  return (
    <DataTable
      data={history.rows}
      columns={columns}
      presets={presets}
      descriptions={descriptions}
      initialPreset="League position"
      initialSorting={lastGw !== undefined ? [{ id: `pos${lastGw}`, desc: false }] : []}
      hideColumnPicker
      stickyColumn="teamName"
      highlightRow={(row) => row.teamId === myTeam}
    />
  );
}
