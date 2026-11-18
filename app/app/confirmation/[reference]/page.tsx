import Link from "next/link";
import { getReservation } from "@/lib/api";
import { formatPrice, formatWhen } from "@/lib/format";

export default async function ConfirmationPage({ params }: PageProps<"/confirmation/[reference]">) {
  const { reference } = await params;
  const { event, seat, email, reference: ref } = await getReservation(reference);
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-20">
      <article className="border-4 border-ink bg-white shadow-[12px_12px_0_var(--color-accent)]">
        <div className="flex items-center gap-4 bg-ink p-6 text-paper sm:p-8">
          <svg aria-hidden viewBox="0 0 24 24" className="size-12 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" />
            <path d="M7 12.5l3.5 3.5L17 9" />
          </svg>
          <h1 className="display text-[clamp(1.75rem,9vw,3.75rem)]">You&apos;re going!</h1>
        </div>
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <p className="mt-1 text-muted">
            {event.venue}, {event.city} · {formatWhen(event.startsAt)}
          </p>
          <p className="display mt-4 text-3xl">
            Seat {seat.id} · {formatPrice(seat.price, event.currency)}
          </p>
        </div>
        {/* Ticket-stub tear line */}
        <div aria-hidden className="border-t-4 border-dashed border-ink" />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Reference</p>
          <p className="display mt-1 text-[clamp(1.75rem,9vw,2.25rem)] tracking-wider">{ref}</p>
          <p className="mt-4">We&apos;ve sent the details to <strong>{email}</strong></p>
          <Link href="/" className="btn btn-ghost mt-8">Back to all events</Link>
        </div>
      </article>
    </main>
  );
}
