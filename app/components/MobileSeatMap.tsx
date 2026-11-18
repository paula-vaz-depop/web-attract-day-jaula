"use client";
import { useRef, useState, type TouchList } from "react";
import type { Seat } from "@/lib/api";
import { SeatButton } from "./SeatButton";
import { onSeatKeyDown } from "./seatKeys";

// Five 5-wide columns x front/back = 10 sections of 50 seats. col starts skip the aisle columns in the overview grid.
const BLOCKS = [
  { key: "L", name: "Left wing", from: 1, to: 5, originX: "10%", col: "col-start-1" },
  { key: "CL", name: "Centre left", from: 6, to: 10, originX: "30%", col: "col-start-3" },
  { key: "C", name: "Centre", from: 11, to: 15, originX: "50%", col: "" },
  { key: "CR", name: "Centre right", from: 16, to: 20, originX: "70%", col: "" },
  { key: "R", name: "Right wing", from: 21, to: 25, originX: "90%", col: "col-start-7" },
];
const BANDS = [
  { key: "F", name: "front", back: false, originY: "25%" },
  { key: "B", name: "back", back: true, originY: "75%" },
];
const GROUPS = BANDS.flatMap((band) => BLOCKS.map((block) => ({ key: block.key + band.key, block, band })));
type Group = (typeof GROUPS)[number];

const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

export function MobileSeatMap({ rows, selectedId, onSelect, price, label }: {
  rows: [string, Seat[]][];
  selectedId: string | null;
  onSelect: (id: string) => void;
  price: (n: number) => string;
  label: (seat: Seat) => string;
}) {
  const [zoom, setZoom] = useState<Group | null>(null);
  const pinchStart = useRef<number | null>(null);

  const seatsOf = (g: Group) =>
    rows
      .filter(([row]) => (row > "J") === g.band.back)
      .map(([row, seats]) => [row, seats.filter((s) => s.number >= g.block.from && s.number <= g.block.to)] as const);

  if (!zoom) {
    return (
      <div>
        <div className="mx-auto mb-4 w-3/5 rounded-b-2xl bg-ink py-2 text-center text-[10px] font-bold tracking-[0.5em] text-paper">STAGE</div>
        <div className="grid grid-cols-[1fr_0.25rem_1fr_1fr_1fr_0.25rem_1fr] gap-1.5">
          {GROUPS.map((g) => {
            const groupRows = seatsOf(g);
            const all = groupRows.flatMap(([, s]) => s);
            const left = all.filter((s) => s.status === "available").length;
            const prices = all.map((s) => s.price);
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setZoom(g)}
                aria-label={`${g.block.name} ${g.band.name}: ${left} seats left, ${price(Math.min(...prices))} to ${price(Math.max(...prices))}. Zoom in`}
                className={`flex cursor-pointer flex-col gap-1 border-2 border-ink bg-paper p-1 text-left active:bg-accent/20 ${g.block.col}`}
              >
                <div aria-hidden className="grid w-full gap-[2px]" style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))" }}>
                  {all.map((s) => (
                    <span
                      key={s.id}
                      className={`aspect-square rounded-[1px] ${
                        s.id === selectedId ? "bg-accent" : s.status === "reserved" ? "bg-taken" : "bg-white ring-1 ring-inset ring-ink/60"
                      }`}
                    />
                  ))}
                </div>
                <span aria-hidden className="text-[10px] leading-tight">
                  <span className="block font-bold">{g.block.name}</span>
                  <span className="block capitalize">{g.band.name}</span>
                  {left} left
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm font-semibold text-muted">Tap a section to pick your seat</p>
      </div>
    );
  }

  const groupRows = seatsOf(zoom);
  const free = groupRows.flatMap(([, s]) => s).filter((s) => s.status === "available");
  const tabStopId = free.find((s) => s.id === selectedId)?.id ?? free[0]?.id;
  return (
    <div
      className="animate-zoom-in"
      style={{ transformOrigin: `${zoom.block.originX} ${zoom.band.originY}`, touchAction: "pan-x pan-y" }}
      onTouchStart={(e) => (pinchStart.current = e.touches.length === 2 ? dist(e.touches) : null)}
      onTouchMove={(e) => {
        if (pinchStart.current && e.touches.length === 2 && dist(e.touches) < pinchStart.current * 0.7) {
          pinchStart.current = null;
          setZoom(null);
        }
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setZoom(null)} className="btn btn-ghost px-4 py-2 text-xs">
          ← Full map
        </button>
        <p className="text-right text-sm">
          <span className="block font-bold">{zoom.block.name} · {zoom.band.name}</span>
          <span className="text-muted">Rows {groupRows[0][0]}–{groupRows.at(-1)![0]}</span>
        </p>
      </div>
      <div className="pb-2">
        <div onKeyDown={onSeatKeyDown} className="mx-auto grid w-max items-center gap-1.5" style={{ gridTemplateColumns: "3.25rem repeat(5, 2.5rem)" }}>
          {groupRows.map(([row, seats]) => (
            <div key={row} className="contents">
              <span className={`sticky left-0 z-10 bg-paper pr-1 text-xs font-bold ${row <= "C" ? "text-accent" : ""}`}>
                {row} <span className="font-normal text-muted">{price(seats[0].price)}</span>
              </span>
              {seats.map((seat) => (
                <SeatButton key={seat.id} seat={seat} label={label(seat)} selected={seat.id === selectedId} onSelect={() => onSelect(seat.id)} tabStop={seat.id === tabStopId} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Pinch to zoom out</p>
    </div>
  );
}
