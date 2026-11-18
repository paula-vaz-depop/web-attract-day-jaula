# Technical requirements

## Design your own endpoints

There's no API contract and no endpoints provided. Your team designs the API: which endpoints exist, what each one takes and returns, and how errors come back. Everything the app needs, from listing events to reserving a seat, has to come through endpoints you design and build.

Agree it as a team, and write it down somewhere everyone can see, before or while you build.

## The rules

| Requirement | Detail |
|---|---|
| **Next.js** | The web app is built with Next.js, in `app/`. |
| **The API is its own service** | The API lives in `api/` and runs as a separate service on `API_PORT`. It must be built with Node and Express. The web app only talks to it over HTTP. |
| **A CSV file for reservations** | Reservations are stored in a local CSV file at `DATA_PATH`, with a header row, so they survive a restart. The columns are up to you. Events and seats can be loaded from `seed.json`. |
| **Runs locally, no Docker** | Everything runs on your laptop with Node and `npm`. No Docker, no database server. |
| **One command starts it** | `npm start` in the repo root starts both the API and the web app. If the CSV file doesn't exist or is empty, the API creates it with a header row. |

## Environment variables

`npm start` must read these, so don't hard-code ports or paths.

| Variable | What it is |
|---|---|
| `APP_PORT` | Port the web app listens on |
| `API_PORT` | Port the API listens on |
| `API_URL` | Where the web app finds the API, e.g. `http://localhost:4000` |
| `DATA_PATH` | Path to the reservations CSV file. Locally, use `database.csv` in the repo root (an empty one is provided). |
