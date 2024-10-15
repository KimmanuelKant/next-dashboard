// src/components/PlayerStatisticsTable.tsx
"use client";

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { LeaguePlayer } from '@/types';
import { Dropdown, DropdownButton, Form } from 'react-bootstrap';

export default function PlayerStatisticsTable({ players }: { players: LeaguePlayer[] }) {
  const columnHelper = createColumnHelper<LeaguePlayer>();

  // Define columns using the column helper
  const defaultColumns = [
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
    // Add more columns as needed
  ];

  // Define presets
  interface Preset {
    name: string;
    columns: string[];
  }

  const presets: Preset[] = [
    {
      name: 'All Columns',
      columns: defaultColumns.map((col) => col.id as string),
    },
    {
      name: 'Ownership Overview',
      columns: [
        'name',
        'globalOwnershipPercentage',
        'globalOwnershipCount',
        'leagueOwnershipPercentage',
        'leagueOwnershipCount',
      ],
    },
    {
      name: 'Player Details',
      columns: [
        'name',
        'position',
        'team',
        'value',
      ],
    },
    // Add more presets as needed
  ];

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');

  // Initialize the table using React Table library
  const table = useReactTable({
    data: players,
    columns: defaultColumns,
    state: {
      columnVisibility,
      sorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="p-2">
      {/* Controls Container */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Preset Dropdown */}
        <DropdownButton
          id="presetDropdown"
          title={selectedPresetName || "Preset Views"}
          size="sm"
          variant="secondary"
        >
          {presets.map((preset) => (
            <Dropdown.Item
              key={preset.name}
              onClick={() => {
                setSelectedPresetName(preset.name);
                const selectedPreset = presets.find((p) => p.name === preset.name);
                if (selectedPreset) {
                  // Create a visibility map
                  const visibilityMap: VisibilityState = {};
                  defaultColumns.forEach((col) => {
                    const key = col.id as string;
                    visibilityMap[key] = selectedPreset.columns.includes(key);
                  });
                  setColumnVisibility(visibilityMap);
                }
              }}
            >
              {preset.name}
            </Dropdown.Item>
          ))}
        </DropdownButton>

        {/* Column Visibility Dropdown */}
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
                label={String(column.columnDef.header)}
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
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
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
