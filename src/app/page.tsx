// src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [leagueId, setLeagueId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueId) {
      router.push(`/dashboard/${leagueId}`);
    }
  };

  return (
    <div>
      <h1>Welcome to the FPL Dashboard</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter League ID"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
        />
        <button type="submit">Go to Dashboard</button>
      </form>
    </div>
  );
}
