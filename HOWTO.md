# HELPME.md

# Fantasy Premier League Dashboard - Internal Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Data Flow and Function Correlations](#data-flow-and-function-correlations)
    - [1. Data Fetching](#1-data-fetching)
    - [2. Data Processing](#2-data-processing)
    - [3. Data Presentation](#3-data-presentation)
4. [Key Components and Functions](#key-components-and-functions)
    - [a. fplApi.ts](#a-fplapitsts)
    - [b. leagueTeamData.ts](#b-leagueteamdatats)
    - [c. LeagueTeamStats.tsx](#c-leagueteamstattsx)
5. [Third-Party Libraries](#third-party-libraries)
6. [Future Integrations](#future-integrations)
7. [Troubleshooting](#troubleshooting)
8. [Additional Resources](#additional-resources)

---

## Introduction

The **Fantasy Premier League Dashboard** is designed to provide users with in-depth statistics and insights into their Fantasy Premier League mini-leagues. Leveraging the official FPL API, the dashboard fetches real-time data, processes it, and presents it in an intuitive and interactive format.

## Project Structure

fpl-dashboard/
├── README.md
├── TODO.md
├── HELPME.md
├── next.config.mjs
├── package.json
├── public/
│   └── Image files etc.
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── [leagueId]/
│   │   │       ├── awards/
│   │   │       │   └── page.tsx
│   │   │       ├── chat/
│   │   │       │   └── page.tsx
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── player/
│   │   │       │   └── page.tsx
│   │   │       └── team/
│   │   │           └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.module.css
│   │   └── page.tsx
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── LeaguePlayerStats.tsx
│   │   ├── LeagueTeamStats.tsx
│   │   ├── PenaltyStreakGame.tsx
│   │   ├── PlayerStatisticsTable.tsx
│   │   ├── TeamStatisticsTable.tsx
|   │   └── ... other future components
│   ├── lib/
│   │   ├── fplApi.ts
│   │   ├── leaguePlayerData.ts
│   │   └── leagueTeamData.ts
│   ├── styles/
│   │   └── global.css
│   └── types/
│       ├── derived/
│       │   ├── GlobalDerivedTypes.ts
│       │   ├── LeagueDerivedTypes.ts
│       │   └── ... other future derived types
│       └── fpl/
│           ├── FplBootstrapStatic.ts
│           ├── FplElementSummary.ts
│           ├── FplEntryEventPicks.ts
│           ├── FplEntryHistory.ts
│           ├── FplEntryTransfers.ts
│           ├── FplEventLive.ts
│           ├── FplFixtures.ts
│           ├── FplLeagueStandings.ts
│           └── ... other future types from fpl api responses 
└── tsconfig.json

## Data Flow and Function Correlations

Understanding how data moves through the application is essential for effective development and debugging.

### 1. Data Fetching

**File:** `src/lib/fplApi.ts`

- **Purpose:** Handles all API interactions with the Fantasy Premier League (FPL) API.
- **Key Functions:**
    - `getBootstrapData()`: Fetches static data such as player information and fixtures.
    - `getLeagueStandings(leagueId)`: Retrieves standings for a specific league.
    - `getLiveDataForGameweek(gameweek)`: Fetches live data for a particular gameweek.
    - `getEntryHistory(teamId)`: Obtains the historical performance data of a team.
    - `getEntryEventPicks(teamId, gameweek)`: Retrieves the team’s picks for a specific gameweek.

### 2. Data Processing

**File:** `src/lib/leagueTeamData.ts`

- **Purpose:** Processes and aggregates data fetched from the FPL API to compute meaningful statistics.
- **Key Functions:**
    - `fetchPicksForAllGWs(teamId, completedGameweeks)`: Fetches picks for all completed gameweeks for a team.
    - `fetchManagerPartialStats(teamId, completedGameweeks, liveDataMap, players, officialTotalPoints)`: Gathers and computes partial statistics for a manager, such as transfers, chip usage, captain points, etc.
    - `computeLeagueTeamStats(leagueStandings, allFplPlayers, fplEvents)`: Integrates league standings with processed data to compile comprehensive statistics for all teams in the league.

### 3. Data Presentation

**File:** `src/components/LeagueTeamStats.tsx`

- **Purpose:** Acts as the main component that orchestrates data fetching, processing, and rendering the statistics table.
- **Workflow:**
    1. **Data Retrieval:**
        - Calls `getLeagueStandings(leagueId)` to obtain league standings.
        - Calls `getBootstrapData()` to fetch static data.
    2. **Data Processing:**
        - Passes the fetched data to `computeLeagueTeamStats()` to process and compile statistics.
    3. **Rendering:**
        - Utilizes the `TeamStatisticsTable` component to display the processed data in a structured table format.

## Key Components and Functions

### a. fplApi.ts

- **Location:** `src/lib/fplApi.ts`
- **Role:** Centralizes all API calls to the FPL API, ensuring data fetching is handled efficiently and errors are managed gracefully.
- **Functionality:**
    - Fetches various data endpoints required for the dashboard.
    - Provides default responses to maintain type integrity, especially when certain data might be unavailable.

### b. leagueTeamData.ts

- **Location:** `src/lib/leagueTeamData.ts`
- **Role:** Processes raw data fetched from the API to compute statistics.
- **Functionality:**
    - Aggregates data across multiple gameweeks.
    - Calculates metrics such as total transfers, transfer points deducted, chip usage, captain points, and positional points (GK, DEF, MID, FWD).
    - Compiles these statistics into a structured format for easy consumption by frontend components.

### c. LeagueTeamStats.tsx

- **Location:** `src/components/LeagueTeamStats.tsx`
- **Role:** Serves as the main page/component that users interact with to view league team statistics.
- **Functionality:**
    - Fetches necessary data upon component mounting.
    - Calls processing functions to compute statistics.
    - Renders the `TeamStatisticsTable` component with the compiled data.

## Third-Party Libraries

- **Next.js:** Facilitates server-side rendering and routing.
- **TanStack Table:** Provides advanced table functionalities for displaying data.
- **Bootstrap:** Offers responsive and styled UI components.
- **React:** Core library for building user interfaces.

## Future Integrations

- **Real-Time Updates:** Implement WebSockets or similar technologies to provide real-time data updates without requiring page refreshes.
- **User Authentication (Log In):** Implement a database for registered users, allowing them to toggle between their leagues, and participate in chat.
- **Mobile Responsiveness:** Enhance mobile user experience with optimized layouts and interactions.

## Troubleshooting

Refer to the [KNOWN ISSUES](TODO.md#known-issues) section in the `TODO.md` for known problems and their current status. For new issues, please open an [issue](https://github.com/kimmanuelkant/fpl-dashboard/issues) on GitHub.

## Additional Resources

- [A Complete Guide to the Fantasy Premier League (FPL) API](https://www.game-change.co.uk/2023/02/10/a-complete-guide-to-the-fantasy-premier-league-fpl-api/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Table Documentation](https://tanstack.com/table/v8/docs/overview)

---

