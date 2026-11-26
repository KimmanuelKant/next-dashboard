// src/components/LeagueChart.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import { useMyTeamId } from "@/lib/myTeam";
import { withTableState } from "@/lib/tableUrl";
import { useCentredActive } from "@/lib/useCentredActive";
import {
  CHART_SERIES,
  DEFAULT_SERIES,
  type ChartSeries,
  type LeagueHistory,
  type LeagueHistoryRow,
} from "@/lib/stats/leagueHistory";

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

// Below this width the chart drops the names at the line ends (the buttons
// above it say which colour is which) to give the lines the room.
const PHONE_WIDTH = 576;
const FONT_SIZE = 12;

/** teamId -> colour slot. */
type Slots = Record<number, number>;

const latestPosition = (row: LeagueHistoryRow) =>
  [...row.positions].reverse().find((p) => p !== null) ?? Infinity;

/** The leaders, with the visitor's own team taking the last place if it is not among them. */
function defaultSlots(rows: LeagueHistoryRow[], myTeam: number | null): Slots {
  const ranked = [...rows].sort((a, b) => latestPosition(a) - latestPosition(b));
  const picked = ranked.slice(0, DEFAULT_HIGHLIGHTED);
  const mine = rows.find((row) => row.teamId === myTeam);
  if (mine && !picked.includes(mine)) picked[picked.length - 1] = mine;
  return Object.fromEntries(picked.map((row, i) => [row.teamId, i]));
}

/** The "teams" parameter: ids of teams in this league, in colour order. Null when it names none. */
function slotsFromUrl(value: string | null, rows: LeagueHistoryRow[]): Slots | null {
  if (!value) return null;
  const known = new Set(rows.map((row) => row.teamId));
  const ids = [...new Set(value.split(",").map(Number))]
    .filter((id) => known.has(id))
    .slice(0, MAX_HIGHLIGHTED);
  return ids.length > 0 ? Object.fromEntries(ids.map((id, i) => [id, i])) : null;
}

/** Tick values for the position axis: 1, then round steps, then the last place. */
function positionTicks(last: number): number[] {
  if (last <= 10) return Array.from({ length: last }, (_, i) => i + 1);
  const step = last <= 25 ? 5 : last <= 60 ? 10 : 20;
  const ticks = [1];
  for (let t = step; t < last - step / 2; t += step) ticks.push(t);
  ticks.push(last);
  return ticks;
}

/** Round ticks (1, 2 or 5 times a power of ten apart) covering min to max. */
function linearTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min - 1, min, min + 1];
  const rough = (max - min) / Math.max(count, 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  // Whole numbers only: the values are points and ranks.
  const step = Math.max(
    1,
    [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power
  );
  const ticks = [];
  for (let t = Math.floor(min / step) * step; t < max + step; t += step) {
    ticks.push(Math.round(t));
    if (t >= max) break;
  }
  return ticks;
}

/** Powers of ten covering min to max, with 2 and 5 between them when they fit. */
function logTicks(min: number, max: number, count: number): number[] {
  const lo = Math.floor(Math.log10(Math.max(min, 1)));
  const hi = Math.ceil(Math.log10(Math.max(max, 1)));
  const powers = Array.from({ length: hi - lo + 1 }, (_, i) => 10 ** (lo + i));
  // Keep one tick either side of the data, not a whole decade of empty room.
  const around = (ticks: number[]) => {
    const first = Math.max(0, ticks.filter((t) => t <= min).length - 1);
    const last = ticks.findIndex((t) => t >= max);
    return ticks.slice(first, last < 0 ? undefined : last + 1);
  };
  const fine = around(powers.flatMap((p) => [p, 2 * p, 5 * p]));
  return fine.length <= count ? fine : around(powers);
}

const whole = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

/** 2500 -> "2500", 50000 -> "50k", 2000000 -> "2M". */
function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${+(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e4) return `${+(value / 1e3).toFixed(1)}k`;
  return String(value);
}

function formatTick(series: ChartSeries, value: number): string {
  if (Math.abs(value) >= 10000) return compact(value);
  return series.signed && value > 0 ? `+${value}` : value < 0 ? `−${-value}` : String(value);
}

function formatValue(series: ChartSeries, value: number): string {
  const rounded = Math.round(value);
  if (series.signed) {
    return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${-rounded}` : "0";
  }
  return whole.format(rounded);
}

/** The size the chart's box has on the page; null until the browser has laid it out. */
function useBoxSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

export default function LeagueChart({ history }: { history: LeagueHistory }) {
  const { gameweeks, rows } = history;
  const teamCount = rows.length;
  const myTeam = useMyTeamId();

  // The address can name the chart and the teams to open with. It is read
  // once: after that the state leads and the address follows.
  const searchParams = useSearchParams();
  const [series, setSeries] = useState<ChartSeries>(
    () => CHART_SERIES.find((s) => s.id === searchParams.get("chart")) ?? DEFAULT_SERIES
  );
  // Null while the visitor has not chosen teams: then the leaders and their
  // own team are shown, and their team (known only once the browser has
  // read its storage) can join after the first render.
  const [chosen, setChosen] = useState<Slots | null>(() =>
    slotsFromUrl(searchParams.get("teams"), rows)
  );
  const slots = chosen ?? defaultSlots(rows, myTeam);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const pillRow = useCentredActive<HTMLDivElement>(series.id);
  const boxRef = useRef<HTMLDivElement>(null);
  const size = useBoxSize(boxRef);

  const values = useMemo(() => series.values(history), [series, history]);

  const writeUrl = (nextSeries: ChartSeries, nextSlots: Slots | null) => {
    const teams = nextSlots
      ? Object.entries(nextSlots)
          .sort((a, b) => a[1] - b[1])
          .map(([id]) => id)
          .join(",")
      : "";
    const query = withTableState(
      window.location.search,
      { chart: nextSeries.id, teams },
      { chart: DEFAULT_SERIES.id, teams: "" }
    );
    window.history.replaceState(null, "", window.location.pathname + query + window.location.hash);
  };

  const showSeries = (next: ChartSeries) => {
    setSeries(next);
    setHoverIndex(null);
    writeUrl(next, chosen);
  };

  const toggle = (teamId: number) => {
    const next = { ...slots };
    if (next[teamId] !== undefined) {
      delete next[teamId];
    } else {
      const slot = SERIES_COLOURS.findIndex((_, i) => !Object.values(next).includes(i));
      if (slot < 0) return;
      next[teamId] = slot;
    }
    setChosen(next);
    writeUrl(series, next);
  };

  if (gameweeks.length === 0 || teamCount === 0) {
    return null;
  }

  const highlighted = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => slots[row.teamId] !== undefined)
    .sort((a, b) => slots[a.row.teamId] - slots[b.row.teamId]);
  const background = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => slots[row.teamId] === undefined);
  const freeSlot = SERIES_COLOURS.findIndex((_, i) => !Object.values(slots).includes(i));
  const colourOf = (row: LeagueHistoryRow) => SERIES_COLOURS[slots[row.teamId]];

  return (
    <figure className="mb-4">
      <div
        ref={pillRow}
        className="view-pills d-flex flex-nowrap flex-sm-wrap gap-2 overflow-x-auto mb-3"
        role="group"
        aria-label="Charts"
      >
        {CHART_SERIES.map((option) => {
          const active = option.id === series.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`btn btn-sm rounded-pill text-nowrap ${
                active ? "btn-primary" : "btn-outline-secondary btn-quiet"
              }`}
              aria-pressed={active}
              onClick={() => showSeries(option)}
            >
              {option.name}
            </button>
          );
        })}
      </div>

      <figcaption>
        <h2 className="h5 mb-2">{series.name} by gameweek</h2>
      </figcaption>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        {highlighted.map(({ row }) => (
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
                stroke={colourOf(row)}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span className={`text-body${row.teamId === myTeam ? " fw-bold" : ""}`}>
              {row.teamName}
            </span>
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
            {background
              .map(({ row }) => row)
              .sort((a, b) => a.teamName.localeCompare(b.teamName))
              .map((row) => (
                <option key={row.teamId} value={row.teamId}>
                  {row.teamName}
                </option>
              ))}
          </Form.Select>
        )}
      </div>

      {/* The box has its height from the stylesheet, so the page does not
          jump when the chart is drawn into it at its measured size. */}
      <div ref={boxRef} className="league-chart position-relative">
        {size && size.width > 0 && (
          <Plot
            width={size.width}
            height={size.height}
            series={series}
            gameweeks={gameweeks}
            values={values}
            highlighted={highlighted}
            background={background}
            colourOf={colourOf}
            hoverIndex={hoverIndex}
            setHoverIndex={setHoverIndex}
          />
        )}
      </div>
      {/* Below the chart, so that on a phone the chart starts on the first screen. */}
      <p className="text-secondary small mt-2 mb-0">
        {series.description} Highlighted teams are coloured; every other team is drawn in grey.
        {teamCount > MAX_HIGHLIGHTED &&
          ` Up to ${MAX_HIGHLIGHTED} teams can be highlighted at once.`}
      </p>
    </figure>
  );
}

interface PlotProps {
  width: number;
  height: number;
  series: ChartSeries;
  gameweeks: number[];
  /** One array per row of the history. */
  values: (number | null)[][];
  highlighted: { row: LeagueHistoryRow; index: number }[];
  background: { row: LeagueHistoryRow; index: number }[];
  colourOf: (row: LeagueHistoryRow) => string;
  hoverIndex: number | null;
  setHoverIndex: (index: number | null) => void;
}

function Plot({
  width,
  height,
  series,
  gameweeks,
  values,
  highlighted,
  background,
  colourOf,
  hoverIndex,
  setHoverIndex,
}: PlotProps) {
  const narrow = width < PHONE_WIDTH;
  const teamCount = values.length;
  const present = values.flat().filter((v): v is number => v !== null);
  if (present.length === 0) {
    return (
      <p className="text-secondary small position-absolute top-50 start-50 translate-middle text-center">
        FPL has no figures for this chart yet.
      </p>
    );
  }
  const min = Math.min(...present);
  const max = Math.max(...present);

  const top = 12;
  const bottom = 34;
  const plotH = height - top - bottom;

  // One tick per 40 pixels or so; positions keep their own steps.
  const tickCount = Math.max(2, Math.floor(plotH / 40));
  const ticks =
    series.id === "position"
      ? positionTicks(max)
      : series.log
        ? logTicks(min, max, tickCount)
        : linearTicks(series.signed ? Math.min(min, 0) : min, series.signed ? Math.max(max, 0) : max, tickCount);
  const [lo, hi] =
    series.id === "position"
      ? [1, Math.max(max, 2)]
      : [Math.min(ticks[0], min), Math.max(ticks[ticks.length - 1], max)];

  const tickLabels = ticks.map((t) => formatTick(series, t));
  const left = 10 + Math.max(...tickLabels.map((label) => label.length)) * 7;
  const right = narrow ? 12 : 170;
  const plotW = width - left - right;

  const x = (index: number) =>
    left + (gameweeks.length === 1 ? plotW / 2 : (index / (gameweeks.length - 1)) * plotW);
  const y = (value: number) => {
    const scale = series.log ? Math.log10 : (v: number) => v;
    const span = scale(hi) - scale(lo);
    const t = span === 0 ? 0.5 : (scale(value) - scale(lo)) / span;
    return top + (series.lowerIsBetter ? t : 1 - t) * plotH;
  };

  const pathFor = (index: number) => {
    let path = "";
    let penDown = false;
    values[index].forEach((value, i) => {
      if (value === null) {
        penDown = false;
        return;
      }
      path += `${penDown ? "L" : "M"}${x(i).toFixed(1)},${y(value).toFixed(1)}`;
      penDown = true;
    });
    return path;
  };

  // End-of-line labels, nudged apart so adjacent values do not overlap.
  const lastIndex = gameweeks.length - 1;
  const labels = narrow
    ? []
    : highlighted
        .map(({ row, index }) => ({ row, value: values[index][lastIndex] }))
        .filter((l): l is { row: LeagueHistoryRow; value: number } => l.value !== null)
        .map((l) => ({ ...l, labelY: y(l.value) }))
        .sort((a, b) => a.labelY - b.labelY);
  for (let i = 1; i < labels.length; i++) {
    labels[i].labelY = Math.max(labels[i].labelY, labels[i - 1].labelY + 14);
  }

  // Gameweek numbers at least 28 pixels apart.
  const xTickEvery = Math.ceil(gameweeks.length / Math.max(1, Math.floor(plotW / 28)));

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left - left) / plotW;
    const index = Math.round(ratio * (gameweeks.length - 1));
    setHoverIndex(Math.max(0, Math.min(gameweeks.length - 1, index)));
  };

  const hovered =
    hoverIndex === null
      ? []
      : highlighted
          .map(({ row, index }) => ({ row, value: values[index][hoverIndex] }))
          .filter((h): h is { row: LeagueHistoryRow; value: number } => h.value !== null)
          .sort((a, b) => (series.lowerIsBetter ? a.value - b.value : b.value - a.value));
  const tooltipOnLeft = hoverIndex !== null && x(hoverIndex) > left + plotW * 0.55;

  return (
    <>
      <svg
        width={width}
        height={height}
        className="d-block"
        role="img"
        aria-label={`Line chart of each team's ${series.name.toLowerCase()} after every gameweek. The table below has the league positions and scores.`}
        onPointerMove={handlePointer}
        onPointerLeave={() => setHoverIndex(null)}
        style={{ touchAction: "pan-y" }}
      >
        {/* Grid and axes: recessive, with the zero line of a signed series a little stronger */}
        {ticks.map((tick, i) => (
          <g key={tick}>
            <line
              x1={left}
              x2={left + plotW}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--bs-border-color)"
              strokeWidth="1"
              opacity={series.signed && tick === 0 ? 1 : 0.5}
            />
            <text
              x={left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={FONT_SIZE}
              fill="var(--bs-secondary-color)"
            >
              {tickLabels[i]}
            </text>
          </g>
        ))}
        {gameweeks.map((gw, i) =>
          i % xTickEvery === 0 || i === lastIndex ? (
            <text
              key={gw}
              x={x(i)}
              y={top + plotH + 18}
              textAnchor="middle"
              fontSize={FONT_SIZE}
              fill="var(--bs-secondary-color)"
            >
              {gw}
            </text>
          ) : null
        )}
        <text
          x={left + plotW / 2}
          y={height - 2}
          textAnchor="middle"
          fontSize={FONT_SIZE}
          fill="var(--bs-secondary-color)"
        >
          Gameweek
        </text>

        {/* Context lines */}
        {background.map(({ row, index }) => (
          <path
            key={row.teamId}
            d={pathFor(index)}
            fill="none"
            stroke="var(--bs-secondary-color)"
            strokeWidth="1"
            opacity={teamCount > 30 ? 0.18 : 0.35}
          />
        ))}

        {/* Highlighted lines */}
        {highlighted.map(({ row, index }) => (
          <path
            key={row.teamId}
            d={pathFor(index)}
            fill="none"
            stroke={colourOf(row)}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* A lone point (one gameweek, or a team's first week) needs a marker to be visible */}
        {highlighted.map(({ row, index }) =>
          values[index].map((value, i) =>
            value !== null &&
            (values[index][i - 1] ?? null) === null &&
            (values[index][i + 1] ?? null) === null ? (
              <circle
                key={`${row.teamId}-${i}`}
                cx={x(i)}
                cy={y(value)}
                r="4"
                fill={colourOf(row)}
              />
            ) : null
          )
        )}

        {/* Direct labels at the line ends; text stays in the text colour */}
        {labels.map(({ row, value, labelY }) => (
          <g key={row.teamId}>
            <line
              x1={x(lastIndex) + 4}
              y1={y(value)}
              x2={x(lastIndex) + 12}
              y2={labelY}
              stroke={colourOf(row)}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <text
              x={x(lastIndex) + 16}
              y={labelY}
              dominantBaseline="middle"
              fontSize={FONT_SIZE}
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
              y1={top}
              y2={top + plotH}
              stroke="var(--bs-body-color)"
              strokeWidth="1"
              opacity="0.5"
            />
            {hovered.map(({ row, value }) => (
              <circle
                key={row.teamId}
                cx={x(hoverIndex)}
                cy={y(value)}
                r="4.5"
                fill={colourOf(row)}
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
            minWidth: narrow ? 150 : 180,
            maxWidth: narrow ? width * 0.6 : undefined,
            ...(tooltipOnLeft
              ? { right: width - x(hoverIndex) + 10 }
              : { left: x(hoverIndex) + 10 }),
          }}
        >
          <div className="text-secondary mb-1">Gameweek {gameweeks[hoverIndex]}</div>
          {hovered.length === 0 && <div>No figures for the highlighted teams this week.</div>}
          {hovered.map(({ row, value }) => (
            <div key={row.teamId} className="d-flex align-items-center gap-2">
              <svg width="12" height="8" aria-hidden="true" className="flex-shrink-0">
                <line
                  x1="0"
                  y1="4"
                  x2="12"
                  y2="4"
                  stroke={colourOf(row)}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <strong>{formatValue(series, value)}</strong>
              <span className="text-secondary text-truncate">{row.teamName}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
