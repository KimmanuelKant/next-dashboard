// src/app/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Accordion } from 'react-bootstrap';
import { parseLeagueId, parseLeagueUrl, MAX_MANAGERS } from "@/lib/leagueId";
import { parseTeamId, parseTeamUrl } from "@/lib/teamId";

export default function HomePage() {
  const [leagueId, setLeagueId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const [teamId, setTeamId] = useState("");
  const [teamError, setTeamError] = useState("");

  // A URL pasted into the wrong box still goes to the right place.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseLeagueId(leagueId);
    if (parsed) {
      setError("");
      router.push(`/dashboard/${parsed}/gameweek`);
      return;
    }
    const team = parseTeamUrl(leagueId);
    if (team) {
      setError("");
      router.push(`/team/${team}`);
      return;
    }
    setError("Enter the league number, or paste the league URL from the FPL site.");
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTeamId(teamId);
    if (parsed) {
      setTeamError("");
      router.push(`/team/${parsed}`);
      return;
    }
    const league = parseLeagueUrl(teamId);
    if (league) {
      setTeamError("");
      router.push(`/dashboard/${league}/gameweek`);
      return;
    }
    setTeamError("Enter the team number, or paste your team URL from the FPL site.");
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
                Enter your Fantasy Premier League (FPL) league ID to go straight to your league, or your team ID to choose from your leagues.
              </p>
              <form onSubmit={handleSubmit} className="mb-3">
                <label htmlFor="leagueId" className="form-label small mb-1">
                  League ID
                </label>
                <div className="input-group">
                  <input
                    id="leagueId"
                    type="text"
                    inputMode="numeric"
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

              <form onSubmit={handleTeamSubmit} className="mb-3">
                <label htmlFor="teamId" className="form-label small mb-1">
                  Or your team ID
                </label>
                <div className="input-group">
                  <input
                    id="teamId"
                    type="text"
                    inputMode="numeric"
                    className={`form-control${teamError ? " is-invalid" : ""}`}
                    placeholder="Team ID or team URL"
                    aria-describedby={teamError ? "teamIdError" : undefined}
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                  />
                  <button type="submit" className="btn btn-outline-primary">
                    Find my leagues
                  </button>
                </div>
                {teamError && (
                  <div id="teamIdError" className="text-danger small mt-2">
                    {teamError}
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
                <Accordion.Item eventKey="2">
                  <Accordion.Header>How to find your Team ID</Accordion.Header>
                  <Accordion.Body>
                    <p>
                      On the <a href="https://fantasy.premierleague.com" target="_blank" rel="noreferrer">FPL site</a>, open the <strong>Points</strong> page. The Team ID is the number after <code>entry</code> in the URL.
                      <br />
                      For example, in <code>fantasy.premierleague.com/entry/123456/event/12</code> the Team ID is <strong>123456</strong>. You can also paste the whole URL.
                    </p>
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