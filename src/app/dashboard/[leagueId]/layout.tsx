// src/app/dashboard/[leagueId]/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import  "bootstrap/dist/css/bootstrap.min.css"
export default function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { leagueId: string };
}) {
  const { leagueId } = params;

  return (
    <div>
      <h1>FPL Dashboard for League {leagueId}</h1>
      <nav>

              <ul className="nav">
        <li className="nav-item">
          <Link className="nav-link" href={`/dashboard/${leagueId}/team`}>Team Statistics</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" href={`/dashboard/${leagueId}/player`} >Player Statistics</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" href={`/dashboard/${leagueId}/awards`} >Awards</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" href={`/dashboard/${leagueId}/chat`} >Chat</Link>
        </li> 
    </ul>
    {/*     <Link href={`/dashboard/${leagueId}/team`}>Team Statistics</Link>
        <Link href={`/dashboard/${leagueId}/player`}>Player Statistics</Link>
        <Link href={`/dashboard/${leagueId}/awards`}>Awards</Link>
        <Link href={`/dashboard/${leagueId}/chat`}>Chat</Link> */}
      </nav>
      <div>{children}</div>
    </div>
  );
}
