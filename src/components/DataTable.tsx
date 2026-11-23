// src/components/DataTable.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Cell,
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { Dropdown, DropdownButton, Form, Modal, OverlayTrigger, Popover } from "react-bootstrap";
import { InfoCircle, InfoCircleFill } from "react-bootstrap-icons";
import Highlights, { Highlight } from "@/components/Highlights";
import Narrow from "@/components/Narrow";
import { decodeSorting, encodeSorting, viewSlug, withTableState } from "@/lib/tableUrl";

export interface ColumnGroup {
  name: string;
  columns: string[];
}

export interface Preset {
  /**
   * Shown on the view's button, so keep it short. Also the view's name in
   * the page address ("League race" is ?view=league-race): renaming a view
   * breaks links to it, which then open the default view.
   */
  name: string;
  /** Column ids to show. Omit to show every column. */
  columns?: string[];
  /**
   * The columns this view keeps on phone-width screens, where a wide table
   * means scrolling sideways to read a row. The others are hidden there
   * until the visitor taps "more columns"; the sticky column and the column
   * the table is sorted by always show. Omit to show every column on phones.
   */
  phoneColumns?: string[];
}

interface DataTableProps<T> {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  presets: Preset[];
  /** Column id -> explanation shown in the column picker. */
  descriptions: Record<string, string>;
  /** Column id -> header used on phone-width screens, where the full one is too wide. */
  shortHeaders?: Record<string, string>;
  /** Name of the preset applied on first render, unless the address names another. */
  initialPreset: string;
  initialSorting?: SortingState;
  /** Cards shown above the table. Selecting one opens its view and sorting. */
  highlights?: Highlight[];
  /** Headings for the column picker. Columns in no group are listed first. */
  groups?: ColumnGroup[];
  /** Hide the per-column picker (for tables whose presets cover every useful view). */
  hideColumnPicker?: boolean;
  /** Shown instead of rows when there is no data. */
  emptyMessage?: string;
  /** Id of the column that stays in view when the table scrolls sideways. */
  stickyColumn?: string;
  /**
   * Id of a column that, on phone-width screens, is shown as a second line
   * in the sticky column instead of taking a column of its own.
   */
  subtitleColumn?: string;
  /**
   * Ids of columns holding lists or long text. On phone-width screens every
   * other cell stays on one line; these may wrap.
   */
  wrapColumns?: string[];
  /** Rows to mark as the visitor's own. */
  highlightRow?: (row: T) => boolean;
  /**
   * What a row is ("team", "player"). When set, selecting a row opens a
   * panel listing every column for it, top to bottom.
   */
  detailNoun?: string;
  /** The line above the table saying rows can be selected, when the default wording will not do. */
  detailHint?: string;
  /** A control shown at the top of a row's panel, such as "This is my team". */
  detailAction?: (row: T) => React.ReactNode;
}

/**
 * Tap-to-open explanation of a column, shown in its header. Left out on
 * phone-width screens: the icon is too small a target there, and the row
 * panel carries the explanations.
 */
function HeaderInfo({ id, label, text }: { id: string; label: string; text: string }) {
  return (
    // Stops the tap from also sorting the column.
    <span className="d-none d-sm-inline" onClick={(e) => e.stopPropagation()}>
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="bottom"
        overlay={
          <Popover id={`header-popover-${id}`}>
            <Popover.Body>{text}</Popover.Body>
          </Popover>
        }
      >
        <InfoCircle
          className="ms-1 text-secondary"
          role="button"
          size={12}
          aria-label={`About ${label}`}
        />
      </OverlayTrigger>
    </span>
  );
}

interface DetailSection<T> {
  name: string;
  cells: Cell<T, unknown>[];
}

/** Every column for one row, listed top to bottom under its group headings. */
function RowDetail<T>({
  show,
  title,
  subtitle,
  action,
  sections,
  descriptions,
  position,
  total,
  onStep,
  onClose,
}: {
  show: boolean;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  action: React.ReactNode;
  sections: DetailSection<T>[];
  descriptions: Record<string, string>;
  /** Index of the row in the table's current order. */
  position: number;
  total: number;
  onStep: (by: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal show={show} onHide={onClose} scrollable fullscreen="sm-down" aria-labelledby="rowDetailTitle">
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5" id="rowDetailTitle">
          {title}
          {subtitle && <div className="small text-secondary fw-normal">{subtitle}</div>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {action && <div className="mb-3">{action}</div>}
        {sections.map((section) => (
          <section key={section.name || "ungrouped"} className="mb-3">
            {section.name && <h3 className="detail-heading">{section.name}</h3>}
            {section.cells.map((cell) => {
              const label = String(cell.column.columnDef.header);
              const value = flexRender(cell.column.columnDef.cell, cell.getContext());
              const description = descriptions[cell.column.id];
              if (!description) {
                return (
                  <div key={cell.id} className="detail-stat">
                    <span>{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                );
              }
              return (
                <details key={cell.id}>
                  <summary className="detail-stat">
                    <span>
                      {label}
                      <InfoCircle className="ms-1 text-secondary" size={12} aria-hidden="true" />
                    </span>
                    <span className="detail-value">{value}</span>
                  </summary>
                  <p className="small text-secondary mt-1 mb-2">{description}</p>
                </details>
              );
            })}
          </section>
        ))}
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={position <= 0}
          onClick={() => onStep(-1)}
        >
          ‹ Previous
        </button>
        <span className="small text-secondary">
          {position + 1} of {total}
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={position >= total - 1}
          onClick={() => onStep(1)}
        >
          Next ›
        </button>
      </Modal.Footer>
    </Modal>
  );
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
  shortHeaders = {},
  initialPreset,
  initialSorting = [],
  highlights,
  groups,
  hideColumnPicker = false,
  emptyMessage = "Nothing to show.",
  stickyColumn,
  subtitleColumn,
  wrapColumns = [],
  highlightRow,
  detailNoun,
  detailHint,
  detailAction,
}: DataTableProps<T>) {
  // The address can name the view and sorting to open with (see tableUrl.ts).
  // It is read once: after that the state below leads and the address follows.
  const searchParams = useSearchParams();
  const [presetName, setPresetName] = useState(() => {
    const fromUrl = searchParams.get("view");
    return presets.find((p) => viewSlug(p.name) === fromUrl)?.name ?? initialPreset;
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    visibilityFor(columns, presets.find((p) => p.name === presetName))
  );
  const [sorting, setSorting] = useState<SortingState>(
    () =>
      decodeSorting(
        searchParams.get("sort"),
        new Set(columns.map((column) => column.id as string))
      ) ?? initialSorting
  );
  // The row shown in the panel. Kept while the panel closes so it does not
  // empty mid-animation; `detailOpen` says whether it is showing.
  const [detail, setDetail] = useState<T | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // On phones, the visitor has asked for every column of the view. Each view
  // starts with its short list again.
  const [allOnPhone, setAllOnPhone] = useState(false);

  // Writes the view and sorting into the address. replaceState changes the
  // address without asking the server for the page again, and without adding
  // a history entry for every view the visitor looks at.
  const writeUrl = (view: string, nextSorting: SortingState) => {
    const query = withTableState(
      window.location.search,
      { view: viewSlug(view), sort: encodeSorting(nextSorting) },
      { view: viewSlug(initialPreset), sort: encodeSorting(initialSorting) }
    );
    window.history.replaceState(null, "", window.location.pathname + query + window.location.hash);
  };

  // On phones the row of view buttons scrolls sideways, and a view opened from
  // a highlight card or the address can be out of sight. Bring its button to
  // the middle. Only the row is scrolled: scrollIntoView would move the page
  // too, which on a page with a chart above the table means a jump on load.
  const pillRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = pillRow.current;
    const active = row?.querySelector('[aria-pressed="true"]');
    if (row && active) {
      const rowBox = row.getBoundingClientRect();
      const activeBox = active.getBoundingClientRect();
      row.scrollLeft += activeBox.left - rowBox.left - (rowBox.width - activeBox.width) / 2;
    }
  }, [presetName]);

  const showView = (name: string, requestedSorting?: SortingState) => {
    const preset = presets.find((p) => p.name === name);
    // Without a requested sorting the current one stays, unless the new view
    // hides its column: a table sorted by a column not on screen looks shuffled.
    const stillShown = sorting.every(
      ({ id }) => !preset?.columns || preset.columns.includes(id)
    );
    const nextSorting = requestedSorting ?? (stillShown ? sorting : initialSorting);
    setPresetName(name);
    setColumnVisibility(visibilityFor(columns, preset));
    setAllOnPhone(false);
    setSorting(nextSorting);
    writeUrl(name, nextSorting);
  };

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, sorting },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(nextSorting);
      writeUrl(presetName, nextSorting);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Column picker sections: ungrouped columns first, then each group in order.
  const leafColumns = table.getAllLeafColumns();
  const groupedIds = new Set((groups ?? []).flatMap((group) => group.columns));
  const pickerSections = [
    { name: "", columns: leafColumns.filter((column) => !groupedIds.has(column.id)) },
    ...(groups ?? []).map((group) => ({
      name: group.name,
      columns: group.columns.flatMap(
        (id) => leafColumns.find((column) => column.id === id) ?? []
      ),
    })),
  ].filter((section) => section.columns.length > 0);

  const isVisible = (id: string | undefined) =>
    Boolean(id && leafColumns.find((column) => column.id === id)?.getIsVisible());
  // On phones the subtitle column folds into the sticky one, when both show.
  const foldSubtitle = isVisible(stickyColumn) && isVisible(subtitleColumn);
  // Columns of the view that phones leave out until asked. A hand-picked set
  // of columns (no view) shows as picked. CSS does the hiding, so the page
  // is the same on the server and in every browser, and nothing jumps on load.
  const phoneColumns = presets.find((p) => p.name === presetName)?.phoneColumns;
  const offPhone = (id: string) =>
    phoneColumns !== undefined &&
    id !== stickyColumn &&
    !(foldSubtitle && id === subtitleColumn) &&
    !phoneColumns.includes(id) &&
    // A table sorted by a column out of sight looks shuffled.
    !sorting.some((sort) => sort.id === id);
  const offPhoneCount = table
    .getVisibleLeafColumns()
    .filter((column) => offPhone(column.id)).length;
  const cellClass = (id: string) => {
    if (id === stickyColumn) return "sticky-col";
    const hidden =
      (foldSubtitle && id === subtitleColumn) || (!allOnPhone && offPhone(id));
    return (
      [hidden ? "d-none d-sm-table-cell" : "", wrapColumns.includes(id) ? "cell-wrap" : ""]
        .join(" ")
        .trim() || undefined
    );
  };

  const rows = table.getRowModel().rows;
  const renderCell = (cell: Cell<T, unknown>) =>
    flexRender(cell.column.columnDef.cell, cell.getContext());

  const openDetail = (row: T) => {
    setDetail(row);
    setDetailOpen(true);
  };
  // The panel's row, found again on each render: sorting moves it, and a
  // filter can remove it (which closes the panel).
  const detailIndex = detail === null ? -1 : rows.findIndex((row) => row.original === detail);
  const detailCells = detailIndex >= 0 ? rows[detailIndex].getAllCells() : [];
  const detailCell = (id: string | undefined) =>
    detailCells.find((cell) => cell.column.id === id);
  const detailTitle = detailCell(stickyColumn);
  const detailSubtitle = detailCell(subtitleColumn);
  const detailSections: DetailSection<T>[] = pickerSections
    .map((section) => ({
      name: section.name,
      cells: section.columns.flatMap((column) =>
        column.id === stickyColumn || column.id === subtitleColumn
          ? []
          : detailCell(column.id) ?? []
      ),
    }))
    .filter((section) => section.cells.length > 0);

  return (
    <div>
      {highlights && (
        <Highlights items={highlights} onSelect={(item) => showView(item.preset, item.sorting)} />
      )}

      <div className="d-flex align-items-start gap-2 mb-3">
        {/* Every view as a button, so none is hidden behind a menu. On phones
            the row scrolls sideways; on wider screens it wraps. */}
        <div
          ref={pillRow}
          className="view-pills d-flex flex-nowrap flex-sm-wrap flex-grow-1 gap-2 overflow-x-auto"
          role="group"
          aria-label="Views"
        >
          {presets.map((preset) => {
            const active = preset.name === presetName;
            return (
              <button
                key={preset.name}
                type="button"
                className={`btn btn-sm rounded-pill text-nowrap ${
                  active ? "btn-primary" : "btn-outline-secondary btn-quiet"
                }`}
                aria-pressed={active}
                onClick={() => showView(preset.name)}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {!hideColumnPicker && (
        <DropdownButton
          id="columnVisibilityDropdown"
          title="Columns"
          size="sm"
          variant="secondary"
          autoClose="outside"
          align="end"
        >
          {pickerSections.map((section) => (
            <React.Fragment key={section.name || "ungrouped"}>
              {section.name && <Dropdown.Header>{section.name}</Dropdown.Header>}
              {section.columns.map((column) => (
            <Dropdown.Item key={column.id} as="div">
              <div className="d-flex align-items-center">
                <Form.Check
                  type="checkbox"
                  id={`column-${column.id}`}
                  label={String(column.columnDef.header)}
                  checked={column.getIsVisible()}
                  onChange={(e) => {
                    // A hand-picked set of columns is no view: no button is
                    // lit, and the address names none.
                    setPresetName("");
                    setAllOnPhone(false);
                    writeUrl("", sorting);
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
            </React.Fragment>
          ))}
        </DropdownButton>
        )}
      </div>

      {data.length > 0 && (detailNoun || offPhoneCount > 0) && (
        <div
          className={`d-flex justify-content-between align-items-center gap-2 mb-2 ${
            detailNoun ? "" : "d-sm-none"
          }`}
        >
          {detailNoun && (
            <p className="text-secondary small mb-0">
              {detailHint ?? `Select a ${detailNoun} to see the full list of stats.`}
            </p>
          )}
          {/* Phones only: the view's other columns, one tap away. */}
          {offPhoneCount > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary btn-quiet text-nowrap ms-auto d-sm-none"
              aria-pressed={allOnPhone}
              onClick={() => setAllOnPhone(!allOnPhone)}
            >
              {allOnPhone
                ? "Fewer columns"
                : `+${offPhoneCount} more column${offPhoneCount === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-striped table-sm align-middle">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const label = String(header.column.columnDef.header);
                  const short = shortHeaders[header.column.id];
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cellClass(header.column.id)}
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
                      {short ? (
                        <Narrow short={<abbr title={label}>{short}</abbr>}>{label}</Narrow>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                      {sorted === "asc" ? " ▲" : sorted === "desc" ? " ▼" : null}
                      {/* The pinned name column needs no explanation. */}
                      {header.column.id !== stickyColumn && descriptions[header.column.id] && (
                        <HeaderInfo
                          id={header.column.id}
                          label={label}
                          text={descriptions[header.column.id]}
                        />
                      )}
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
            {rows.map((row) => {
              const cells = row.getVisibleCells();
              const subtitle = foldSubtitle
                ? cells.find((cell) => cell.column.id === subtitleColumn)
                : undefined;
              const rowClass = [
                highlightRow?.(row.original) ? "my-team" : "",
                detailNoun ? "row-clickable" : "",
              ]
                .join(" ")
                .trim();
              return (
                <tr
                  key={row.id}
                  className={rowClass || undefined}
                  onClick={
                    detailNoun
                      ? () => {
                          // Dragging to select text is not a request to open the row.
                          if (!window.getSelection()?.toString()) openDetail(row.original);
                        }
                      : undefined
                  }
                >
                  {cells.map((cell) =>
                    cell.column.id !== stickyColumn ? (
                      <td key={cell.id} className={cellClass(cell.column.id)}>
                        {renderCell(cell)}
                      </td>
                    ) : (
                      <td key={cell.id} className="sticky-col">
                        {detailNoun ? (
                          // A real button, so the row can be opened from the keyboard.
                          <button
                            type="button"
                            className="row-open"
                            aria-label={`All stats for ${String(cell.getValue())}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(row.original);
                            }}
                          >
                            <span className="sticky-name">{renderCell(cell)}</span>
                            <span className="text-secondary" aria-hidden="true">
                              ›
                            </span>
                          </button>
                        ) : (
                          <div className="sticky-name">{renderCell(cell)}</div>
                        )}
                        {subtitle && (
                          <div className="sticky-sub d-sm-none">{renderCell(subtitle)}</div>
                        )}
                      </td>
                    )
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detailNoun && (
        <RowDetail
          show={detailOpen && detailIndex >= 0}
          title={detailTitle ? renderCell(detailTitle) : null}
          subtitle={detailSubtitle ? renderCell(detailSubtitle) : null}
          action={detailAction && detailIndex >= 0 ? detailAction(rows[detailIndex].original) : null}
          sections={detailSections}
          descriptions={descriptions}
          position={detailIndex}
          total={rows.length}
          onStep={(by) => {
            const next = rows[detailIndex + by];
            if (next) setDetail(next.original);
          }}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
