// src/components/HomePage.tsx
// The front page: the league and team ID boxes and how to find the IDs.
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import Link from "next/link";
import { forgetLeague, useRememberedLeague } from "@/lib/rememberedLeague";
import { Accordion } from 'react-bootstrap';
import { parseLeagueId, parseLeagueUrl, MAX_MANAGERS } from "@/lib/leagueId";
import { parseTeamId, parseTeamUrl } from "@/lib/teamId";
import { idInputError, idInputProblem } from "@/lib/idInput";
import { MYFPL_LEAGUE } from "@/lib/site";

// Accordion sections, by event key.
const LEAGUE_HELP = "0";
const TEAM_HELP = "2";

export default function HomePage() {
  const [leagueId, setLeagueId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  // Opening a league or a team waits for FPL before any of the new page can
  // be drawn. Until then the pressed button shows that it is working.
  const [openingLeague, startOpeningLeague] = useTransition();
  const [openingTeam, startOpeningTeam] = useTransition();

  const remembered = useRememberedLeague();
  const [teamId, setTeamId] = useState("");
  const [teamError, setTeamError] = useState("");
  // The open help section. A visitor who typed a name instead of a number is
  // shown the section that says where the number is.
  const [openHelp, setOpenHelp] = useState<string | null>(LEAGUE_HELP);

  // A URL pasted into the wrong box still goes to the right place.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseLeagueId(leagueId);
    if (parsed) {
      setError("");
      startOpeningLeague(() => router.push(`/dashboard/${parsed}/gameweek`));
      return;
    }
    const team = parseTeamUrl(leagueId);
    if (team) {
      setError("");
      startOpeningLeague(() => router.push(`/team/${team}`));
      return;
    }
    setError(idInputError(leagueId, "league"));
    if (idInputProblem(leagueId) === "name") setOpenHelp(LEAGUE_HELP);
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTeamId(teamId);
    if (parsed) {
      setTeamError("");
      startOpeningTeam(() => router.push(`/team/${parsed}`));
      return;
    }
    const league = parseLeagueUrl(teamId);
    if (league) {
      setTeamError("");
      startOpeningTeam(() => router.push(`/dashboard/${league}/gameweek`));
      return;
    }
    setTeamError(idInputError(teamId, "team"));
    if (idInputProblem(teamId) === "name") setOpenHelp(TEAM_HELP);
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
            className="img-fluid home-logo"
            priority
          />
        </div>

        {/* Card section - full width on mobile, half width on desktop */}
        <div className="col-12 col-lg-6">
          <div className="card mx-auto" style={{ maxWidth: '500px' }}>
            <div className="card-header text-center">
              {/* The page's main heading for search engines; styled as before. */}
              <h1 className="h3">Welcome to MyFPL.net</h1>
            </div>
            <div className="card-body">
              <p className="card-text text-center">
                Enter your Fantasy Premier League (FPL) league ID to go straight to your league, or your team ID to choose from your leagues.
              </p>
              {remembered && (
                <div className="d-flex gap-2 mb-3">
                  <Link
                    className="btn btn-primary flex-grow-1 text-truncate"
                    href={`/dashboard/${remembered.id}/gameweek${
                      remembered.team ? `?team=${remembered.team}` : ""
                    }`}
                  >
                    Back to {remembered.name}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={forgetLeague}
                  >
                    Forget
                  </button>
                </div>
              )}
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
                  <button type="submit" className="btn btn-primary" disabled={openingLeague}>
                    {openingLeague && (
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    )}
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
                  <button type="submit" className="btn btn-outline-primary" disabled={openingTeam}>
                    {openingTeam && (
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    )}
                    Find my leagues
                  </button>
                </div>
                {teamError && (
                  <div id="teamIdError" className="text-danger small mt-2">
                    {teamError}
                  </div>
                )}
              </form>

              <Accordion
                activeKey={openHelp}
                onSelect={(key) => setOpenHelp(typeof key === "string" ? key : null)}
                flush
              >
                <Accordion.Item eventKey={LEAGUE_HELP}>
                  <Accordion.Header>How to find your League ID</Accordion.Header>
                  {/* The FPL app shows no web addresses, so the ID cannot be
                      read in it; most visitors are on phones, so the steps
                      go through the phone's browser. */}
                  <Accordion.Body>
                    <ol className="ps-3">
                      <li>
                        Open the <a href="https://fantasy.premierleague.com/leagues" target="_blank" rel="noreferrer">FPL leagues page</a> in a browser and sign in. The FPL app does not show the League ID; if the link opens the app, go to <code>fantasy.premierleague.com</code> in Chrome or Safari instead.
                      </li>
                      <li>Tap or click your league.</li>
                      <li>
                        Copy the address from the address bar (on a phone, tap it to see the whole address) and paste it above.
                      </li>
                    </ol>
                    <p>
                      The League ID is the number after <code>leagues</code>: in <code>fantasy.premierleague.com/leagues/123456/standings/c</code> it is <strong>123456</strong>.
                    </p>
                    <Image
                      src="/findleagueid.PNG"
                      alt="Screenshot showing where to find the League ID"
                      width={450}
                      height={40}
                      className="img-fluid mb-3"
                    />
                    <p className="small text-body-secondary mb-0">
                      An invite code such as <code>{MYFPL_LEAGUE.code}</code> is for joining a league, not its ID. Join first, then follow the steps.
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={TEAM_HELP}>
                  <Accordion.Header>How to find your Team ID</Accordion.Header>
                  <Accordion.Body>
                    <p>
                      On the <a href="https://fantasy.premierleague.com" target="_blank" rel="noreferrer">FPL site</a>, open the <strong>Points</strong> page. The Team ID is the number after <code>entry</code> in the URL.
                      <br />
                      For example, in <code>fantasy.premierleague.com/entry/123456/event/12</code> the Team ID is <strong>123456</strong>. You can also paste the whole URL.
                    </p>
                    <p className="small text-body-secondary mb-0">
                      The FPL app shows no addresses: on a phone, open the FPL site in your browser for this step.
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
              <p className="small mb-2">
                Play in the{" "}
                <a href={MYFPL_LEAGUE.joinUrl} target="_blank" rel="noreferrer">
                  MyFPL.net league
                </a>
                {" "}on FPL (code <strong>{MYFPL_LEAGUE.code}</strong>).
              </p>
              <p className="mb-0">© {new Date().getFullYear()} - MyFPL.net</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}