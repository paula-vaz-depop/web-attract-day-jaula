"use server";
import { redirect } from "next/navigation";
import type { ApiError } from "./api";

export async function reserveSeat(eventId: string, seatId: string, email: string): Promise<ApiError> {
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/events/${encodeURIComponent(eventId)}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatId, email: email.trim() }),
    });
  } catch {
    return { code: "NETWORK", message: "We can't reach the box office right now. Your seat isn't booked yet, so try again." };
  }
  const body = await res.json().catch(() => null);
  if (res.ok && body?.reference) redirect(`/confirmation/${encodeURIComponent(body.reference)}`);
  return body?.error ?? { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Try again." };
}
