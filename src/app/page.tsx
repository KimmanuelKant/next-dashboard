// src/app/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Accordion } from 'react-bootstrap';

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
    <div className="container min-vh-100 d-flex align-items-center py-4">
      <div className="row w-100 justify-content-center align-items-center">
        {/* Logo section - full width on mobile, half width on desktop */}
        <div className="col-12 col-lg-6 text-center mb-4 mb-lg-0">
          <Image
            src="/myfplnetlogoblue.png"
            alt="MyFPL.net Logo"
            width={382}
            height={371}
            className="img-fluid"
            priority
          />
        </div>

        {/* Card section - full width on mobile, half width on desktop */}
        <div className="col-12 col-lg-6">
          <div className="card mx-auto" style={{ maxWidth: '500px' }}>
            <div className="card-header text-center">
              <h3>Welcome to MyFPL.net</h3>
            </div>
            <div className="card-body">
              <p className="card-text text-center">
                Enter your Fantasy Premier League (FPL) league ID to access your personalized dashboard.
              </p>
              <form onSubmit={handleSubmit} className="mb-3">
                <div className="input-group">
                  <input
                    id="leagueId"
                    type="text"
                    className="form-control"
                    placeholder="Enter League ID"
                    value={leagueId}
                    onChange={(e) => setLeagueId(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    Go to Dashboard
                  </button>
                </div>
              </form>

              <Accordion defaultActiveKey="0" flush>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>How to find your League ID</Accordion.Header>
                  <Accordion.Body>
                    <p>
                      Head to the <a href="https://fantasy.premierleague.com/leagues" target="_blank" rel="noreferrer">Fantasy Premier Leagues</a> page and click on your league. The League ID is the number at the end of the URL.
                      <br />
                      For example, the League ID for <a href="https://fantasy.premierleague.com/leagues/2355363/standings/c" target="_blank" rel="noreferrer">MyFPL.net&apos;s league</a> is <strong>2355363</strong>.
                    </p>
                    <Image
                      src="/findleagueid.PNG"
                      alt="Screenshot showing where to find the League ID"
                      width={450}
                      height={40}
                      className="img-fluid mt-3"
                    />
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>About MyFPL.net</Accordion.Header>
                  <Accordion.Body>
                    <p>
                      MyFPL.net is still under development. The current version is a prototype with very limited functionality.
                      <br />
                      <strong>MyFPL.net</strong> aims to be a comprehensive dashboard that offers enhanced tables and detailed statistics for your Fantasy Premier League (FPL) mini-leagues.
                      <br />
                      Discover new insights for your league, presented in user-friendly, customizable tables.
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
            <div className="card-footer text-center">
              <p className="mb-0">© 2025 - MyFPL.net</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}