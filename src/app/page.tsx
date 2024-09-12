// src/app/page.tsx
"use client";
import  "bootstrap/dist/css/bootstrap.min.css"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [leagueId, setLeagueId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueId) {
      router.push(`/dashboard/${leagueId}/team`);
    }
  };

  return (
    <div>
     

      <div className="card m-4">
        <div className="card-header">  <h3>Welcome to the FPL Dashboard</h3></div>
  <div className="card-body">
     <form onSubmit={handleSubmit} className="d-flex justify-content-between">
        <input
          type="text"
          placeholder="Enter League ID"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
        />
        <button type="submit">Go to Dashboard</button>
      </form>
  </div>
          <div className="card-footer">  <p className="">copyright KIM AS HANSEN 2024</p></div>
</div>
    
    </div>
  );
}
