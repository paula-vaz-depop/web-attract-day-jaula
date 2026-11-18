import Link from "next/link";
import type { EventSummary } from "@/lib/api";
import { formatPrice, formatWhen } from "@/lib/format";
import { Poster } from "./Poster";

export function EventCard({ event, index }: { event: EventSummary; index: number }) {
  const { soldOut } = event;
  return (
    <article
      className={`group relative flex h-full flex-col border-4 border-ink bg-white transition-transform ${
        soldOut ? "opacity-70" : "hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-ink)]"
      }`}
    >
      <Poster event={event} index={index} />
      <div className="flex flex-1 flex-col gap-0.5 border-t-4 border-ink p-4 sm:gap-1 sm:p-5">
        <h2 className="text-xl font-bold leading-tight sm:text-2xl">
          {soldOut ? (
            event.name
          ) : (
            // Stretched link: the whole card is clickable, but there's one link for screen readers.
            <Link href={`/event/${encodeURIComponent(event.id)}`} className="after:absolute after:inset-0 focus-visible:outline-none group-has-[:focus-visible]:underline">
              {event.name}
            </Link>
          )}
        </h2>
        <p className="text-muted">
          {event.venue}, {event.city}
          <span className="sm:block"><span className="sm:hidden"> · </span>{formatWhen(event.startsAt)}</span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-3 sm:pt-5">
          {soldOut ? (
            <>
              <p className="display text-2xl">Sold out</p>
              <span className="btn border-2 border-taken text-muted" aria-hidden>Can&apos;t be opened</span>
            </>
          ) : (
            <>
              <div>
                <p className="text-xl font-bold">From {formatPrice(event.fromPrice ?? 0, event.currency)}</p>
                <p className="text-sm text-muted">{event.seatsLeft} seats left</p>
              </div>
              <span className="btn btn-primary group-hover:bg-accent" aria-hidden>View</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
