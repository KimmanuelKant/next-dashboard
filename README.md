# Fantasy Premier League Dashboard

## Overview

The **FPL-Dashboard** is a web application built using modern web development technologies, including **Next.js** with **App Router**, **Server-Side Rendering (SSR)**, and **TanStack Table**. The application is designed to help users track their Fantasy Premier League mini-leagues, providing rich statistics and insights on team performances.

## Features

- **Team Statistics**: Display customizable comprehensive statistics for teams in a given league. The table currently allows you choose which columns to hide and show. 
- **Player Statistics**: Not Yet Started: Display customizable comprehensive statistics for players selected in a given league.
- **Awards**: Not Yet Started: Weekly updated awards based on team preformance 
- **Chat**: Not Yet Started: The plan is to have a messaging board for the league.
- **Dynamic Data Rendering**: Real-time updates using SSR for fetching and displaying data from the Fantasy Premier League API.
- **Modular Table Components**: Highly customizable data tables using TanStack Table, allowing for sorting, filtering, and column customization.

## Technologies Used

- **Next.js**: A React-based framework for server-side rendering and static site generation.
- **TanStack Table**: A powerful table component library for managing and displaying large datasets.
- **Bootstrap**: Provides a clean, responsive design for the user interface.
- **Fantasy Premier League API**: Data is fetched from the official FPL Website to ensure accuracy.

## Installation

To run the application locally, follow these steps:

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
2. Use the navigation tabs to toggle between **Team Statistics**, **Player Statistics**, **Awards** and **Chat**.
3. Tables are interactive, allowing you to filter data based on your preferences.

## Future Plans

Adding new features, such as:

- **Awards and Badges**: Showcase achievements and awards for top-performing managers last week.
- **Chat**: A place to communicate with others in your mini-league.
- **Caching Implementation**: Introduce a caching layer to optimize API calls and performance.