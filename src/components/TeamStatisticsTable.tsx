// src/components/TeamStatisticsTable.tsx
"use client";
import React, { useState } from "react";
import { Team, ChipData } from '@/types';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  CellContext,
} from "@tanstack/react-table";
import { Dropdown, DropdownButton, Form } from 'react-bootstrap';

const defaultColumns = [
  { header: "Rank", accessorKey: "rank" },
  { header: "Manager Name", accessorKey: "managerName" },
  { header: "Team Name", accessorKey: "teamName" },
  { header: "Team ID", accessorKey: "teamId" },
  { header: "Total Points", accessorKey: "totalPoints" },
  { header: "GW Total", accessorKey: "eventTotal" },
  { header: "Overall Rank", accessorKey: "overallRank" },
  { header: "Total Transfers", accessorKey: "totalTransfers" },
  { header: "GW Transfers", accessorKey: "transfersThisWeek" },
  { header: "Team Value", accessorKey: "teamValue" },
  { header: "Bank", accessorKey: "bank" },
  { header: "Wildcards Used", accessorKey: "wildcardsUsed" },
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
  },
  {
    header: "Chips Used",
    accessorKey: "chipsUsed",
    // Custom cell renderer to display chips as a comma-separated string
    cell: (info: CellContext<Team, string[]>) => info.getValue().join(', '),
  },
  { header: "Total Captain Points", accessorKey: "totalCaptainPoints" },
  {
    header: "Captain Points %",
    accessorKey: "captainPointsPercentage",
    cell: (info: CellContext<Team, number>) => `${info.getValue().toFixed(1)}%`,
  },
  { header: "Points on Bench", accessorKey: "pointsOnBench" },
  { header: "Total Hits", accessorKey: "totalTransferPointsDeducted" },
  { header: "Captain", accessorKey: "captain" },
  { header: "Vice Captain", accessorKey: "viceCaptain" },
  { header: "Highest GW Score", accessorKey: "highestGameweekScore" },
  { header: "Best Overall Rank", accessorKey: "bestOverallRank" },
  { header: "Worst Overall Rank", accessorKey: "worstOverallRank" },
  { header: "Best GW Rank", accessorKey: "highestGameweekRank" },
  { header: "Worst GW Rank", accessorKey: "lowestGameweekRank" },
];

// Component to render the team statistics table
export default function TeamStatisticsTable({ stats }: { stats: Team[] }) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    teamId: false,
  });

  // Initialize the table using React Table library
  const table = useReactTable({
    data: stats,
    columns: defaultColumns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2">
      {/* Column Visibility Dropdown */}
      <div className="mb-3">
        <DropdownButton id="columnVisibilityDropdown" title="Columns" size="sm" variant="secondary" autoClose="outside">
          {table.getAllLeafColumns().map(column => (
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
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
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
