"use client";
import * as React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface Team {
  rank: string;
  managerName: string;
  teamName: number;
  totalPoints: number;
  eventTotal: number;
}

const columns: ColumnDef<Team>[] = [
  {
    header: "More Info",
    columns: [
      {
        accessorKey: "rank",
        header: () => <span>Rank</span>,
      },
      {
        accessorKey: "managerName",
        header: () => <span>Manager Name</span>,
      },
      {
        accessorKey: "teamName",
        header: "Team Name",
      },
      {
        accessorKey: "totalPoints",
        header: "Total Points",
      },
      {
        accessorKey: "eventTotal",
        header: "Event Total",
      },
    ],
  },
];

export default function TeamStatisticsTable(props: { stats: Team[] }) {
  const { stats } = props;

  console.log(stats);

  const [data, setData] = React.useState(stats);
  const rerender = () => setData(stats);

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
                <th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <div className="h-4">
        <button onClick={() => rerender()} className="border p-2">
          Rerender
        </button>
      </div>
    </div>
  );
}
