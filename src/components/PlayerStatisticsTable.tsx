// src/components/PlayerStatisticsTable.tsx
"use client";
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Form } from "react-bootstrap";
import DataTable, { Preset } from "@/components/DataTable";
import Narrow from "@/components/Narrow";
import type { PlayerStats } from "@/lib/stats/playerStats";

const columnHelper = createColumnHelper<PlayerStats>();

const percent = (value: number) => `${value.toFixed(1)}%`;
const signedPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}`;

const columns = [
  columnHelper.accessor("name", { id: "name", header: "Player" }),
  columnHelper.accessor("position", { id: "position", header: "Position" }),
  columnHelper.accessor("club", { id: "club", header: "Club" }),
  columnHelper.accessor("value", {
    id: "value",
    header: "Price",
    cell: ({ getValue }) => `£${getValue().toFixed(1)}m`,
  }),
  columnHelper.accessor("totalPoints", { id: "totalPoints", header: "Total Points" }),
  columnHelper.accessor("gameweekPoints", { id: "gameweekPoints", header: "GW Points" }),
  columnHelper.accessor("form", {
    id: "form",
    header: "Form",
    cell: ({ getValue }) => getValue().toFixed(1),
  }),
  columnHelper.accessor("leagueOwnershipCount", { id: "leagueOwnershipCount", header: "League Owners" }),
  columnHelper.accessor("leagueOwnershipPercentage", {
    id: "leagueOwnershipPercentage",
    header: "League Ownership %",
    cell: ({ getValue }) => percent(getValue()),
  }),
  columnHelper.accessor("globalOwnershipPercentage", {
    id: "globalOwnershipPercentage",
    header: "Global Ownership %",
    cell: ({ getValue }) => percent(getValue()),
  }),
  columnHelper.accessor("ownershipDifference", {
    id: "ownershipDifference",
    header: "League vs Global",
    cell: ({ getValue }) => signedPercent(getValue()),
  }),
  columnHelper.accessor("globalOwnershipCount", {
    id: "globalOwnershipCount",
    header: "Global Owners",
    cell: ({ getValue }) => `~${getValue().toLocaleString("en-GB")}`,
  }),
  columnHelper.accessor("leagueStartingCount", { id: "leagueStartingCount", header: "Starting" }),
  columnHelper.accessor("effectiveOwnership", {
    id: "effectiveOwnership",
    header: "Effective Ownership %",
    cell: ({ getValue }) => percent(getValue()),
  }),
  columnHelper.accessor("leagueCaptainCount", { id: "leagueCaptainCount", header: "Captained" }),
  columnHelper.accessor("leagueViceCaptainCount", { id: "leagueViceCaptainCount", header: "Vice Captained" }),
  columnHelper.accessor((row) => row.owners.length, {
    id: "owners",
    header: "Owned By",
    cell: ({ row }) => {
      const owners = row.original.owners;
      if (owners.length <= 2) return owners.join(", ");
      // Phones list two teams, so a popular player's row stays short. The
      // player's panel has the full list.
      return (
        <Narrow short={`${owners.slice(0, 2).join(", ")} +${owners.length - 2} more`}>
          {owners.join(", ")}
        </Narrow>
      );
    },
  }),
];

const descriptions: Record<string, string> = {
  name: "The player's name.",
  position: "The player's position.",
  club: "The Premier League club the player belongs to.",
  value: "The player's current price.",
  totalPoints: "Points the player has scored this season.",
  gameweekPoints: "Points the player has scored in the current gameweek.",
  form: "Average points per match over the last 30 days.",
  leagueOwnershipCount: "Number of managers in this league who own the player.",
  leagueOwnershipPercentage: "Share of managers in this league who own the player.",
  globalOwnershipPercentage: "Share of all FPL managers who own the player.",
  ownershipDifference: "League ownership minus global ownership, in percentage points. Negative means the player is rarer here than in the game overall.",
  globalOwnershipCount: "Approximate number of FPL managers worldwide who own the player.",
  leagueStartingCount: "Number of managers in this league with the player in their starting eleven.",
  effectiveOwnership: "Ownership weighted by points multiplier: a captain counts twice, a benched player not at all.",
  leagueCaptainCount: "Number of managers in this league who captained the player.",
  leagueViceCaptainCount: "Number of managers in this league who vice-captained the player.",
  owners: "The teams in this league that own the player.",
};

// Headers for phone-width screens, where the full ones are wider than the data.
// EO is the usual FPL abbreviation for effective ownership.
const shortHeaders: Record<string, string> = {
  position: "Pos",
  totalPoints: "Total",
  gameweekPoints: "GW",
  leagueOwnershipCount: "Owners",
  leagueOwnershipPercentage: "League %",
  globalOwnershipPercentage: "Global %",
  ownershipDifference: "Diff",
  globalOwnershipCount: "Global #",
  leagueStartingCount: "Start",
  effectiveOwnership: "EO %",
  leagueCaptainCount: "Capt",
  leagueViceCaptainCount: "Vice",
};

const presets: Preset[] = [
  {
    name: "Differentials",
    columns: ["name", "club", "value", "gameweekPoints", "leagueOwnershipCount", "leagueOwnershipPercentage", "globalOwnershipPercentage", "ownershipDifference", "owners"],
  },
  {
    name: "Ownership Overview",
    columns: ["name", "leagueOwnershipCount", "leagueOwnershipPercentage", "leagueStartingCount", "effectiveOwnership", "globalOwnershipPercentage", "globalOwnershipCount"],
  },
  {
    name: "Captaincy Overview",
    columns: ["name", "leagueCaptainCount", "leagueViceCaptainCount", "effectiveOwnership", "gameweekPoints"],
  },
  {
    name: "Player Details",
    columns: ["name", "position", "club", "value", "totalPoints", "form"],
  },
  {
    name: "Form and Points",
    columns: ["name", "club", "position", "value", "form", "totalPoints", "gameweekPoints", "globalOwnershipPercentage", "leagueOwnershipCount"],
  },
  { name: "All Columns" },
];

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

export default function PlayerStatisticsTable({ players }: { players: PlayerStats[] }) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [club, setClub] = useState("");
  const [owner, setOwner] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxOwners, setMaxOwners] = useState("");
  // "owned" | "unowned" | "" (everyone). Owned first: that is the league's picture.
  const [ownership, setOwnership] = useState("owned");

  const clubs = useMemo(() => uniqueSorted(players.map((p) => p.club)), [players]);
  const owners = useMemo(
    () => uniqueSorted(players.flatMap((p) => p.owners)),
    [players]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const priceLimit = Number.parseFloat(maxPrice);
    const ownersLimit = Number.parseInt(maxOwners, 10);
    return players.filter(
      (p) =>
        (!term || p.name.toLowerCase().includes(term)) &&
        (!position || p.position === position) &&
        (!club || p.club === club) &&
        (!owner || p.owners.includes(owner)) &&
        (ownership !== "owned" || p.leagueOwnershipCount > 0) &&
        (ownership !== "unowned" || p.leagueOwnershipCount === 0) &&
        (Number.isNaN(priceLimit) || p.value <= priceLimit) &&
        (Number.isNaN(ownersLimit) || p.leagueOwnershipCount <= ownersLimit)
    );
  }, [players, search, position, club, owner, maxPrice, maxOwners, ownership]);

  const isFiltered = Boolean(
    search || position || club || owner || maxPrice || maxOwners || ownership !== "owned"
  );
  const clearFilters = () => {
    setSearch("");
    setPosition("");
    setClub("");
    setOwner("");
    setMaxPrice("");
    setMaxOwners("");
    setOwnership("owned");
  };

  return (
    <>
      <div className="row g-2 align-items-end mb-3">
        <div className="col-12 col-sm-6 col-lg-2">
          <Form.Label htmlFor="playerSearch" className="small mb-1">
            Search player
          </Form.Label>
          <Form.Control
            id="playerSearch"
            size="sm"
            type="search"
            placeholder="Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-6 col-sm-3 col-lg-1">
          <Form.Label htmlFor="positionFilter" className="small mb-1">
            Position
          </Form.Label>
          <Form.Select
            id="positionFilter"
            size="sm"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="">All</option>
            {POSITIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-6 col-sm-3 col-lg-2">
          <Form.Label htmlFor="clubFilter" className="small mb-1">
            Club
          </Form.Label>
          <Form.Select
            id="clubFilter"
            size="sm"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          >
            <option value="">All</option>
            {clubs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-6 col-sm-6 col-lg-2">
          <Form.Label htmlFor="ownershipFilter" className="small mb-1">
            In this league
          </Form.Label>
          <Form.Select
            id="ownershipFilter"
            size="sm"
            value={ownership}
            onChange={(e) => {
              setOwnership(e.target.value);
              if (e.target.value === "unowned") setOwner("");
            }}
          >
            <option value="owned">Owned</option>
            <option value="unowned">Not owned</option>
            <option value="">All players</option>
          </Form.Select>
        </div>
        <div className="col-6 col-sm-6 col-lg-2">
          <Form.Label htmlFor="ownerFilter" className="small mb-1">
            Owned by
          </Form.Label>
          <Form.Select
            id="ownerFilter"
            size="sm"
            value={owner}
            disabled={ownership === "unowned"}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="">Any team</option>
            {owners.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-6 col-sm-3 col-lg-1">
          <Form.Label htmlFor="maxPriceFilter" className="small mb-1">
            Max price
          </Form.Label>
          <Form.Control
            id="maxPriceFilter"
            size="sm"
            type="number"
            min={0}
            step={0.5}
            placeholder="£m"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="col-6 col-sm-3 col-lg-1">
          <Form.Label htmlFor="maxOwnersFilter" className="small mb-1">
            Max owners
          </Form.Label>
          <Form.Control
            id="maxOwnersFilter"
            size="sm"
            type="number"
            min={1}
            step={1}
            placeholder="Any"
            value={maxOwners}
            onChange={(e) => setMaxOwners(e.target.value)}
          />
        </div>
        <div className="col-12 col-lg-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary w-100"
            onClick={clearFilters}
            disabled={!isFiltered}
          >
            Clear
          </button>
        </div>
      </div>
      <p className="text-secondary small mb-2" aria-live="polite">
{filtered.length} of {players.length} players
      </p>

      <DataTable
        data={filtered}
        columns={columns}
        presets={presets}
        descriptions={descriptions}
        initialPreset="Differentials"
        initialSorting={[{ id: "leagueOwnershipCount", desc: false }]}
        emptyMessage="No players match these filters."
        shortHeaders={shortHeaders}
        stickyColumn="name"
        subtitleColumn="club"
        wrapColumns={["owners"]}
        detailNoun="player"
      />
    </>
  );
}
