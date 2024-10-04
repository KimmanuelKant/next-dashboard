// src/components/TeamStatisticsTable.tsx
"use client";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Team } from '@/types';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const columns: ColumnDef<Team>[] = [
  {
    header: "Rank",
    accessorKey: "rank",
  },
  {
    header: "Manager Name",
    accessorKey: "managerName",
  },
  {
    header: "Team Name",
    accessorKey: "teamName",
  },
  {
    header: "Total Points",
    accessorKey: "totalPoints",
  },
  {
    header: "Event Total",
    accessorKey: "eventTotal",
  },
];

export default function TeamStatisticsTable({ stats }: { stats: Team[] }) {
  const [data] = React.useState<Team[]>(stats);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2">
      <table className="table table-bordered table-striped">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
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
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
