"use client";
import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { EventDetail, Seat } from "@/lib/api";
import { reserveSeat } from "@/lib/actions";
import { formatPrice } from "@/lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREMIUM_ROWS = ["A", "B", "C"];
// Wing | centre | wing, with an aisle column between each block.
const ROW_GRID = "grid-cols-[2rem_repeat(5,minmax(0,1fr))_1.25rem_repeat(15,minmax(0,1fr))_1.25rem_repeat(5,minmax(0,1fr))_3.5rem]";
const AISLE_AFTER: Record<number, string> = { 6: "col-start-8", 21: "col-start-24" };

export function SeatMap({ event }: { event: EventDetail }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Derived, so a seat that turns reserved after a refresh drops out of the selection on its own.
  const selected = event.seats.find((s) => s.id === selectedId && s.status === "available") ?? null;
  const price = (n: number) => formatPrice(n, event.currency);

  const rows = useMemo(() => {
    const byRow = new Map<string, Seat[]>();
    for (const s of event.seats) byRow.set(s.row, [...(byRow.get(s.row) ?? []), s]);
    return [...byRow];
  }, [event.seats]);

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected || pending) return;
    if (!EMAIL_RE.test(email.trim())) return setError("That email doesn't look right");
    setError(null);
    startTransition(async () => {
      const err = await reserveSeat(event.id, selected.id, email);
      if (!err) return; // redirected to the confirmation page
      if (err.code === "SEAT_UNAVAILABLE") {
        dialogRef.current?.close();
        setSelectedId(null);
        setNotice(err.message);
        router.refresh();
        return;
      }
      setError(err.message);
    });
  }

  return (
    <>
      <section aria-label="Seat map" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-8">
        <div className="overflow-x-auto pb-4">
          <div className="mx-auto min-w-[720px] max-w-[1040px]">
            <div className="mx-auto mb-10 w-3/5 rounded-b-[3rem] bg-ink py-5 text-center text-sm font-bold tracking-[0.6em] text-paper">
              STAGE
            </div>
            <div className="flex flex-col gap-1.5">
              {rows.map(([row, seats]) => {
                const premium = PREMIUM_ROWS.includes(row);
                return (
                  <div key={row} className={`grid ${ROW_GRID} items-center gap-1`}>
                    <span className={`text-sm font-bold ${premium ? "text-accent" : ""}`}>{row}</span>
                    {seats.map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        label={`Seat ${seat.id}, ${price(seat.price)}${premium ? ", premium" : ""}`}
                        selected={seat.id === selected?.id}
                        onSelect={() => {
                          setNotice(null);
                          setSelectedId(seat.id);
                        }}
                      />
                    ))}
                    <span className="text-right text-sm font-bold">{price(seats[0].price)}</span>
                  </div>
                );
              })}
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
              <Legend swatch="border-2 border-ink bg-white">Available</Legend>
              <Legend swatch="bg-taken">Reserved</Legend>
              <Legend swatch="bg-accent">Your seat</Legend>
              <li className="font-bold text-accent">Rows A–C: premium</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 border-t-4 border-ink bg-paper">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div aria-live="polite">
            {notice ? (
              <p role="alert" className="font-bold text-accent">{notice}</p>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Selected seat</p>
                <p className="display text-2xl sm:text-3xl">
                  {selected ? `Seat ${selected.id} · ${price(selected.price)}` : "Pick a seat"}
                </p>
              </>
            )}
          </div>
          <button type="button" className="btn btn-primary px-10 py-4" disabled={!selected} onClick={openDialog}>
            Reserve
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="reserve-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg border-4 border-ink bg-paper p-0 text-ink shadow-[12px_12px_0_var(--color-accent)] backdrop:bg-ink/75"
      >
        {selected && (
          <form noValidate onSubmit={submit} className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="reserve-title" className="display text-4xl">Reserve seat {selected.id}</h2>
                <p className="mt-2 text-muted">{event.name} · {price(selected.price)}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => dialogRef.current?.close()}
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-ink text-xl hover:bg-ink hover:text-paper"
              >
                ×
              </button>
            </div>
            <label htmlFor="email" className="mt-8 block text-sm font-bold uppercase tracking-[0.15em]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="fan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "email-error" : undefined}
              className="mt-2 w-full border-2 border-ink bg-white px-4 py-3 text-lg outline-none focus:border-accent aria-invalid:border-accent"
            />
            {error && (
              <p id="email-error" role="alert" className="mt-3 font-semibold text-accent">{error}</p>
            )}
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Reserving…" : "Reserve"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

function SeatButton({ seat, label, selected, onSelect }: { seat: Seat; label: string; selected: boolean; onSelect: () => void }) {
  const reserved = seat.status === "reserved";
  const look = reserved
    ? "bg-taken cursor-not-allowed"
    : selected
      ? "bg-accent border-2 border-accent scale-110"
      : "bg-white border-2 border-ink hover:bg-accent/40 cursor-pointer";
  return (
    <button
      type="button"
      disabled={reserved}
      aria-pressed={selected}
      aria-label={reserved ? `Seat ${seat.id}, reserved` : label}
      title={reserved ? `${seat.id} · reserved` : label}
      onClick={onSelect}
      className={`aspect-square rounded-[4px] transition focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-ink ${AISLE_AFTER[seat.number] ?? ""} ${look}`}
    />
  );
}

function Legend({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className={`size-5 rounded-[4px] ${swatch}`} />
      {children}
    </li>
  );
}
