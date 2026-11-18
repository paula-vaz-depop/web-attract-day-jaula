import { notFound } from "next/navigation";

// Types mirror openapi.yaml in the repo root.
export type EventInfo = { id: string; name: string; venue: string; city: string; startsAt: string; currency: string };
export type EventSummary = EventInfo & { fromPrice: number | null; seatsLeft: number; soldOut: boolean };
export type Seat = { id: string; row: string; number: number; price: number; status: "available" | "reserved" };
export type EventDetail = EventSummary & { seats: Seat[] };
export type Reservation = { reference: string; email: string; event: EventInfo; seat: Omit<Seat, "status"> };
export type ApiError = { code: string; message: string };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${process.env.API_URL}/api${path}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json();
}

export const getEvents = () => get<{ events: EventSummary[] }>("/events").then((r) => r.events);
export const getEvent = (id: string) => get<EventDetail>(`/events/${encodeURIComponent(id)}`);
export const getReservation = (ref: string) => get<Reservation>(`/reservations/${encodeURIComponent(ref)}`);
