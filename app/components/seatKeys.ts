import type { KeyboardEvent } from "react";

const DIRS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

// Arrow keys move focus to the nearest free seat in that direction, among the seats rendered inside the container.
// Up/down: nearest row first, then the closest seat number in it. Left/right: stays in the row.
export function onSeatKeyDown(e: KeyboardEvent<HTMLElement>) {
  const dir = DIRS[e.key];
  const from = (e.target as HTMLElement).closest<HTMLElement>("[data-seat]");
  if (!dir || !from) return;
  e.preventDefault();
  const pos = (el: HTMLElement) => [el.dataset.row!.charCodeAt(0), Number(el.dataset.num)];
  const [r, n] = pos(from);
  const [dr, dn] = dir;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of e.currentTarget.querySelectorAll<HTMLElement>("[data-seat]:not(:disabled)")) {
    const [r2, n2] = pos(el);
    const along = dr ? (r2 - r) * dr : (n2 - n) * dn;
    if (along <= 0 || (dn && r2 !== r)) continue;
    const score = along * 100 + Math.abs(dr ? n2 - n : 0);
    if (score < bestScore) [best, bestScore] = [el, score];
  }
  best?.focus();
}
