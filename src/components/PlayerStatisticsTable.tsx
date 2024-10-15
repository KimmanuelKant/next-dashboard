// src/components/PlayerStatisticsTable.tsx
"use client";

import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  createColumnHelper,
} 
from '@tanstack/react-table';
import { LeaguePlayer } from '@/types';


const columnHelper = createColumnHelper<LeaguePlayer>();
export default function PlayerStatisticsTable({ players }: { players: LeaguePlayer[] }) {
    const columns = [
        columnHelper.accessor('name', {
          header: 'Player Name',
          enableSorting: true,
        }),
        columnHelper.accessor('position', {
          header: 'Position',
          enableSorting: true,
        }),
        columnHelper.accessor('team', {
          header: 'Team',
          enableSorting: true,
        }),
        columnHelper.accessor('value', {
          header: 'Value',
          cell: ({ getValue }) => `£${getValue().toFixed(1)}m`,
          enableSorting: true,
        }),
        columnHelper.accessor('globalOwnershipCount', {
          header: 'Global Ownership',
          cell: ({ getValue, row }) => {
            const count = getValue();
            const percentage = row.original.globalOwnershipPercentage;
      
            if (percentage === 0 || count === 0) {
              return 'Very low';
            } else {
              return `~${count.toLocaleString()}`;
            }
          },
          enableSorting: true,
        }),
        columnHelper.accessor('globalOwnershipPercentage', {
          header: 'Global Ownership %',
          cell: ({ getValue }) => `${getValue().toFixed(1)}%`,
          enableSorting: true,
        }),
        columnHelper.accessor('leagueOwnershipCount', {
          header: 'League Ownership',
          cell: ({ getValue, row }) => {
            const count = getValue();
            const percentage = row.original.leagueOwnershipPercentage;
      
            if (percentage === 0 || count === 0) {
              return 'Very low';
            } else {
              return count.toString();
            }
          },
          enableSorting: true,
        }),
        columnHelper.accessor('leagueOwnershipPercentage', {
          header: 'League Ownership %',
          cell: ({ getValue }) => `${getValue().toFixed(1)}%`,
          enableSorting: true,
        }),
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
