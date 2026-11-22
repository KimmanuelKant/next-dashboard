// src/components/LeaguePositionChart.tsx
"use client";
import { useMemo, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import type { LeagueHistory, LeagueHistoryRow } from "@/lib/stats/leagueHistory";

// Categorical colours for the dark theme, in fixed order. Validated for
// colour-blind separation and contrast against the page background.
const SERIES_COLOURS = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#0ca30c",
  "#9085e9",
  "#e66767",
];
const MAX_HIGHLIGHTED = SERIES_COLOURS.length;
const DEFAULT_HIGHLIGHTED = 5;

const WIDTH = 960;
const HEIGHT = 420;
const MARGIN = { top: 16, right: 170, bottom: 40, left: 44 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

/** Tick values for the position axis: 1, then round steps, then the last place. */
function positionTicks(last: number): number[] {
  if (last <= 10) return Array.from({ length: last }, (_, i) => i + 1);
  const step = last <= 25 ? 5 : last <= 60 ? 10 : 20;
  const ticks = [1];
  for (let t = step; t < last - step / 2; t += step) ticks.push(t);
  ticks.push(last);
  return ticks;
}

export default function LeaguePositionChart({ history }: { history: LeagueHistory }) {
  const { gameweeks, rows } = history;
  const teamCount = rows.length;

  // teamId -> colour slot. A team keeps its slot while highlighted, so colours
  // never move when another team is added or removed.
  const [slots, setSlots] = useState<Record<number, number>>(() => {
    const latest = (row: LeagueHistoryRow) =>
      [...row.positions].reverse().find((p) => p !== null) ?? Infinity;
    const initial: Record<number, number> = {};
    [...rows]
      .sort((a, b) => latest(a) - latest(b))
      .slice(0, Math.min(DEFAULT_HIGHLIGHTED, MAX_HIGHLIGHTED))
      .forEach((row, i) => (initial[row.teamId] = i));
    return initial;
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const highlighted = useMemo(
    () =>
      rows
        .filter((row) => slots[row.teamId] !== undefined)
        .sort((a, b) => slots[a.teamId] - slots[b.teamId]),
    [rows, slots]
  );
  const background = rows.filter((row) => slots[row.teamId] === undefined);
  const freeSlot = SERIES_COLOURS.findIndex(
    (_, i) => !Object.values(slots).includes(i)
  );

  if (gameweeks.length === 0 || teamCount === 0) {
    return null;
  }

  const x = (index: number) =>
    MARGIN.left +
    (gameweeks.length === 1 ? PLOT_W / 2 : (index / (gameweeks.length - 1)) * PLOT_W);
  const y = (position: number) =>
    MARGIN.top + (teamCount === 1 ? PLOT_H / 2 : ((position - 1) / (teamCount - 1)) * PLOT_H);

  const pathFor = (row: LeagueHistoryRow) => {
    let path = "";
    let penDown = false;
    row.positions.forEach((position, i) => {
      if (position === null) {
        penDown = false;
        return;
      }
      path += `${penDown ? "L" : "M"}${x(i).toFixed(1)},${y(position).toFixed(1)}`;
      penDown = true;
    });
    return path;
  };

  // End-of-line labels, nudged apart so adjacent positions do not overlap.
  const lastIndex = gameweeks.length - 1;
  const labels = highlighted
    .map((row) => ({ row, position: row.positions[lastIndex] }))
    .filter((l): l is { row: LeagueHistoryRow; position: number } => l.position !== null)
    .map((l) => ({ ...l, labelY: y(l.position) }))
    .sort((a, b) => a.labelY - b.labelY);
  for (let i = 1; i < labels.length; i++) {
    labels[i].labelY = Math.max(labels[i].labelY, labels[i - 1].labelY + 14);
  }

  const xTickEvery = Math.ceil(gameweeks.length / 19);

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (svgX - MARGIN.left) / PLOT_W;
    const index = Math.round(ratio * (gameweeks.length - 1));
    setHoverIndex(Math.max(0, Math.min(gameweeks.length - 1, index)));
  };

  const toggle = (teamId: number) => {
    setSlots((current) => {
      const next = { ...current };
      if (next[teamId] !== undefined) {
        delete next[teamId];
      } else {
        const slot = SERIES_COLOURS.findIndex(
          (_, i) => !Object.values(next).includes(i)
        );
        if (slot >= 0) next[teamId] = slot;
      }
      return next;
    });
  };

  const hovered =
    hoverIndex === null
      ? []
      : highlighted
          .map((row) => ({
            row,
            position: row.positions[hoverIndex],
            score: row.scores[hoverIndex],
          }))
          .filter((h) => h.position !== null)
          .sort((a, b) => (a.position as number) - (b.position as number));
  const tooltipOnLeft = hoverIndex !== null && x(hoverIndex) > MARGIN.left + PLOT_W * 0.6;

  return (
    <figure className="mb-4">
      <figcaption className="mb-2">
        <h2 className="h5 mb-1">League position by gameweek</h2>
        <p className="text-secondary small mb-0">
          Highlighted teams are coloured; every other team is drawn in grey.
          {teamCount > MAX_HIGHLIGHTED &&
            ` Up to ${MAX_HIGHLIGHTED} teams can be highlighted at once.`}
        </p>
      </figcaption>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        {highlighted.map((row) => (
          <button
            key={row.teamId}
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
            onClick={() => toggle(row.teamId)}
            title="Remove from highlighted teams"
          >
            <svg width="16" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="16"
                y2="4"
                stroke={SERIES_COLOURS[slots[row.teamId]]}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-body">{row.teamName}</span>
            <span aria-hidden="true">×</span>
          </button>
        ))}
        {background.length > 0 && (
          <Form.Select
            size="sm"
            className="w-auto"
            aria-label="Highlight another team"
            value=""
            disabled={freeSlot < 0}
            onChange={(e) => {
              if (e.target.value) toggle(Number(e.target.value));
            }}
          >
            <option value="">
              {freeSlot < 0 ? "Remove a team to add another" : "Highlight a team…"}
            </option>
            {[...background]
              .sort((a, b) => a.teamName.localeCompare(b.teamName))
              .map((row) => (
                <option key={row.teamId} value={row.teamId}>
                  {row.teamName}
                </option>
              ))}
          </Form.Select>
        )}
      </div>

      <div className="position-relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-100 h-auto d-block"
          role="img"
          aria-label="Line chart of each team's league position after every gameweek. The same figures are in the table below."
          onPointerMove={handlePointer}
          onPointerLeave={() => setHoverIndex(null)}
          style={{ touchAction: "pan-y" }}
        >
          {/* Grid and axes: recessive */}
          {positionTicks(teamCount).map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + PLOT_W}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--bs-border-color)"
                strokeWidth="1"
                opacity="0.5"
              />
              <text
                x={MARGIN.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
                fill="var(--bs-secondary-color)"
              >
                {tick}
              </text>
            </g>
          ))}
          {gameweeks.map((gw, i) =>
            i % xTickEvery === 0 || i === lastIndex ? (
              <text
                key={gw}
                x={x(i)}
                y={MARGIN.top + PLOT_H + 18}
                textAnchor="middle"
                fontSize="12"
                fill="var(--bs-secondary-color)"
              >
                {gw}
              </text>
            ) : null
          )}
          <text
            x={MARGIN.left + PLOT_W / 2}
            y={HEIGHT - 4}
            textAnchor="middle"
            fontSize="12"
            fill="var(--bs-secondary-color)"
          >
            Gameweek
          </text>
          <text
            x={12}
            y={MARGIN.top + PLOT_H / 2}
            textAnchor="middle"
            fontSize="12"
            fill="var(--bs-secondary-color)"
            transform={`rotate(-90 12 ${MARGIN.top + PLOT_H / 2})`}
          >
            League position
          </text>

          {/* Context lines */}
          {background.map((row) => (
            <path
              key={row.teamId}
              d={pathFor(row)}
              fill="none"
              stroke="var(--bs-secondary-color)"
              strokeWidth="1"
              opacity={teamCount > 30 ? 0.18 : 0.35}
            />
          ))}

          {/* Highlighted lines */}
          {highlighted.map((row) => (
            <path
              key={row.teamId}
              d={pathFor(row)}
              fill="none"
              stroke={SERIES_COLOURS[slots[row.teamId]]}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* A lone point (one gameweek, or a team's first week) needs a marker to be visible */}
          {highlighted.map((row) =>
            row.positions.map((position, i) =>
              position !== null &&
              (row.positions[i - 1] ?? null) === null &&
              (row.positions[i + 1] ?? null) === null ? (
                <circle
                  key={`${row.teamId}-${i}`}
                  cx={x(i)}
                  cy={y(position)}
                  r="4"
                  fill={SERIES_COLOURS[slots[row.teamId]]}
                />
              ) : null
            )
          )}

          {/* Direct labels at the line ends; text stays in the text colour */}
          {labels.map(({ row, position, labelY }) => (
            <g key={row.teamId}>
              <line
                x1={x(lastIndex) + 4}
                y1={y(position)}
                x2={x(lastIndex) + 12}
                y2={labelY}
                stroke={SERIES_COLOURS[slots[row.teamId]]}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text
                x={x(lastIndex) + 16}
                y={labelY}
                dominantBaseline="middle"
                fontSize="12"
                fill="var(--bs-body-color)"
              >
                {row.teamName.length > 22 ? `${row.teamName.slice(0, 21)}…` : row.teamName}
              </text>
            </g>
          ))}

          {/* Hover crosshair and markers */}
          {hoverIndex !== null && (
            <g pointerEvents="none">
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + PLOT_H}
                stroke="var(--bs-body-color)"
                strokeWidth="1"
                opacity="0.5"
              />
              {hovered.map(({ row, position }) => (
                <circle
                  key={row.teamId}
                  cx={x(hoverIndex)}
                  cy={y(position as number)}
                  r="4.5"
                  fill={SERIES_COLOURS[slots[row.teamId]]}
                  stroke="var(--bs-body-bg)"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>

        {hoverIndex !== null && (
          <div
            className="position-absolute border rounded shadow-sm bg-body-tertiary small p-2"
            style={{
              top: 8,
              pointerEvents: "none",
              minWidth: 180,
              ...(tooltipOnLeft
                ? { right: `${100 - (x(hoverIndex) / WIDTH) * 100 + 1.5}%` }
                : { left: `${(x(hoverIndex) / WIDTH) * 100 + 1.5}%` }),
            }}
          >
            <div className="text-secondary mb-1">Gameweek {gameweeks[hoverIndex]}</div>
            {hovered.length === 0 && <div>No highlighted team had a rank yet.</div>}
            {hovered.map(({ row, position, score }) => (
              <div key={row.teamId} className="d-flex align-items-center gap-2">
                <svg width="12" height="8" aria-hidden="true">
                  <line
                    x1="0"
                    y1="4"
                    x2="12"
                    y2="4"
                    stroke={SERIES_COLOURS[slots[row.teamId]]}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <strong>{position}</strong>
                <span className="text-secondary flex-grow-1">{row.teamName}</span>
                <span className="text-secondary">{score} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
