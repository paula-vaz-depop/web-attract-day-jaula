import type { EventSummary } from "@/lib/api";
import { formatWhen } from "@/lib/format";

// ponytail: palettes cycle by list position; add an image field to the API if real artwork is wanted.
const PALETTES = [
  ["#151515", "#e9474b"],
  ["#e9474b", "#151515"],
  ["#d6ff3d", "#151515"],
  ["#2f3cff", "#ededed"],
];

export function Poster({ event, index }: { event: EventSummary; index: number }) {
  const [bg, fg] = PALETTES[index % PALETTES.length];
  return (
    <div
      aria-hidden
      className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden p-5 ${event.soldOut ? "grayscale" : ""}`}
      style={{ background: bg, color: fg }}
    >
      <div className="flex justify-between text-xs font-bold uppercase tracking-[0.2em]">
        <span>{event.city}</span>
        <span>{formatWhen(event.startsAt).split(" · ")[0]}</span>
      </div>
      <p className="display text-[clamp(2.25rem,5vw,3.5rem)] break-words">{event.name}</p>
      {event.soldOut && (
        <span className="display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-current bg-paper px-4 py-2 text-3xl text-ink">
          Sold out
        </span>
      )}
    </div>
  );
}
