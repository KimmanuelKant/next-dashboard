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
import { Dropdown, DropdownButton, Form, OverlayTrigger, Popover } from "react-bootstrap";
import { InfoCircleFill } from 'react-bootstrap-icons';

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

/*
defaultColumns.forEach((col, index) => {
  console.log(`Column ${index}:`, col);
});
*/

// Column descriptions for tooltips
const columnDescriptions: { [key: string]: string } = {
  rank: "The manager's rank within the league.",
  managerName: "The name of the team manager.",
  teamName: "The name of the team.",
  teamId: "The ID of the team.",
  totalPoints: "The total points scored by the team.",
  eventTotal: "The total points scored in the current gameweek.",
  overallRank: "The team's current overall rank.",
  totalTransfers: "The total number of transfers made by the manager.",
  transfersThisWeek: "The number of transfers made in the current gameweek.",
  teamValue: "The total value of the team.",
  bank: "The amount of money in the bank.",
  wildcardsUsed: "The number of wildcards used.",
  tripleCaptainData: "The points scored and gameweek of the Triple Captain chip.",
  benchBoostData: "The points scored and gameweek of the Bench Boost chip.",
  freeHitData: "The points scored and gameweek of the Free Hit chip.",
  chipsUsed: "The chips used by the manager.",
  totalCaptainPoints: "The total points scored by the captain.",
  captainPointsPercentage: "The percentage of points scored by the captain.",
  pointsOnBench: "The points scored by players on the bench.",
  totalTransferPointsDeducted: "The total points deducted from hits.",
  captain: "The captain of the team.",
  viceCaptain: "The vice captain of the team.",
  highestGameweekScore: "The highest score in a gameweek.",
  bestOverallRank: "The best overall rank achieved.",
  worstOverallRank: "The worst overall rank achieved.",
  highestGameweekRank: "The best rank in a gameweek.",
  lowestGameweekRank: "The worst rank in a gameweek.",
  totalGKPoints: "The total points scored by goalkeepers.",
  totalDEFPoints: "The total points scored by defenders.",
  totalMIDPoints: "The total points scored by midfielders.",
  totalFWDPoints: "The total points scored by forwards.",
};


// Define presets
interface Preset {
  name: string;
  columns: string[];
}

const presets: Preset[] = [
  {
    name: 'All Columns',
    columns: [
      'rank',
      'managerName',
      'teamName',
      'teamId',
      'totalPoints',
      'eventTotal',
      'overallRank',
      'totalTransfers',
      'transfersThisWeek',
      'teamValue',
      'bank',
      'wildcardsUsed',
      'tripleCaptainData',
      'benchBoostData',
      'freeHitData',
      'chipsUsed',
      'totalCaptainPoints',
      'captainPointsPercentage',
      'pointsOnBench',
      'totalTransferPointsDeducted',
      'captain',
      'viceCaptain',
      'highestGameweekScore',
      'bestOverallRank',
      'worstOverallRank',
      'highestGameweekRank',
      'lowestGameweekRank',
      'totalGKPoints',
      'totalDEFPoints',
      'totalMIDPoints',
      'totalFWDPoints',
    ],
  },
  {
    name: 'Default View',
    columns: [
      'rank', 
      'managerName', 
      'teamName', 
      'totalPoints', 
      'eventTotal'],
  },
  {
    name: 'Transfers and Value',
    columns: [
      'managerName', 
      'totalTransfers', 
      'teamValue', 
      'bank',
    ],
  },
  {
    name: 'Chips Usage',
    columns: [
      'managerName', 
      'wildcardsUsed', 
      'tripleCaptainData', 
      'benchBoostData',
      'freeHitData',
    ],
  },
  {
    name: 'Captaincy',
    columns: [
      'managerName', 
      'captain', 
      'viceCaptain', 
      'totalCaptainPoints',
      'captainPointsPercentage',
    ],
  },
  {
    name: 'Rankings',
    columns: [
      'managerName', 
      'overallRank', 
      'bestOverallRank', 
      'worstOverallRank',
      'highestGameweekRank',
      'lowestGameweekRank',
    ],
  },
  {
    name: 'Points Distribution',
    columns: [
      'managerName', 
      'totalGKPoints', 
      'totalDEFPoints', 
      'totalMIDPoints',
      'totalFWDPoints',
      'totalPoints',
    ],
  },
];

/*()
console.log('Preset Columns:', presets.map((preset) => ({
  name: preset.name,
  columns: preset.columns,
}))); */


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
              <div
                className="d-flex align-items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Form.Check
                  type="checkbox"
                  id={`column-${column.id}`}
                  label={String(column.columnDef.header)}
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {columnDescriptions[column.id as string] && (
                  <OverlayTrigger
                    trigger="click"
                    placement="left"
                    overlay={
                      <Popover id={`popover-${column.id}`}>
                        <Popover.Body>
                          {columnDescriptions[column.id as string]}
                        </Popover.Body>
                      </Popover>
                    }
                  >
                    <InfoCircleFill
                      className="ms-2"
                      style={{ cursor: 'pointer' }}
                      size={16}
                      aria-label={`Info about ${column.columnDef.header}`}
                    />
                  </OverlayTrigger>
                )}
              </div>
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