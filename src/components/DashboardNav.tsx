// src/components/DashboardNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { segment: "team", label: "Team Statistics" },
  { segment: "player", label: "Player Statistics" },
];

export default function DashboardNav({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();

  return (
    <nav className="mb-3">
      <ul className="nav nav-tabs">
        {tabs.map(({ segment, label }) => {
          const href = `/dashboard/${leagueId}/${segment}`;
          const isActive = pathname === href;
          return (
            <li className="nav-item" key={segment}>
              <Link
                className={`nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                href={href}
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
