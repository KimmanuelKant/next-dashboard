// src/app/dashboard/[leagueId]/page.tsx
"use client";
import { useState } from "react";
import TeamStatistics from "@/components/TeamStatistics";
import dynamic from 'next/dynamic';

// Dynamically import PlayerStatistics as a client component (assuming it's client-side)
const PlayerStatistics = dynamic(() => import('@/components/PlayerStatistics'), { ssr: false });

export default function DashboardPage({ params }: { params: { leagueId: string } }) {
  const [activeTab, setActiveTab] = useState("team");

  const renderTabContent = () => {
    switch (activeTab) {
      case "team":
        return <TeamStatistics leagueId={params.leagueId} />;
      case "player":
        return <PlayerStatistics leagueId={params.leagueId} />;
      case "awards":
        return <div>Awards: Under Development</div>;
      case "chat":
        return <div>Chat: Under Development</div>;
      default:
        return <TeamStatistics leagueId={params.leagueId} />;
    }
  };

  return (
    <div>
      <h1>FPL Dashboard for League {params.leagueId}</h1>
      <nav>
        <button onClick={() => setActiveTab("team")}>Team Statistics</button>
        <button onClick={() => setActiveTab("player")}>Player Statistics</button>
        <button onClick={() => setActiveTab("awards")}>Awards</button>
        <button onClick={() => setActiveTab("chat")}>Chat</button>
      </nav>
      <div>{renderTabContent()}</div>
    </div>
  );
}
