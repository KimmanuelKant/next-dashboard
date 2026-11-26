// src/components/ScoreSpread.tsx
"use client";
import { useRef, useState } from "react";
import { beeswarm } from "@/lib/beeswarm";
import { useBoxSize } from "@/lib/useBoxSize";

export interface SpreadTeam {
  teamId: number;
  teamName: string;
  /** After hits; the projected score while the gameweek is played. */
  score: number;
  /** The chip played, as visitors know it ("Bench Boost"). */
  chip: string | null;
}

// The visitor's own dot takes the first categorical colour, as their line
// does on the Charts tab; every other team is a neutral dot.
const YOU = "#3987e5";
const RADIUS = 6;
const SMALL_RADIUS = 4;
/** Above this the dots shrink, so a crowded league stays a strip rather than a wall. */
const MAX_SWARM = 180;
const TOP = 34; // room for the average labels and "You"
const AXIS = 26;
const SIDE = 14;

const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
};

const signed = (value: number) => {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${-rounded}` : "0";
};

/** "joint 4th of 20" or "4th of 20". */
function placeOf(teams: SpreadTeam[], team: SpreadTeam): string {
  const place = 1 + teams.filter((other) => other.score > team.score).length;
  const joint = teams.some((other) => other !== team && other.score === team.score);
  return `${joint ? "joint " : ""}${ordinal(place)} of ${teams.length}`;
}

function aboveOrBelow(gap: number): string {
  const rounded = Math.round(gap);
  if (rounded === 0) return "level with the league average";
  return `${Math.abs(rounded)} ${rounded > 0 ? "above" : "below"} the league average`;
}

export default function ScoreSpread({
  teams,
  myTeam,
  fplAverage,
  live,
}: {
  /** The teams that had a team this gameweek. */
  teams: SpreadTeam[];
  myTeam: number | null;
  /** FPL's average over every team, as it stands; null before FPL has one. */
  fplAverage: number | null;
  live: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const size = useBoxSize(boxRef);
  const [active, setActive] = useState<{ index: number; pinned: boolean } | null>(null);

  if (teams.length < 2) {
    return null;
  }

  const scores = teams.map((t) => t.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const mine = teams.find((t) => t.teamId === myTeam) ?? null;
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  const headline = mine ? (
    <>
      You scored {mine.score}
      {live ? " so far" : ""}: <strong>{placeOf(teams, mine)}</strong> this gameweek,{" "}
      {aboveOrBelow(mine.score - average)}.
    </>
  ) : (
    <>
      {teams.length} scores from {min} to {max}
      {live ? " so far" : ""}. League average {Math.round(average)}.
    </>
  );

  return (
    <figure className="mb-3">
      <figcaption>
        <h2 className="h6 mb-1">Scores this gameweek</h2>
        <p className="small mb-1">{headline}</p>
      </figcaption>
      <div ref={boxRef} className="position-relative">
        {size && size.width > 0 && (
          <Strip
            width={size.width}
            teams={teams}
            mine={mine}
            average={average}
            fplAverage={fplAverage}
            active={active}
            setActive={setActive}
          />
        )}
      </div>
    </figure>
  );
}

interface StripProps {
  width: number;
  teams: SpreadTeam[];
  mine: SpreadTeam | null;
  average: number;
  fplAverage: number | null;
  active: { index: number; pinned: boolean } | null;
  setActive: (active: { index: number; pinned: boolean } | null) => void;
}

function Strip({ width, teams, mine, average, fplAverage, active, setActive }: StripProps) {
  const scores = teams.map((t) => t.score);
  const reference = fplAverage === null ? [] : [fplAverage];
  // Round tens either side of every score and both averages.
  const lo = Math.floor((Math.min(...scores, ...reference) - 2) / 10) * 10;
  const hi = Math.ceil((Math.max(...scores, ...reference) + 2) / 10) * 10;
  const plotW = width - SIDE * 2;
  const x = (score: number) => SIDE + ((score - lo) / (hi - lo)) * plotW;
  const xs = scores.map(x);
  const mineIndex = mine ? teams.indexOf(mine) : -1;
  const first = mineIndex >= 0 ? [mineIndex] : [];

  let radius = RADIUS;
  let ys = beeswarm(xs, radius, first);
  const extent = () => Math.max(...ys.map(Math.abs)) + radius;
  if (extent() * 2 > MAX_SWARM) {
    radius = SMALL_RADIUS;
    ys = beeswarm(xs, radius, first);
  }
  const half = extent();
  const centre = TOP + half + 4;
  const height = centre + half + 4 + AXIS;
  const axisY = height - AXIS + 4;

  // Ticks every 10 points, or every 20 when the strip is narrow.
  const step = plotW / ((hi - lo) / 10) < 34 ? 20 : 10;
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);

  // The two averages' labels sit side by side, each leaning away from the other.
  const lines = [
    { value: average, label: `League avg ${Math.round(average)}`, dash: "4 3", opacity: 0.8 },
    ...(fplAverage === null
      ? []
      : [{ value: fplAverage, label: `FPL avg ${fplAverage}`, dash: "1 3", opacity: 0.6 }]),
  ].sort((a, b) => a.value - b.value);
  const anchors =
    lines.length === 2 ? (["end", "start"] as const) : (["middle"] as const);

  const nearest = (clientX: number, clientY: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best = -1;
    let bestDistance = 16; // a target bigger than the dot
    xs.forEach((dx, i) => {
      const distance = Math.hypot(dx - px, centre + ys[i] - py);
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    return best >= 0 ? best : null;
  };

  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "mouse" || active?.pinned) return;
    const index = nearest(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    if (index !== (active?.index ?? null)) setActive(index === null ? null : { index, pinned: false });
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const index = nearest(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    const same = index !== null && active?.pinned && active.index === index;
    setActive(index === null || same ? null : { index, pinned: true });
  };

  const shown = active && teams[active.index];
  const shownX = active ? xs[active.index] : 0;
  const shownY = active ? centre + ys[active.index] : 0;

  return (
    <>
      <svg
        width={width}
        height={height}
        className="d-block"
        role="img"
        aria-label="Every team's score this gameweek as a dot along a line of points, with the league and FPL averages marked. The table below has the scores."
        onPointerMove={handleMove}
        onPointerLeave={() => {
          if (!active?.pinned) setActive(null);
        }}
        onClick={handleClick}
      >
        {/* Axis: recessive */}
        <line
          x1={SIDE}
          x2={SIDE + plotW}
          y1={axisY}
          y2={axisY}
          stroke="var(--bs-border-color)"
        />
        {ticks.map((tick) => (
          <text
            key={tick}
            x={x(tick)}
            y={axisY + 16}
            textAnchor="middle"
            fontSize="12"
            fill="var(--bs-secondary-color)"
          >
            {tick}
          </text>
        ))}

        {/* Averages */}
        {lines.map((line, i) => (
          <g key={line.label}>
            <line
              x1={x(line.value)}
              x2={x(line.value)}
              y1={TOP - 14}
              y2={axisY}
              stroke="var(--bs-body-color)"
              strokeDasharray={line.dash}
              opacity={line.opacity}
            />
            <text
              x={x(line.value) + (anchors[i] === "end" ? -4 : anchors[i] === "start" ? 4 : 0)}
              y={TOP - 18}
              textAnchor={anchors[i]}
              fontSize="11"
              fill="var(--bs-secondary-color)"
            >
              {line.label}
            </text>
          </g>
        ))}

        {/* Every team; the visitor's own dot is drawn last, on top */}
        {teams.map((team, i) =>
          i === mineIndex ? null : (
            <circle
              key={team.teamId}
              cx={xs[i]}
              cy={centre + ys[i]}
              r={radius}
              fill="var(--bs-secondary-color)"
              opacity="0.75"
            />
          )
        )}
        {mine && (
          <g>
            <circle
              cx={xs[mineIndex]}
              cy={centre + ys[mineIndex]}
              r={radius + 1}
              fill={YOU}
              stroke="var(--bs-body-bg)"
              strokeWidth="2"
            />
            <text
              x={xs[mineIndex]}
              y={centre - half - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--bs-body-color)"
            >
              You
            </text>
          </g>
        )}
        {active && (
          <circle
            cx={shownX}
            cy={shownY}
            r={radius + 3}
            fill="none"
            stroke="var(--bs-body-color)"
            strokeWidth="2"
            pointerEvents="none"
          />
        )}
      </svg>

      {shown && (
        <div
          className="position-absolute border rounded shadow-sm bg-body-tertiary small p-2"
          style={{
            top: shownY + radius + 8,
            pointerEvents: "none",
            minWidth: 160,
            maxWidth: Math.min(260, width - 16),
            zIndex: 2,
            ...(shownX > width * 0.55
              ? { right: width - shownX - 12 }
              : { left: Math.max(0, shownX - 12) }),
          }}
        >
          <div>
            <strong>{shown.score}</strong>{" "}
            <span className="text-body">{shown.teamName}</span>
          </div>
          <div className="text-secondary">
            {placeOf(teams, shown)}, {signed(shown.score - average)} against the league average
          </div>
          {shown.chip && <div className="text-secondary">Played {shown.chip}</div>}
        </div>
      )}
    </>
  );
}
