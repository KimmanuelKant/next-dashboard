# Fantasy Premier League Dashboard

## Overview

The **FPL-Dashboard** is a web application built using **Next.js** with **App Router**, **Server-Side Rendering (SSR)**, and **TanStack Table**. The application is designed to help users track their Fantasy Premier League mini-leagues, providing rich statistics and insights on team performances compared to their league rivals-

## Features

- **Team Statistics**: Display customizable comprehensive statistics for teams in a given league. The table currently allows you choose which columns to hide and show. 
- **Player Statistics**: isplay customizable comprehensive statistics for players selected in a given league.
- **Awards**: Not Yet Started: Weekly updated awards based on team preformance 
- **Chat**: Not Yet Started: The plan is to have a messaging board for the league. not a 


## Technologies Used

- **Next.js**: A React-based framework for server-side rendering and static site generation.
- **TanStack Table**: A table component library for managing and displaying large datasets.
- **Bootstrap**: Provides a clean, responsive design for the user interface. Should be improved, but i'm lazy for now.
- **Fantasy Premier League API**: Data is fetched from the official FPL Website to ensure accuracy.

## Installation

To run the application locally:

1. Clone the repository:
    ```bash
    git clone https://github.com/kimmanuelkant/fpl-dashboard.git
    ```
2. Navigate to the project directory:
    ```bash
    cd fpl-dashboard
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Start the development server:
    ```bash
    npm run dev
    ```

Visit `http://localhost:3000` in your browser to view the app.

## Usage

1. Enter your Fantasy Premier League **League ID** on the homepage to view the league's dashboard.
2. Use the navigation tabs to toggle between **Team Statistics** and **Player Statistics**. In the future it'll also have **Awards** and **Chat**.
3. Tables are interactive, allowing you to filter data based on your preferences.

## Future Plans

Adding new features, such as:

- **Awards and Badges**: Showcase achievements and awards for top-performing managers last week.
- **Chat**: A place to communicate with others in your mini-league.
- **Caching Implementation**: Introduce a caching layer to optimize API calls and performance.
- **Log In**: Make an account and log in, to get a dropdown menu so you can toggle between all your leagues, and save custom presets.
- **UI/UX**: Improve the user experience. Especially on mobile.