// src/app/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Accordion } from 'react-bootstrap';
import { parseLeagueId, MAX_MANAGERS } from "@/lib/leagueId";

export default function HomePage() {
  const [leagueId, setLeagueId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseLeagueId(leagueId);
    if (!parsed) {
      setError("Enter the league number, or paste the league URL from the FPL site.");
      return;
    }
    setError("");
    router.push(`/dashboard/${parsed}/gameweek`);
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
                    className={`form-control${error ? " is-invalid" : ""}`}
                    placeholder="League ID or league URL"
                    aria-describedby={error ? "leagueIdError" : undefined}
                    value={leagueId}
                    onChange={(e) => setLeagueId(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    Go to Dashboard
                  </button>
                </div>
                {error && (
                  <div id="leagueIdError" className="text-danger small mt-2">
                    {error}
                  </div>
                )}
              </form>

              <Accordion defaultActiveKey="0" flush>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>How to find your League ID</Accordion.Header>
                  <Accordion.Body>
                    <p>
                      Head to the <a href="https://fantasy.premierleague.com/leagues" target="_blank" rel="noreferrer">Fantasy Premier Leagues</a> page and click on your league. The League ID is the number at the end of the URL.
                      <br />
                      For example, in <code>fantasy.premierleague.com/leagues/123456/standings/c</code> the League ID is <strong>123456</strong>. You can also paste the whole URL.
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
                      <strong>MyFPL.net</strong> shows what the official site does not: which players are differentials in your mini-league, who owns whom, and detailed statistics for every manager, in sortable tables you can customise.
                      <br />
                      Leagues are classic leagues of up to {MAX_MANAGERS} teams; bigger leagues show the top {MAX_MANAGERS}.
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
            <div className="card-footer text-center">
              <p className="mb-0">© {new Date().getFullYear()} - MyFPL.net</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}