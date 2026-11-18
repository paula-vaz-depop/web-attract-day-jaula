// Run: node --test lib/format.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatWhen, formatPrice } from "./format.ts";

test("date stays in the venue offset", () => {
  assert.equal(formatWhen("2026-12-11T19:30:00+01:00"), "Fri 11 Dec · 19:30");
  assert.equal(formatWhen("2026-12-05T23:30:00-08:00"), "Sat 5 Dec · 23:30");
});

test("price uses the event currency, whole units", () => {
  assert.equal(formatPrice(40, "GBP"), "£40");
  assert.equal(formatPrice(35, "EUR"), "€35");
});
