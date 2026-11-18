import Link from "next/link";
import { getEvent } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import { SeatMap } from "@/components/SeatMap";

export default async function EventPage({ params }: PageProps<"/event/[id]">) {
  const { id } = await params;
  const event = await getEvent(id);
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-8">
        <Link href="/" className="text-sm font-bold uppercase tracking-[0.15em] hover:text-accent">
          ← All events
        </Link>
        <h1 className="display mt-4 text-5xl sm:text-7xl">{event.name}</h1>
        <p className="mt-3 text-lg text-muted">
          {event.venue}, {event.city} · {formatWhen(event.startsAt)}
        </p>
      </div>
      <SeatMap event={event} />
    </main>
  );
}
