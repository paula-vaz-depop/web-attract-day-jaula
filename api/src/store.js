import fs from 'node:fs';
import { randomInt } from 'node:crypto';

const CSV_HEADER = 'reference,eventId,seatId,email,createdAt';
const REFERENCE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function createStore({ seedPath, dataPath }) {
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const events = new Map(seed.events.map((event) => [event.id, event]));
  const reservedSeats = new Set();
  const emailsByEvent = new Set();
  const reservations = new Map();

  for (const event of seed.events) {
    for (const seat of event.seats) {
      if (seat.status === 'reserved') reservedSeats.add(key(event.id, seat.id));
    }
  }

  ensureCsv(dataPath);
  for (const line of fs.readFileSync(dataPath, 'utf8').split('\n').slice(1)) {
    if (!line.trim()) continue;
    const [reference, eventId, seatId, email, createdAt] = line.split(',');
    remember({ reference, eventId, seatId, email, createdAt });
  }

  function remember(reservation) {
    reservations.set(reservation.reference, reservation);
    reservedSeats.add(key(reservation.eventId, reservation.seatId));
    emailsByEvent.add(key(reservation.eventId, reservation.email));
  }

  function seatsFor(event) {
    return event.seats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      price: seat.price,
      status: reservedSeats.has(key(event.id, seat.id)) ? 'reserved' : 'available',
    }));
  }

  function summarise(event) {
    const available = seatsFor(event).filter((seat) => seat.status === 'available');
    return {
      ...eventInfo(event),
      fromPrice: available.length ? Math.min(...available.map((seat) => seat.price)) : null,
      seatsLeft: available.length,
      soldOut: available.length === 0,
    };
  }

  function toReservation({ reference, eventId, seatId, email }) {
    const event = events.get(eventId);
    const seat = event.seats.find((s) => s.id === seatId);
    return {
      reference,
      email,
      event: eventInfo(event),
      seat: { id: seat.id, row: seat.row, number: seat.number, price: seat.price },
    };
  }

  function newReference() {
    let reference;
    do {
      reference = 'TKT-' + Array.from({ length: 5 }, () => REFERENCE_CHARS[randomInt(REFERENCE_CHARS.length)]).join('');
    } while (reservations.has(reference));
    return reference;
  }

  return {
    listEvents() {
      return [...events.values()]
        .map(summarise)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    },

    getEvent(eventId) {
      const event = events.get(eventId);
      return event && { ...summarise(event), seats: seatsFor(event) };
    },

    hasEvent(eventId) {
      return events.has(eventId);
    },

    getReservation(reference) {
      const reservation = reservations.get(reference);
      return reservation && toReservation(reservation);
    },

    reserve({ eventId, seatId, email }) {
      const event = events.get(eventId);
      if (!event) return { error: 'EVENT_NOT_FOUND' };
      if (!event.seats.some((seat) => seat.id === seatId)) return { error: 'SEAT_NOT_FOUND' };
      if (reservedSeats.has(key(eventId, seatId))) return { error: 'SEAT_UNAVAILABLE' };
      if (emailsByEvent.has(key(eventId, email))) return { error: 'EMAIL_ALREADY_RESERVED' };

      const reservation = { reference: newReference(), eventId, seatId, email, createdAt: new Date().toISOString() };
      fs.appendFileSync(dataPath, [reservation.reference, eventId, seatId, email, reservation.createdAt].join(',') + '\n');
      remember(reservation);
      return { reservation: toReservation(reservation) };
    },
  };
}

function ensureCsv(dataPath) {
  if (!fs.existsSync(dataPath) || fs.readFileSync(dataPath, 'utf8').trim() === '') {
    fs.writeFileSync(dataPath, CSV_HEADER + '\n');
  }
}

function key(eventId, value) {
  return `${eventId}:${value}`;
}

function eventInfo({ id, name, venue, city, startsAt, currency }) {
  return { id, name, venue, city, startsAt, currency };
}
