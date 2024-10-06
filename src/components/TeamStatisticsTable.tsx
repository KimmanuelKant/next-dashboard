// src/components/TeamStatisticsTable.tsx
"use client";
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Team } from '@/types';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export default function TeamStatisticsTable({ stats }: { stats: Team[] }) {
  const [columnsVisibility, setColumnsVisibility] = useState<{ [key: string]: boolean }>({});

  const defaultColumns: ColumnDef<Team>[] = [
    { header: "Rank", accessorKey: "rank" },
    { header: "Manager Name", accessorKey: "managerName" },
    { header: "Team Name", accessorKey: "teamName" },
    { header: "Total Points", accessorKey: "totalPoints" },
    { header: "Event Total", accessorKey: "eventTotal" },
    { header: "Overall Rank", accessorKey: "overallRank" },
    { header: "Total Transfers", accessorKey: "totalTransfers" },
    { header: "Transfers This Week", accessorKey: "transfersThisWeek" },
    { header: "Team Value", accessorKey: "teamValue" },
    { header: "Bank", accessorKey: "bank" },
    {
      header: "Chips Used",
      accessorKey: "chipsUsed",
      cell: info => (info.getValue() as string[]).join(', '),
    },
    { header: "Points on Bench", accessorKey: "pointsOnBench" },
    { header: "Captain", accessorKey: "captain" },
    { header: "Vice Captain", accessorKey: "viceCaptain" },
  ];

  const columns = defaultColumns.filter(column => columnsVisibility[column.accessorKey as string] !== false);

  const table = useReactTable({
    data: stats,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Handler for toggling column visibility
  const toggleColumn = (accessorKey: string) => {
    setColumnsVisibility(prev => ({
      ...prev,
      [accessorKey]: !prev[accessorKey],
    }));
  };

  return (
    <div className="p-2">
      {/* Column Toggle Buttons */}
      <div className="mb-3">
        {defaultColumns.map(column => (
          <button
            key={column.accessorKey as string}
            onClick={() => toggleColumn(column.accessorKey as string)}
            className="btn btn-secondary btn-sm me-1"
          >
            {columnsVisibility[column.accessorKey as string] === false ? `Show ${column.header}` : `Hide ${column.header}`}
          </button>
        ))}
      </div>
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
