// src/components/PlayerStatisticsTable.tsx
"use client";
import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

interface Player {
  id: number;
  name: string;
}

export default function PlayerStatisticsTable({ players }: { players: Player[] }) {
  const columns: ColumnDef<Player, any>[] = [
    {
      header: 'Player Name',
      accessorKey: 'name',
    },
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
