// src/components/TeamStatisticsTable.tsx
"use client";
import React, { useState } from "react";
import { Team, ChipData } from "@/types";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  VisibilityState,
  CellContext,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { Dropdown, DropdownButton, Form } from "react-bootstrap";

const defaultColumns = [
  { header: "Rank", accessorKey: "rank", enableSorting: true },
  { header: "Manager Name", accessorKey: "managerName", enableSorting: true },
  { header: "Team Name", accessorKey: "teamName", enableSorting: true },
  { header: "Team ID", accessorKey: "teamId", enableSorting: true },
  { header: "Total Points", accessorKey: "totalPoints", enableSorting: true },
  { header: "GW Total", accessorKey: "eventTotal", enableSorting: true },
  { header: "Overall Rank", accessorKey: "overallRank", enableSorting: true },
  {
    header: "Total Transfers",
    accessorKey: "totalTransfers",
    enableSorting: true,
  },
  {
    header: "GW Transfers",
    accessorKey: "transfersThisWeek",
    enableSorting: true,
  },
  { header: "Team Value", accessorKey: "teamValue", enableSorting: true },
  { header: "Bank", accessorKey: "bank", enableSorting: true },
  {
    header: "Wildcards Used",
    accessorKey: "wildcardsUsed",
    enableSorting: true,
  },
  {
    header: "Triple Captain",
    accessorKey: "tripleCaptainData",
    cell: ({ getValue }: CellContext<Team, ChipData | null>) => {
      const data = getValue();
      if (data) {
        return `${data.points} (GW:${data.gw})`;
      } else {
        return "Not used";
      }
    },
    enableSorting: true,
  },
  {
    header: "Bench Boost",
    accessorKey: "benchBoostData",
    cell: ({ getValue }: CellContext<Team, ChipData | null>) => {
      const data = getValue();
      if (data) {
        return `${data.points} (GW:${data.gw})`;
      } else {
        return "Not used";
      }
    },
    enableSorting: true,
  },
  {
    header: "Free Hit",
    accessorKey: "freeHitData",
    cell: ({ getValue }: CellContext<Team, ChipData | null>) => {
      const data = getValue();
      if (data) {
        return `${data.points} (GW:${data.gw})`;
      } else {
        return "Not used";
      }
    },
    enableSorting: true,
  },
  {
    header: "Chips Used",
    accessorKey: "chipsUsed",
    // Custom cell renderer to display chips as a comma-separated string
    cell: (info: CellContext<Team, string[]>) => info.getValue().join(", "),
    enableSorting: true,
  },
  {
    header: "Total Captain Points",
    accessorKey: "totalCaptainPoints",
    enableSorting: true,
  },
  {
    header: "Captain Points %",
    accessorKey: "captainPointsPercentage",
    cell: (info: CellContext<Team, number>) => `${info.getValue().toFixed(1)}%`,
    enableSorting: true,
  },
  {
    header: "Points on Bench",
    accessorKey: "pointsOnBench",
    enableSorting: true,
  },
  {
    header: "Total Hits",
    accessorKey: "totalTransferPointsDeducted",
    enableSorting: true,
  },
  { header: "Captain", accessorKey: "captain", enableSorting: true },
  { header: "Vice Captain", accessorKey: "viceCaptain", enableSorting: true },
  {
    header: "Highest GW Score",
    accessorKey: "highestGameweekScore",
    enableSorting: true,
  },
  {
    header: "Best Overall Rank",
    accessorKey: "bestOverallRank",
    enableSorting: true,
  },
  {
    header: "Worst Overall Rank",
    accessorKey: "worstOverallRank",
    enableSorting: true,
  },
  {
    header: "Best GW Rank",
    accessorKey: "highestGameweekRank",
    enableSorting: true,
  },
  {
    header: "Worst GW Rank",
    accessorKey: "lowestGameweekRank",
    enableSorting: true,
  },
  { header: "GK Points", accessorKey: "totalGKPoints", enableSorting: true },
  { header: "DEF Points", accessorKey: "totalDEFPoints", enableSorting: true },
  { header: "MID Points", accessorKey: "totalMIDPoints", enableSorting: true },
  { header: "FWD Points", accessorKey: "totalFWDPoints", enableSorting: true },
];

// Component to render the team statistics table
export default function TeamStatisticsTable({ stats }: { stats: Team[] }) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    teamId: false,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Initialize the table using React Table library
  const table = useReactTable({
    data: stats,
    columns: defaultColumns,
    state: {
      columnVisibility,
      sorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="p-2">
      {/* Column Visibility Dropdown */}
      <div className="mb-3">
        <DropdownButton
          id="columnVisibilityDropdown"
          title="Columns"
          size="sm"
          variant="secondary"
          autoClose="outside"
        >
          {table.getAllLeafColumns().map((column) => (
            <Dropdown.Item key={column.id} as="div">
              <Form.Check
                type="checkbox"
                id={`column-${column.id}`}
                label={column.columnDef.header as string}
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
              />
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </div>

      {/* Table */}
      <table className="table table-bordered table-striped">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: 'pointer' }}
                >
                  {header.isPlaceholder ? null : (
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>


        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
