// src/components/DashboardNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Narrow from "@/components/Narrow";
import { useTeamParam } from "@/lib/myTeam";

// `short` is the label on phone-width screens, so all four tabs fit the row.
const tabs = [
  { segment: "gameweek", label: "This Gameweek", short: "Gameweek" },
  { segment: "season", label: "Season" },
  { segment: "scout", label: "Scout" },
  // The segment stays "history" from when the tab was League History, so old
  // links work.
  { segment: "history", label: "Charts" },
];

export default function DashboardNav({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();
  // Carried from tab to tab so the visitor's own row stays highlighted.
  const team = useTeamParam();
  const query = team ? `?team=${team}` : "";

  return (
    <nav className="mb-3">
      <ul className="nav nav-tabs flex-nowrap overflow-x-auto overflow-y-hidden text-nowrap">
        {tabs.map(({ segment, label, short }) => {
          const href = `/dashboard/${leagueId}/${segment}`;
          const isActive = pathname === href;
          return (
            <li className="nav-item" key={segment}>
              <Link
                className={`nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                href={href + query}
              >
                {short ? <Narrow short={short}>{label}</Narrow> : label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
