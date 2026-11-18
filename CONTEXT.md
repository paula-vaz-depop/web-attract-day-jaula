# Team context

Read this before you start, and hand it to your Claude session as its first message. It covers what's been decided so far and what's still open.

## The job

Build a mini Ticketmaster in a day. Fans pick an event, pick a seat, enter an email and reserve the seat. There are no payments.

- Product brief: [REQUIREMENTS.md](REQUIREMENTS.md) + [wireframes/](wireframes/)
- Technical rules: [TECHNICAL.md](TECHNICAL.md)
- Rules of the day: [BRIEF.md](BRIEF.md)
- **Our checklist:** [SPEC.md](SPEC.md). It has numbered, testable requirements. Reference the IDs (e.g. `SM-5`) in commits and PRs.
- **Our API contract:** [openapi.yaml](openapi.yaml). It's approved, so don't change it without telling the team.

Only build what's in the wireframes and requirements. Product *will* change requirements during the day, so keep things simple and easy to change.

## Hard rules (from TECHNICAL.md)

- `api/`: Node + Express, its own service on `API_PORT`.
- `app/`: Next.js. It talks to the API **only over HTTP**, via `API_URL`. It never reads `seed.json` or the CSV.
- Reservations live in a CSV at `DATA_PATH` (locally `database.csv`, which is committed empty). The file has a header row and must survive a restart. If it's missing or empty, the API creates it.
- Events and seats come from `seed.json`.
- `npm start` in the root starts both services. Ports and paths come from `APP_PORT`, `API_PORT`, `API_URL` and `DATA_PATH`, with nothing hard-coded.
- Node 20+, npm, no Docker, no database server.
- **"Never leave a fan staring at a blank screen."** Every page needs loading, error (API down / 5xx) and not-found states.
- One shared repo. Everyone commits from their own laptop, under their own name.

## The Next.js app (`app/`)

- Next **16.4.6**, React 19.3, Tailwind 4, TypeScript, ESLint. Routes live in `app/app/` (e.g. `app/app/event/[id]/page.tsx`).
- **This is newer than most training data.** Before writing code, read the guides in `app/node_modules/next/dist/docs/` (run `npm install` in `app/` first). See [app/AGENTS.md](app/AGENTS.md).
- `next.config.ts` turns on `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. With `cacheComponents`, data-fetching components need a `<Suspense>` boundary. Use that for the loading states (NB-1).
- `app/` has its own `package.json`. The root `package.json` only wires `npm start`.

## Seed data facts

- 3 events: `midnight-arcade` (London, GBP, 350 available, from £40), `velvet-static` (Amsterdam, EUR, 500 available, from €35) and `neon-harbour` (Manchester, GBP, 0 available, so sold out).
- Each event has 500 seats: rows A–T × numbers 1–25. Seat = `{ id: "H13", row: "H", number: 13, price: 75, status: "available" | "reserved" }`.
- Price tiers by row: A–C premium, D–J, K–P, Q–T. Prices are whole units of the event's `currency`.
- `startsAt` is ISO with the venue's offset, e.g. `2026-12-11T19:30:00+01:00`. Show it in that offset ("Fri 11 Dec · 19:30"), not in the viewer's local time.

## API contract summary (full detail in openapi.yaml)

Base path `/api`. JSON everywhere.

| Endpoint | Success | Errors |
|---|---|---|
| `GET /api/events` | `200 { events: EventSummary[] }`, sorted by `startsAt` | 500 |
| `GET /api/events/:eventId` | `200 EventDetail` (summary + `seats[]` in row/number order) | 404 `EVENT_NOT_FOUND`, 500 |
| `POST /api/events/:eventId/reservations` with body `{ seatId, email }` | `201 Reservation` + `Location` header | 400 `INVALID_REQUEST` / `INVALID_EMAIL`, 404 `EVENT_NOT_FOUND` / `SEAT_NOT_FOUND`, 409 `EMAIL_ALREADY_RESERVED` / `SEAT_UNAVAILABLE`, 500 |
| `GET /api/reservations/:reference` | `200 Reservation` | 404 `RESERVATION_NOT_FOUND`, 500 |

- `EventSummary` = `{ id, name, venue, city, startsAt, currency, fromPrice, seatsLeft, soldOut }`
  - `fromPrice` = the cheapest **available** seat, or `null` when sold out.
  - `soldOut` = `seatsLeft === 0`.
- `Reservation` = `{ reference: "TKT-7F3K2", email, event: { id, name, venue, city, startsAt, currency }, seat: { id, row, number, price } }`
- **Error shape, always:** `{ "error": { "code": "...", "message": "..." } }`. The UI switches on `code`. `message` is written so it can be shown to fans as-is.
  - `INVALID_EMAIL`: "That email doesn't look right"
  - `EMAIL_ALREADY_RESERVED`: "This email already has a seat for this event"

## Decisions already made

1. **Sold out** is a flag only. The API still returns sold-out events normally, and the UI disables "View".
2. The **confirmation page** loads its data from `GET /api/reservations/:reference`, so it still works after a refresh. The route is `/confirmation/:reference`.
3. **Email uniqueness** is per event, compared trimmed and case-insensitive. The same email can book other events.
4. **Seat status** = its status in the seed, overlaid with the CSV reservations. Seats that are reserved in the seed stay reserved.
5. **Races:** if two people go for the same seat, exactly one wins and the other gets `409 SEAT_UNAVAILABLE`. The UI then shows the message, refetches the seat map and clears the selection. In Express, do the check and the CSV append with **no `await` in between**, or put them behind a simple in-process lock.
6. **Formatting** of money and dates happens on the client. The API sends raw numbers plus `currency`.
7. **The UI draws the layout:** the 5 | 15 | 5 aisle split, the row price labels, the "Rows A–C: premium" legend and the "Your seat" highlight all come from `row`, `number` and `price`. "Your seat" is selection state in the client, not an API status.
8. Email is checked on the client **and** in the API.
9. **Out of scope:** auth, seat holds/timers, multiple seats, cancelling, actually sending emails.

## The API (`api/`), built

- Express 5, plain JS (ESM), no build step. Run it with `cd api && npm install && API_PORT=4000 DATA_PATH=../database.csv npm start`. Run the tests with `npm test`; they use `node:test` and cover every endpoint and error code.
- Files: `src/store.js` (loads the seed, holds state in memory, appends to the CSV), `src/app.js` (routes and errors), `src/server.js` (reads the env vars).
- The CSV columns are `reference,eventId,seatId,email,createdAt`. Emails are stored trimmed and lowercased.
- CORS is open (`*`), so the browser can call the API directly from the pop-up.
- The data lives in one process. Don't run two API instances against the same CSV.

## Still open (decide as a team)

- **How `npm start` runs both services.** E.g. `concurrently` in the root, or npm workspaces, plus default env values for local runs.
- **The work split.** Suggested lanes, all working against openapi.yaml:
  - **API:** Express app, seed loading, CSV store, the 4 endpoints, error middleware (API-*, TR-4…7)
  - **Events page + shared bits:** API client and error/loading components (ED-*, NB-*)
  - **Seat map + pop-up** (SM-*, RP-*)
  - **Confirmation page + root wiring:** `npm start`, env vars (CF-*, TR-8/9)

  Front-end lanes can start right away with a mock: `npx @stoplight/prism-cli mock openapi.yaml`.
- **Git.** Shared repo: https://github.com/paula-vaz-depop/web-attract-day-jaula. Commit format: `WEB-XXX | short message` (ticket number TBC). Branches: `task/WEB-XXX-short-title`.
- **Known risk.** `GET /reservations/:reference` returns the email to anyone who has the reference. That's acceptable for today.
