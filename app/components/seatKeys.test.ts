// Run: node --test components/seatKeys.test.ts   (tiny DOM stand-in, no jsdom needed)
import { test } from "node:test";
import assert from "node:assert/strict";
import { onSeatKeyDown } from "./seatKeys.ts";

const seat = (row: string, num: number) => {
  const el = { dataset: { row, num: String(num) }, focused: false, focus() { el.focused = true; }, closest: () => el };
  return el;
};
const press = (key: string, from: ReturnType<typeof seat>, free: ReturnType<typeof seat>[]) => {
  onSeatKeyDown({ key, target: from, preventDefault() {}, currentTarget: { querySelectorAll: () => free } } as never);
  return free.find((s) => s.focused);
};

test("right skips to the next free seat in the row", () => {
  const a = seat("H", 5), b = seat("H", 9), c = seat("I", 6);
  assert.equal(press("ArrowRight", a, [a, b, c]), b);
});
test("down goes to the nearest row, then the closest number", () => {
  const a = seat("H", 13), far = seat("K", 13), near = seat("J", 2), nearer = seat("J", 15);
  assert.equal(press("ArrowDown", a, [a, far, near, nearer]), nearer);
});
test("no seat that way: focus stays put", () => {
  const a = seat("A", 1);
  assert.equal(press("ArrowUp", a, [a]), undefined);
});
