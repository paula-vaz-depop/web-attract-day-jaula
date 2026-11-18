// Stand-in for the real API (openapi.yaml) so the UI can be built before api/ lands. Delete once it does.
// ponytail: in-memory reservations, no CSV, no race lock — the real API owns all of that.
// Run: node scripts/mock-api.mjs   (PORT defaults to 4000; MOCK_DOWN=1 returns 500s to test error states)
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const { events } = JSON.parse(readFileSync(new URL("../seed.json", import.meta.url)));
const reservations = new Map();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const info = ({ seats, ...e }) => e;
const summary = (e) => {
  const free = e.seats.filter((s) => s.status === "available");
  return { ...info(e), fromPrice: free.length ? Math.min(...free.map((s) => s.price)) : null, seatsLeft: free.length, soldOut: free.length === 0 };
};

const send = (res, status, body) => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(body));
const fail = (res, status, code, message) => send(res, status, { error: { code, message } });

createServer(async (req, res) => {
  await new Promise((r) => setTimeout(r, 400)); // fake latency so loading states show
  if (process.env.MOCK_DOWN) return fail(res, 500, "INTERNAL_ERROR", "Something went wrong");
  const [, api, a, id, b] = req.url.split("?")[0].split("/");
  if (api !== "api") return fail(res, 404, "INVALID_REQUEST", "Not found");
  const event = a === "events" && id ? events.find((e) => e.id === id) : null;

  if (req.method === "GET" && a === "events" && !id) return send(res, 200, { events: events.map(summary) });
  if (req.method === "GET" && a === "events" && !b) return event ? send(res, 200, { ...summary(event), seats: event.seats }) : fail(res, 404, "EVENT_NOT_FOUND", "We can't find that event");
  if (req.method === "GET" && a === "reservations") {
    const r = reservations.get(id);
    return r ? send(res, 200, r) : fail(res, 404, "RESERVATION_NOT_FOUND", "We can't find that booking");
  }
  if (req.method === "POST" && b === "reservations") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let seatId, email;
    try { ({ seatId, email } = JSON.parse(body)); } catch { return fail(res, 400, "INVALID_REQUEST", "That request didn't make sense"); }
    if (!event) return fail(res, 404, "EVENT_NOT_FOUND", "We can't find that event");
    const seat = event.seats.find((s) => s.id === seatId);
    if (!seat) return fail(res, 404, "SEAT_NOT_FOUND", "We can't find that seat");
    email = String(email ?? "").trim();
    if (!EMAIL_RE.test(email)) return fail(res, 400, "INVALID_EMAIL", "That email doesn't look right");
    if ([...reservations.values()].some((r) => r.event.id === event.id && r.email.toLowerCase() === email.toLowerCase()))
      return fail(res, 409, "EMAIL_ALREADY_RESERVED", "This email already has a seat for this event");
    if (seat.status !== "available") return fail(res, 409, "SEAT_UNAVAILABLE", "Someone just grabbed that seat. Pick another one.");
    seat.status = "reserved";
    const reference = "TKT-" + Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, "X");
    const { status, ...seatOut } = seat;
    reservations.set(reference, { reference, email, event: info(event), seat: seatOut });
    return send(res, 201, reservations.get(reference));
  }
  fail(res, 404, "INVALID_REQUEST", "Not found");
}).listen(process.env.PORT ?? 4000, () => console.log(`Mock API on http://localhost:${process.env.PORT ?? 4000}`));
