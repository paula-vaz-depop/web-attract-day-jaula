import { getEvents } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { Chevrons } from "@/components/Chevrons";

export default async function Home() {
  const events = await getEvents();
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="display mb-6 flex items-center gap-4 text-5xl sm:text-7xl">
        <Chevrons className="h-12 w-9 shrink-0 text-accent sm:h-16 sm:w-12" />
        Upcoming events
      </h1>
      {events.length === 0 ? (
        <p className="text-lg">No events on sale right now. Check back soon.</p>
      ) : (
        <ul className="grid gap-5 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <li key={event.id}>
              <EventCard event={event} index={i} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
