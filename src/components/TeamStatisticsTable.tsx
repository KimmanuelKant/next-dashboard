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
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { Dropdown, DropdownButton, Form } from "react-bootstrap";

// Create a column helper for the Team type
const columnHelper = createColumnHelper<Team>();

// Define your columns using the column helper
const defaultColumns = [
  columnHelper.accessor('rank', {
    header: 'Rank',
    enableSorting: true,
  }),
  columnHelper.accessor('managerName', {
    header: 'Manager Name',
    enableSorting: true,
  }),
  columnHelper.accessor('teamName', {
    header: 'Team Name',
    enableSorting: true,
  }),
  columnHelper.accessor('teamId', {
    header: 'Team ID',
    enableSorting: true,
  }),
  columnHelper.accessor('totalPoints', {
    header: 'Total Points',
    enableSorting: true,
  }),
  columnHelper.accessor('eventTotal', {
    header: 'GW Total',
    enableSorting: true,
  }),
  columnHelper.accessor('overallRank', {
    header: 'Overall Rank',
    enableSorting: true,
  }),
  columnHelper.accessor('totalTransfers', {
    header: 'Total Transfers',
    enableSorting: true,
  }),
  columnHelper.accessor('transfersThisWeek', {
    header: 'GW Transfers',
    enableSorting: true,
  }),
  columnHelper.accessor('teamValue', {
    header: 'Team Value',
    enableSorting: true,
  }),
  columnHelper.accessor('bank', {
    header: 'Bank',
    enableSorting: true,
  }),
  columnHelper.accessor('wildcardsUsed', {
    header: 'Wildcards Used',
    enableSorting: true,
  }),
  // Custom cell renderer for tripleCaptainData
  columnHelper.accessor('tripleCaptainData', {
    header: 'Triple Captain',
    cell: ({ getValue }) => {
      const data = getValue() as ChipData | null;
      if (data) {
        return `${data.points} (GW:${data.gw})`;
      } else {
        return 'Not used';
      }
    },
    enableSorting: true,
  }),
  // Custom cell renderer for benchBoostData
  columnHelper.accessor('benchBoostData', {
    header: 'Bench Boost',
    cell: ({ getValue }) => {
      const data = getValue() as ChipData | null;
      if (data) {
        return `${data.points} (GW:${data.gw})`;
      } else {
        return 'Not used';
      }
    },
    enableSorting: true,
  }),
  // Custom cell renderer for freeHitData
  columnHelper.accessor('freeHitData', {
    header: 'Free Hit',
    cell: ({ getValue }) => {
      const data = getValue() as ChipData | null;
      if (data) {
        return `${data.points} (GW:${data.gw})`;
      } else {
        return 'Not used';
      }
    },
    enableSorting: true,
  }),
  // Custom cell renderer for chipsUsed
  columnHelper.accessor('chipsUsed', {
    header: 'Chips Used',
    cell: ({ getValue }) => getValue().join(', '),
    enableSorting: true,
  }),
  columnHelper.accessor('totalCaptainPoints', {
    header: 'Total Captain Points',
    enableSorting: true,
  }),
  // Custom cell renderer for captainPointsPercentage
  columnHelper.accessor('captainPointsPercentage', {
    header: 'Captain Points %',
    cell: ({ getValue }) => `${getValue().toFixed(1)}%`,
    enableSorting: true,
  }),
  columnHelper.accessor('pointsOnBench', {
    header: 'Points on Bench',
    enableSorting: true,
  }),
  columnHelper.accessor('totalTransferPointsDeducted', {
    header: 'Total Hits',
    enableSorting: true,
  }),
  columnHelper.accessor('captain', {
    header: 'Captain',
    enableSorting: true,
  }),
  columnHelper.accessor('viceCaptain', {
    header: 'Vice Captain',
    enableSorting: true,
  }),
  columnHelper.accessor('highestGameweekScore', {
    header: 'Highest GW Score',
    enableSorting: true,
  }),
  columnHelper.accessor('bestOverallRank', {
    header: 'Best Overall Rank',
    enableSorting: true,
  }),
  columnHelper.accessor('worstOverallRank', {
    header: 'Worst Overall Rank',
    enableSorting: true,
  }),
  columnHelper.accessor('highestGameweekRank', {
    header: 'Best GW Rank',
    enableSorting: true,
  }),
  columnHelper.accessor('lowestGameweekRank', {
    header: 'Worst GW Rank',
    enableSorting: true,
  }),
  columnHelper.accessor('totalGKPoints', {
    header: 'GK Points',
    enableSorting: true,
  }),
  columnHelper.accessor('totalDEFPoints', {
    header: 'DEF Points',
    enableSorting: true,
  }),
  columnHelper.accessor('totalMIDPoints', {
    header: 'MID Points',
    enableSorting: true,
  }),
  columnHelper.accessor('totalFWDPoints', {
    header: 'FWD Points',
    enableSorting: true,
  }),
];

// Define presets
interface Preset {
  name: string;
  columns: string[];
}

const presets: Preset[] = [
  {
    name: 'Default View',
    columns: ['rank', 'managerName', 'teamName', 'totalPoints', 'eventTotal'],
  },
  {
    name: 'Transfers and Value',
    columns: ['managerName', 'totalTransfers', 'teamValue', 'bank'],
  },
  {
    name: 'Chips Usage',
    columns: ['managerName', 'wildcardsUsed', 'tripleCaptainData', 'benchBoostData'],
  },
  // Add more presets as needed
];

// Component to render the team statistics table
export default function TeamStatisticsTable({ stats }: { stats: Team[] }) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    teamId: false,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');

  // Initialize the table using React Table library
  const table = useReactTable({
    data: stats,
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
      {/* Preset Dropdown */}
      <div className="mb-3">
        <label htmlFor="preset-select">Select View: </label>
        <select
          id="preset-select"
          value={selectedPresetName}
          onChange={(e) => {
            const presetName = e.target.value;
            setSelectedPresetName(presetName);
            const selectedPreset = presets.find((p) => p.name === presetName);
            if (selectedPreset) {
              // Create a visibility map
              const visibilityMap: VisibilityState = {};
              defaultColumns.forEach((col) => {
                const key = col.id;
                if (typeof key === 'string') {
                  visibilityMap[key] = selectedPreset.columns.includes(key);
                }
              });
              setColumnVisibility(visibilityMap);
            }
          }}
        >
          <option value="">-- Select a Preset --</option>
          {presets.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

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
