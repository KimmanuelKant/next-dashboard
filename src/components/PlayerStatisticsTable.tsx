// src/components/PlayerStatisticsTable.tsx
"use client";

import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

import { LeaguePlayer } from '@/types';

export default function PlayerStatisticsTable({ players }: { players: LeaguePlayer[] }) {
  const columns: ColumnDef<LeaguePlayer, any>[] = [
    {
      header: 'Player Name',
      accessorKey: 'name',
    },
    {
      header: 'Position',
      accessorKey: 'position',
    },
    {
      header: 'Team',
      accessorKey: 'team',
    },
    {
      header: 'Value',
      accessorKey: 'value',
      cell: (info) => `£${info.getValue().toFixed(1)}m`,
    },
    {
      header: 'Global Ownership',
      accessorKey: 'globalOwnershipCount',
      cell: (info) => info.getValue().toLocaleString(),
      enableSorting: true,
    },
    {
      header: 'Global Ownership %',
      accessorKey: 'globalOwnershipPercentage',
      cell: (info) => `${info.getValue().toFixed(1)}%`,
      enableSorting: true,
    },
    {
      header: 'League Ownership',
      accessorKey: 'leagueOwnershipCount',
      cell: (info) => info.getValue(),
      enableSorting: true,
    },
    {
      header: 'League Ownership %',
      accessorKey: 'leagueOwnershipPercentage',
      cell: (info) => `${info.getValue().toFixed(1)}%`,
      enableSorting: true,
    },
    // Other columns...
  ];

  const table = useReactTable({
    data: players,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="table table-bordered table-striped">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
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
  );
}
