// src/components/LeagueHeatmap.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { chipLabel } from "@/lib/chips";
import { useMyTeamId } from "@/lib/myTeam";
import { useBoxSize } from "@/lib/useBoxSize";
import {
  scoresAgainstWeekAverage,
  type LeagueHistory,
  type LeagueHistoryRow,
} from "@/lib/stats/leagueHistory";

// A diverging scale: blue above the league's average, red below, grey near
// it. The bins are fixed in points rather than fitted to the league, so a
// colour means the same in every league and every season. The steps were
// worked out in OKLab from the grey to each pole: lightness rises steadily
// away from the middle and matches step for step on the two sides, so
// neither side looks louder. Blue against orange-red stays apart for
// colour-blind readers.
const NEUTRAL = "#3a3e44";
const ABOVE = ["#475d78", "#5078a6", "#5893d7", "#5eaaff"];
const BELOW = ["#735251", "#a3615b", "#d66f64", "#ff7a6b"];
/** Lower edges of the bins on each side, in points from the average. */
const EDGES = [5, 15, 25, 40];
// The two brightest steps need dark text; the rest take light text.
const DARK_TEXT_FROM = 2;

/** The bin a gap from the average falls in: 0 for near it, 1-4 away from it. */
function binOf(gap: number): number {
  const size = Math.abs(gap);
  return EDGES.filter((edge) => size >= edge).length;
}

function colourOf(gap: number): string {
  const bin = binOf(gap);
  if (bin === 0) return NEUTRAL;
  return (gap > 0 ? ABOVE : BELOW)[bin - 1];
}

function textColourOf(gap: number): string {
  return binOf(gap) - 1 >= DARK_TEXT_FROM ? "#212529" : "#ffffff";
}

const CHIP_LETTERS: Record<string, string> = {
  wildcard: "W",
  freehit: "F",
  bboost: "B",
  "3xc": "T",
  manager: "A",
};
const chipLetter = (chip: string) => CHIP_LETTERS[chip] ?? chip.charAt(0).toUpperCase();

const signed = (value: number) => {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${-rounded}` : "0";
};

const PHONE_WIDTH = 576;
const GAP = 2;
const HEADER = 18;
const MIN_CELL = 14;
const MAX_CELL = 32;

const latestPosition = (row: LeagueHistoryRow) =>
  [...row.positions].reverse().find((p) => p !== null) ?? Infinity;

interface Active {
  row: number;
  col: number;
  /** Opened by a tap or click, so it stays until the next one. */
  pinned: boolean;
  /** How far the squares were scrolled, to place the tooltip; scrolling closes it. */
  scrollLeft: number;
}

export default function LeagueHeatmap({ history }: { history: LeagueHistory }) {
  const { gameweeks } = history;
  const myTeam = useMyTeamId();
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const size = useBoxSize(boxRef);
  const [active, setActive] = useState<Active | null>(null);

  // Rows in league order, as in the table below.
  const { rows, against, averages } = useMemo(() => {
    const { against, averages } = scoresAgainstWeekAverage(history);
    const order = history.rows
      .map((row, i) => ({ row, gaps: against[i] }))
      .sort((a, b) => latestPosition(a.row) - latestPosition(b.row));
    return { rows: order.map((o) => o.row), against: order.map((o) => o.gaps), averages };
  }, [history]);

  const width = size?.width ?? 0;
  const narrow = width < PHONE_WIDTH;
  const nameWidth = narrow ? 110 : 190;
  const rowHeight = narrow ? 20 : 22;
  const cell = Math.max(
    MIN_CELL,
    Math.min(MAX_CELL, Math.floor((width - nameWidth) / Math.max(gameweeks.length, 1)))
  );
  const gridWidth = cell * gameweeks.length;
  const gridHeight = HEADER + rowHeight * rows.length;

  // When the squares do not fit, the latest gameweeks are the ones to see
  // first: start scrolled to the end.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [cell, width]);

  if (gameweeks.length === 0 || rows.length === 0) {
    return null;
  }

  const cellAt = (event: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const col = Math.floor((event.clientX - rect.left) / cell);
    const row = Math.floor((event.clientY - rect.top - HEADER) / rowHeight);
    if (col < 0 || col >= gameweeks.length || row < 0 || row >= rows.length) return null;
    if (against[row][col] === null) return null;
    return { row, col, scrollLeft: scrollerRef.current?.scrollLeft ?? 0 };
  };

  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "mouse" || active?.pinned) return;
    const hit = cellAt(event);
    if (hit?.row !== active?.row || hit?.col !== active?.col) {
      setActive(hit && { ...hit, pinned: false });
    }
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const hit = cellAt(event);
    const same = hit && active?.pinned && hit.row === active.row && hit.col === active.col;
    setActive(hit && !same ? { ...hit, pinned: true } : null);
  };

  const xTickEvery = Math.ceil(22 / cell);
  const lastIndex = gameweeks.length - 1;

  const tooltip = active && (() => {
    const row = rows[active.row];
    const gap = against[active.row][active.col] as number;
    const score = row.scores[active.col] as number;
    const average = averages[active.col] as number;
    const chip = row.chips[active.col];
    // The tooltip is placed against the box, so the scroll position counts.
    const cellLeft = nameWidth + active.col * cell - active.scrollLeft;
    const onLeft = cellLeft > width * 0.55;
    return (
      <div
        className="position-absolute border rounded shadow-sm bg-body-tertiary small p-2"
        style={{
          top: HEADER + (active.row + 1) * rowHeight + 4,
          pointerEvents: "none",
          minWidth: 170,
          maxWidth: Math.min(260, width - 16),
          zIndex: 2,
          ...(onLeft ? { right: width - cellLeft + 4 } : { left: Math.max(0, cellLeft) }),
        }}
      >
        <div className="text-secondary mb-1">
          Gameweek {gameweeks[active.col]} · <span className="text-body">{row.teamName}</span>
        </div>
        <div>
          <strong>{signed(gap)}</strong>{" "}
          <span className="text-secondary">against the league average</span>
        </div>
        <div className="text-secondary">
          Scored {score}, average {Math.round(average)}
        </div>
        {chip && <div className="text-secondary">Played {chipLabel(chip)}</div>}
      </div>
    );
  })();

  return (
    <figure className="mb-4">
      <figcaption>
        <h2 className="h5 mb-1">Scores against the league average</h2>
        <p className="text-secondary small mb-2">
          A row per team, a square per gameweek. Blue is above the league&apos;s average score
          that week, red below; a letter marks a chip.
        </p>
      </figcaption>

      <Legend />

      <div ref={boxRef} className="position-relative">
        {size && width > 0 && (
          <div className="d-flex">
            <div className="flex-shrink-0" style={{ width: nameWidth }}>
              <div style={{ height: HEADER }} />
              {rows.map((row) => (
                <div
                  key={row.teamId}
                  className={`small text-truncate pe-2${row.teamId === myTeam ? " fw-bold" : ""}`}
                  style={{ height: rowHeight, lineHeight: `${rowHeight}px` }}
                  title={row.teamName}
                >
                  {row.teamName}
                </div>
              ))}
            </div>
            <div
              ref={scrollerRef}
              className="overflow-x-auto flex-grow-1"
              onScroll={() => setActive(null)}
            >
              <svg
                width={gridWidth}
                height={gridHeight}
                className="d-block"
                role="img"
                aria-label="Heatmap of each team's score in every gameweek against the league's average that week. The table below has the scores."
                onPointerMove={handleMove}
                onPointerLeave={() => {
                  if (!active?.pinned) setActive(null);
                }}
                onClick={handleClick}
              >
                {gameweeks.map((gw, col) =>
                  col % xTickEvery === 0 || col === lastIndex ? (
                    <text
                      key={gw}
                      x={col * cell + (cell - GAP) / 2}
                      y={HEADER - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--bs-secondary-color)"
                    >
                      {gw}
                    </text>
                  ) : null
                )}
                {rows.map((row, r) =>
                  against[r].map((gap, col) => {
                    if (gap === null) return null;
                    const chip = row.chips[col];
                    const x = col * cell;
                    const y = HEADER + r * rowHeight;
                    return (
                      <g key={`${row.teamId}-${col}`}>
                        <rect
                          x={x}
                          y={y}
                          width={cell - GAP}
                          height={rowHeight - GAP}
                          rx="2"
                          fill={colourOf(gap)}
                        />
                        {chip && (
                          <text
                            x={x + (cell - GAP) / 2}
                            y={y + (rowHeight - GAP) / 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="10"
                            fontWeight="600"
                            fill={textColourOf(gap)}
                            pointerEvents="none"
                          >
                            {chipLetter(chip)}
                          </text>
                        )}
                      </g>
                    );
                  })
                )}
                {active && (
                  <rect
                    x={active.col * cell - 1}
                    y={HEADER + active.row * rowHeight - 1}
                    width={cell - GAP + 2}
                    height={rowHeight - GAP + 2}
                    rx="3"
                    fill="none"
                    stroke="var(--bs-body-color)"
                    strokeWidth="2"
                    pointerEvents="none"
                  />
                )}
              </svg>
            </div>
          </div>
        )}
        {tooltip}
      </div>
    </figure>
  );
}

/** The colour bins and the chip letters. */
function Legend() {
  const swatch = (colour: string) => (
    <span
      className="d-inline-block rounded-1 flex-shrink-0"
      style={{ width: 14, height: 14, background: colour }}
      aria-hidden="true"
    />
  );
  const bins = [
    ...BELOW.map((colour, i) => ({ colour, label: `−${EDGES[i]}` })).reverse(),
    { colour: NEUTRAL, label: "±4" },
    ...ABOVE.map((colour, i) => ({ colour, label: `+${EDGES[i]}` })),
  ];
  return (
    <div className="d-flex flex-wrap align-items-center column-gap-3 row-gap-1 small text-secondary mb-2">
      <div className="d-flex align-items-end gap-1" aria-label="Colour scale, in points from the league average">
        {bins.map(({ colour, label }) => (
          <div key={label} className="d-flex flex-column align-items-center" style={{ width: 26 }}>
            {swatch(colour)}
            <span style={{ fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>
      <div>
        W Wildcard · F Free Hit · B Bench Boost · T Triple Captain
      </div>
    </div>
  );
}
