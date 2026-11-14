// src/components/DashboardNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTeamParam } from "@/lib/myTeam";

const tabs = [
  { segment: "gameweek", label: "This Gameweek" },
  { segment: "season", label: "Season" },
  { segment: "scout", label: "Scout" },
  { segment: "history", label: "League History" },
];

export default function DashboardNav({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();
  // Carried from tab to tab so the visitor's own row stays highlighted.
  const team = useTeamParam();
  const query = team ? `?team=${team}` : "";

  return (
    <nav className="mb-3">
      <ul className="nav nav-tabs flex-nowrap overflow-x-auto overflow-y-hidden text-nowrap">
        {tabs.map(({ segment, label }) => {
          const href = `/dashboard/${leagueId}/${segment}`;
          const isActive = pathname === href;
          return (
            <li className="nav-item" key={segment}>
              <Link
                className={`nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                href={href + query}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li className="nav-item ms-auto">
          <Link className="nav-link" href="/">
            Change league
          </Link>
        </li>
      </ul>
    </nav>
  );
}
