// src/app/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import Accordion from 'react-bootstrap/Accordion';


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
    <div className="container mt-5">
      {/* Centered logo */}
      <div className="text-center mb-4">
        <Image
          src="/myfplnetlogo.png"
          alt="MyFPL.net Logo"
          width={382}
          height={371}
        />
      </div>

      {/* Card with welcome message and form */}
      <div className="card mx-auto" style={{ maxWidth: '500px' }}>
        <div className="card-header text-center">
          <h3>Welcome to MyFPL.net</h3>
        </div>
        <div className="card-body">
          <p className="card-text text-center">
            Enter your Fantasy Premier League (FPL) league ID to access your personalized dashboard.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter League ID"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
              />
              <button type="submit">
                Go to Dashboard
              </button>
            </div>
          </form>
        </div>
        <Accordion defaultActiveKey="0" flush>
      <Accordion.Item eventKey="0">
        <Accordion.Header>About MyFPL.net</Accordion.Header>
        <Accordion.Body>
          <p>
            MyFPL.net provides improved tables and statistics for your Fantasy Premier League (FPL) mini-leagues.
            <br>
            </br>Find new statistics for your league presented in a user friendly table
          </p>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
        <div className="card-footer text-center">
          <p className="mb-0">© KunstiguIntelligens 2024</p>
        </div>
      </div>
    </div>
  );
}
