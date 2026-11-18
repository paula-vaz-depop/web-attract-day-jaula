import type { Seat } from "@/lib/api";

export function SeatButton({ seat, label, selected, onSelect, className = "" }: {
  seat: Seat; label: string; selected: boolean; onSelect: () => void; className?: string;
}) {
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
      className={`aspect-square rounded-[4px] transition focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-ink ${look} ${className}`}
    />
  );
}
