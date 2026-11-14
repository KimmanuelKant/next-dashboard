// src/components/DataTable.tsx
"use client";
import React, { useState } from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Dropdown, DropdownButton, Form, OverlayTrigger, Popover } from "react-bootstrap";
import { InfoCircleFill } from "react-bootstrap-icons";

export interface Preset {
  name: string;
  /** Column ids to show. Omit to show every column. */
  columns?: string[];
}

interface DataTableProps<T> {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  presets: Preset[];
  /** Column id -> explanation shown in the column picker. */
  descriptions: Record<string, string>;
  /** Name of the preset applied on first render. */
  initialPreset: string;
  initialSorting?: SortingState;
  /** Hide the per-column picker (for tables whose presets cover every useful view). */
  hideColumnPicker?: boolean;
  /** Shown instead of rows when there is no data. */
  emptyMessage?: string;
}

function visibilityFor<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[],
  preset: Preset | undefined
): VisibilityState {
  const visibility: VisibilityState = {};
  for (const column of columns) {
    const id = column.id as string;
    visibility[id] = !preset?.columns || preset.columns.includes(id);
  }
  return visibility;
}

export default function DataTable<T>({
  data,
  columns,
  presets,
  descriptions,
  initialPreset,
  initialSorting = [],
  hideColumnPicker = false,
  emptyMessage = "Nothing to show.",
}: DataTableProps<T>) {
  const [presetName, setPresetName] = useState(initialPreset);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    visibilityFor(columns, presets.find((p) => p.name === initialPreset))
  );
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, sorting },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <DropdownButton
          id="presetDropdown"
          title={presetName || "Preset Views"}
          size="sm"
          variant="secondary"
        >
          {presets.map((preset) => (
            <Dropdown.Item
              key={preset.name}
              active={preset.name === presetName}
              onClick={() => {
                setPresetName(preset.name);
                setColumnVisibility(visibilityFor(columns, preset));
              }}
            >
              {preset.name}
            </Dropdown.Item>
          ))}
        </DropdownButton>

        {!hideColumnPicker && (
        <DropdownButton
          id="columnVisibilityDropdown"
          title="Columns"
          size="sm"
          variant="secondary"
          autoClose="outside"
          align="end"
        >
          {table.getAllLeafColumns().map((column) => (
            <Dropdown.Item key={column.id} as="div">
              <div className="d-flex align-items-center">
                <Form.Check
                  type="checkbox"
                  id={`column-${column.id}`}
                  label={String(column.columnDef.header)}
                  checked={column.getIsVisible()}
                  onChange={(e) => {
                    setPresetName("");
                    column.toggleVisibility(e.target.checked);
                  }}
                />
                {descriptions[column.id] && (
                  <OverlayTrigger
                    trigger="click"
                    rootClose
                    placement="left"
                    overlay={
                      <Popover id={`popover-${column.id}`}>
                        <Popover.Body>{descriptions[column.id]}</Popover.Body>
                      </Popover>
                    }
                  >
                    <InfoCircleFill
                      className="ms-2"
                      role="button"
                      size={16}
                      aria-label={`About ${String(column.columnDef.header)}`}
                    />
                  </OverlayTrigger>
                )}
              </div>
            </Dropdown.Item>
          ))}
        </DropdownButton>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-striped table-sm align-middle">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      data-sortable="true"
                      onClick={header.column.getToggleSortingHandler()}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                          ? "descending"
                          : undefined
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === "asc" ? " ▲" : sorted === "desc" ? " ▼" : null}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="text-center text-secondary py-4"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
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
    </div>
  );
}
