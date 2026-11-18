import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';

const seedPath = fileURLToPath(new URL('../../seed.json', import.meta.url));
const HEADER = 'reference,eventId,seatId,email,createdAt\n';

const MIDNIGHT_INFO = {
  id: 'midnight-arcade',
  name: 'The Midnight Arcade',
  venue: 'O2 Forum',
  city: 'London',
  startsAt: '2026-12-05T20:00:00+00:00',
  currency: 'GBP',
};

let dataPath;
let server;
let baseUrl;

async function start() {
  server = createApp(createStore({ seedPath, dataPath })).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}/api`;
}

async function stop() {
  await new Promise((resolve) => server.close(resolve));
}

async function call(method, url, body) {
  const res = await fetch(baseUrl + url, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, headers: res.headers, body: await res.json() };
}

const reserve = (eventId, body) => call('POST', `/events/${eventId}/reservations`, body);

function errorBody(code, message) {
  return { error: { code, message } };
}

beforeEach(async () => {
  dataPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tickets-')), 'database.csv');
  fs.writeFileSync(dataPath, '');
  await start();
});

afterEach(stop);

test('creates the CSV header when the file is empty', () => {
  assert.equal(fs.readFileSync(dataPath, 'utf8'), HEADER);
});

test('creates the CSV when the file is missing', async () => {
  await stop();
  fs.rmSync(dataPath);
  await start();
  assert.equal(fs.readFileSync(dataPath, 'utf8'), HEADER);
});

test('GET /events lists every event in date order with derived fields', async () => {
  const { status, body } = await call('GET', '/events');
  assert.equal(status, 200);
  assert.deepEqual(body, {
    events: [
      { ...MIDNIGHT_INFO, fromPrice: 40, seatsLeft: 350, soldOut: false },
      {
        id: 'velvet-static',
        name: 'Velvet Static',
        venue: 'Paradiso',
        city: 'Amsterdam',
        startsAt: '2026-12-11T19:30:00+01:00',
        currency: 'EUR',
        fromPrice: 35,
        seatsLeft: 500,
        soldOut: false,
      },
      {
        id: 'neon-harbour',
        name: 'Neon Harbour',
        venue: 'Apollo',
        city: 'Manchester',
        startsAt: '2026-12-13T20:00:00+00:00',
        currency: 'GBP',
        fromPrice: null,
        seatsLeft: 0,
        soldOut: true,
      },
    ],
  });
});

test('GET /events/:id returns the event and all 500 seats', async () => {
  const { status, body } = await call('GET', '/events/midnight-arcade');
  assert.equal(status, 200);
  const { seats, ...summary } = body;
  assert.deepEqual(summary, { ...MIDNIGHT_INFO, fromPrice: 40, seatsLeft: 350, soldOut: false });
  assert.equal(seats.length, 500);
  assert.deepEqual(seats[0], { id: 'A1', row: 'A', number: 1, price: 105, status: 'reserved' });
  assert.deepEqual(seats[2], { id: 'A3', row: 'A', number: 3, price: 105, status: 'available' });
});

test('GET /events/:id 404s for an unknown event', async () => {
  const { status, body } = await call('GET', '/events/nope');
  assert.equal(status, 404);
  assert.deepEqual(body, errorBody('EVENT_NOT_FOUND', "We couldn't find that event"));
});

test('POST reserves a seat, then GET by reference returns it', async () => {
  const created = await reserve('midnight-arcade', { seatId: 'H13', email: ' Fan@Example.com ' });
  assert.equal(created.status, 201);
  assert.match(created.body.reference, /^TKT-[A-Z0-9]{5}$/);
  assert.equal(created.headers.get('location'), `/api/reservations/${created.body.reference}`);

  const expected = {
    reference: created.body.reference,
    email: 'fan@example.com',
    event: MIDNIGHT_INFO,
    seat: { id: 'H13', row: 'H', number: 13, price: 75 },
  };
  assert.deepEqual(created.body, expected);

  const fetched = await call('GET', `/reservations/${created.body.reference}`);
  assert.equal(fetched.status, 200);
  assert.deepEqual(fetched.body, expected);

  const event = await call('GET', '/events/midnight-arcade');
  assert.equal(event.body.seatsLeft, 349);
  assert.equal(event.body.seats.find((s) => s.id === 'H13').status, 'reserved');
});

test('reservations survive a restart', async () => {
  const created = await reserve('midnight-arcade', { seatId: 'H13', email: 'fan@example.com' });
  await stop();
  await start();

  const fetched = await call('GET', `/reservations/${created.body.reference}`);
  assert.equal(fetched.status, 200);
  const again = await reserve('midnight-arcade', { seatId: 'H14', email: 'fan@example.com' });
  assert.equal(again.status, 409);
  const taken = await reserve('midnight-arcade', { seatId: 'H13', email: 'other@example.com' });
  assert.equal(taken.status, 409);
});

test('rejects invalid emails without writing anything', async () => {
  for (const email of ['nope', 'a@b', 'a b@c.com', 'a,b@c.com', '"a"@c.com', undefined, 42]) {
    const { status, body } = await reserve('midnight-arcade', { seatId: 'H13', email });
    assert.equal(status, 400, String(email));
    assert.deepEqual(body, errorBody('INVALID_EMAIL', "That email doesn't look right"));
  }
  assert.equal(fs.readFileSync(dataPath, 'utf8'), HEADER);
});

test('one seat per email per event, case-insensitive, but other events are fine', async () => {
  await reserve('midnight-arcade', { seatId: 'H13', email: 'fan@example.com' });

  const dup = await reserve('midnight-arcade', { seatId: 'H14', email: 'FAN@example.com' });
  assert.equal(dup.status, 409);
  assert.deepEqual(dup.body, errorBody('EMAIL_ALREADY_RESERVED', 'This email already has a seat for this event'));

  const other = await reserve('velvet-static', { seatId: 'A1', email: 'fan@example.com' });
  assert.equal(other.status, 201);
});

test('rejects a seat that is already reserved in the seed', async () => {
  const { status, body } = await reserve('midnight-arcade', { seatId: 'A1', email: 'fan@example.com' });
  assert.equal(status, 409);
  assert.deepEqual(body, errorBody('SEAT_UNAVAILABLE', 'Sorry, that seat has just been taken'));
});

test('exactly one of two racing requests gets the seat', async () => {
  const results = await Promise.all([
    reserve('midnight-arcade', { seatId: 'H13', email: 'one@example.com' }),
    reserve('midnight-arcade', { seatId: 'H13', email: 'two@example.com' }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(fs.readFileSync(dataPath, 'utf8').split('\n').filter(Boolean).length, 2);
});

test('404s for unknown event, seat and reservation', async () => {
  const event = await reserve('nope', { seatId: 'H13', email: 'fan@example.com' });
  assert.equal(event.status, 404);
  assert.deepEqual(event.body, errorBody('EVENT_NOT_FOUND', "We couldn't find that event"));

  const seat = await reserve('midnight-arcade', { seatId: 'Z99', email: 'fan@example.com' });
  assert.equal(seat.status, 404);
  assert.deepEqual(seat.body, errorBody('SEAT_NOT_FOUND', "We couldn't find that seat"));

  const reservation = await call('GET', '/reservations/TKT-ZZZZZ');
  assert.equal(reservation.status, 404);
  assert.deepEqual(reservation.body, errorBody('RESERVATION_NOT_FOUND', "We couldn't find that reservation"));
});

test('rejects malformed bodies with INVALID_REQUEST', async () => {
  const invalid = errorBody('INVALID_REQUEST', 'Something went wrong with that request, please try again');
  for (const body of ['{not json', '[]', { email: 'fan@example.com' }, { seatId: 'H13', email: 'fan@example.com', extra: 1 }]) {
    const res = await reserve('midnight-arcade', body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.deepEqual(res.body, invalid);
  }
});
