# Spec: requirements checklist

Our formal list, built from [REQUIREMENTS.md](REQUIREMENTS.md) (Product), [TECHNICAL.md](TECHNICAL.md) and [BRIEF.md](BRIEF.md). The API contract is [openapi.yaml](openapi.yaml).
Each line can be tested. Tick it off when it's done and checked.

## Technical (TR)

- [ ] **TR-1** Web app is Next.js, in `app/`.
- [x] **TR-2** API is Node + Nest.js, in `api/`, running as its own service on `API_PORT`.
- [ ] **TR-3** The web app talks to the API only over HTTP, at `API_URL`. It never reads `seed.json` or the CSV directly.
- [x] **TR-4** Events and seats are loaded from `seed.json`.
- [x] **TR-5** Reservations are stored in a CSV at `DATA_PATH`, with a header row. They survive an API restart.
- [x] **TR-6** If the CSV is missing or empty when the API starts, it is created with a header row.
- [x] **TR-7** A seat's status = its seed status, overlaid with reservations from the CSV.
- [x] **TR-8** `npm start` in the repo root starts both the API and the app.
- [ ] **TR-9** Ports, API URL and data path come only from `APP_PORT`, `API_PORT`, `API_URL` and `DATA_PATH`. Nothing is hard-coded.
- [x] **TR-10** Runs on Node 20+ with npm. No Docker, no database server.

## API (API), per [openapi.yaml](openapi.yaml)

- [x] **API-1** `GET /api/events` returns every event with `fromPrice` (cheapest available seat, `null` when sold out), `seatsLeft` and `soldOut`, sorted by `startsAt`.
- [x] **API-2** `GET /api/events/:eventId` returns the event plus all 500 seats in row/number order. Unknown id → `404 EVENT_NOT_FOUND`.
- [x] **API-3** `POST /api/events/:eventId/reservations` with `{seatId, email}` → `201` with the Reservation and a `Location` header.
- [x] **API-4** Invalid email → `400 INVALID_EMAIL`. Nothing is written.
- [x] **API-5** Unknown event or seat → `404 EVENT_NOT_FOUND` / `SEAT_NOT_FOUND`.
- [x] **API-6** The email already has a seat at this event (trimmed, case-insensitive) → `409 EMAIL_ALREADY_RESERVED`. The same email can still book other events.
- [x] **API-7** Seat already reserved → `409 SEAT_UNAVAILABLE`. When two requests race for one seat, exactly one wins.
- [x] **API-8** `GET /api/reservations/:reference` returns the Reservation. Unknown → `404 RESERVATION_NOT_FOUND`.
- [x] **API-9** Every error uses `{ error: { code, message } }`, with `message` written so it can be shown to a fan as-is.
- [x] **API-10** References are unique and match `TKT-XXXXX`.
- [x] **API-11** Malformed body (not JSON, or `seatId` missing) → `400 INVALID_REQUEST`. Nothing is written.
- [x] **API-12** Any unexpected error → `500 INTERNAL_ERROR` in the standard error shape. Never an HTML or Express default error page.

## Event directory `/` (ED)

- [ ] **ED-1** Lists every event: name, venue, city, date and time, "From {price}", "{n} seats left".
- [ ] **ED-2** Selecting an event opens `/event/:id`.
- [ ] **ED-3** Sold-out events are shown as "Sold out" and can't be opened (no link, button disabled).
- [ ] **ED-4** Prices use the event's currency (£ / €). Times are shown in the venue's local time.

## Seat map `/event/:id` (SM)

- [ ] **SM-1** Shows the event name, venue, city, date and time, and an "All events" link back to `/`.
- [ ] **SM-2** Shows all 500 seats at once: the stage at the front, rows A–T, a 5 | 15 | 5 layout with aisles between the blocks.
- [ ] **SM-3** Each row shows its label and price. A legend shows Available, Reserved, Your seat and "Rows A–C: premium".
- [ ] **SM-4** Available and reserved seats look different. Reserved seats can't be selected.
- [ ] **SM-5** Only one seat can be selected at a time. The bottom bar shows "Seat {id} · {price}".
- [ ] **SM-6** **Reserve** is disabled until a seat is selected. Clicking it opens the pop-up.
- [ ] **SM-7** Unknown event id → a friendly not-found message with a link back. Never a blank page.

## Reserve pop-up (RP)

- [ ] **RP-1** Shows "Reserve seat {id}", the event name, the price and an email field.
- [ ] **RP-2** An invalid email shows "That email doesn't look right" and doesn't submit. Checked on the client, and again by the API.
- [ ] **RP-3** On a `409 EMAIL_ALREADY_RESERVED`, shows "This email already has a seat for this event" and doesn't reserve.
- [ ] **RP-4** On a `409 SEAT_UNAVAILABLE`, shows the message, refreshes the seat map and clears the selection.
- [ ] **RP-5** While the request is in flight, Reserve is disabled so it can't double-submit.
- [ ] **RP-6** On success, goes to `/confirmation/:reference`.
- [ ] **RP-7** **Cancel** or **×** closes the pop-up and keeps the seat selected.

## Confirmation `/confirmation/:id` (CF)

- [ ] **CF-1** Shows "You're going!", the event, venue, date and time, the seat, price, reference and "We've sent the details to {email}".
- [ ] **CF-2** Refreshing the page still shows the reservation, because it's loaded via `GET /api/reservations/:reference`.
- [ ] **CF-3** Unknown reference → a friendly not-found message with a link back.
- [ ] **CF-4** "Back to all events" goes to `/`. No email is actually sent.

## Never a blank screen (NB)

- [ ] **NB-1** Every page shows a loading state while it fetches.
- [ ] **NB-2** If the API is down or returns 5xx, the page shows a friendly error with a retry. No blank page and no stack trace.
- [ ] **NB-3** Network or unexpected errors in the pop-up show a message and keep the fan's email and seat.

## Process (PR)

- [ ] **PR-1** One shared repo. Everyone commits from their own laptop, under their own name.
- [ ] **PR-2** The contract lives in the repo ([openapi.yaml](openapi.yaml)) and is updated whenever the API changes.
- [ ] **PR-3** Requirements will change during the day. New ones get added here with the next ID.
