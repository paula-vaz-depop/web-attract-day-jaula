import fs from 'node:fs';
import { randomInt } from 'node:crypto';

const CSV_HEADER = 'reference,eventId,seatId,email,createdAt';
const REFERENCE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_EMAIL'
  | 'EVENT_NOT_FOUND'
  | 'SEAT_NOT_FOUND'
  | 'RESERVATION_NOT_FOUND'
  | 'EMAIL_ALREADY_RESERVED'
  | 'SEAT_UNAVAILABLE'
  | 'INTERNAL_ERROR';

interface SeedSeat {
  id: string;
  row: string;
  number: number;
  price: number;
  status: 'available' | 'reserved';
}

interface SeedEvent {
  id: string;
  name: string;
  venue: string;
  city: string;
  startsAt: string;
  currency: string;
  seats: SeedSeat[];
}

interface StoredReservation {
  reference: string;
  eventId: string;
  seatId: string;
  email: string;
  createdAt: string;
}

export class Store {
  private readonly events: Map<string, SeedEvent>;
  private readonly reservedSeats = new Set<string>();
  private readonly emailsByEvent = new Set<string>();
  private readonly reservations = new Map<string, StoredReservation>();

  constructor(seedPath: string, private readonly dataPath: string) {
    const seed: { events: SeedEvent[] } = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    this.events = new Map(seed.events.map((event) => [event.id, event]));

    for (const event of seed.events) {
      for (const seat of event.seats) {
        if (seat.status === 'reserved') this.reservedSeats.add(key(event.id, seat.id));
      }
    }

    ensureCsv(dataPath);
    for (const line of fs.readFileSync(dataPath, 'utf8').split('\n').slice(1)) {
      if (!line.trim()) continue;
      const [reference, eventId, seatId, email, createdAt] = line.split(',');
      this.remember({ reference, eventId, seatId, email, createdAt });
    }
  }

  listEvents() {
    return [...this.events.values()]
      .map((event) => this.summarise(event))
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }

  getEvent(eventId: string) {
    const event = this.events.get(eventId);
    return event && { ...this.summarise(event), seats: this.seatsFor(event) };
  }

  hasEvent(eventId: string) {
    return this.events.has(eventId);
  }

  getReservation(reference: string) {
    const reservation = this.reservations.get(reference);
    return reservation && this.toReservation(reservation);
  }

  reserve({ eventId, seatId, email }: { eventId: string; seatId: string; email: string }) {
    const event = this.events.get(eventId);
    if (!event) return failure('EVENT_NOT_FOUND');
    if (!event.seats.some((seat) => seat.id === seatId)) return failure('SEAT_NOT_FOUND');
    if (this.reservedSeats.has(key(eventId, seatId))) return failure('SEAT_UNAVAILABLE');
    if (this.emailsByEvent.has(key(eventId, email))) return failure('EMAIL_ALREADY_RESERVED');

    const reservation = { reference: this.newReference(), eventId, seatId, email, createdAt: new Date().toISOString() };
    fs.appendFileSync(this.dataPath, [reservation.reference, eventId, seatId, email, reservation.createdAt].join(',') + '\n');
    this.remember(reservation);
    return { reservation: this.toReservation(reservation) };
  }

  private remember(reservation: StoredReservation) {
    this.reservations.set(reservation.reference, reservation);
    this.reservedSeats.add(key(reservation.eventId, reservation.seatId));
    this.emailsByEvent.add(key(reservation.eventId, reservation.email));
  }

  private seatsFor(event: SeedEvent) {
    return event.seats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      price: seat.price,
      status: this.reservedSeats.has(key(event.id, seat.id)) ? 'reserved' : 'available',
    }));
  }

  private summarise(event: SeedEvent) {
    const available = this.seatsFor(event).filter((seat) => seat.status === 'available');
    return {
      ...eventInfo(event),
      fromPrice: available.length ? Math.min(...available.map((seat) => seat.price)) : null,
      seatsLeft: available.length,
      soldOut: available.length === 0,
    };
  }

  private toReservation({ reference, eventId, seatId, email }: StoredReservation) {
    const event = this.events.get(eventId);
    const seat = event?.seats.find((s) => s.id === seatId);
    if (!event || !seat) throw new Error(`Reservation ${reference} points at an unknown event or seat`);
    return {
      reference,
      email,
      event: eventInfo(event),
      seat: { id: seat.id, row: seat.row, number: seat.number, price: seat.price },
    };
  }

  private newReference() {
    let reference;
    do {
      reference = 'TKT-' + Array.from({ length: 5 }, () => REFERENCE_CHARS[randomInt(REFERENCE_CHARS.length)]).join('');
    } while (this.reservations.has(reference));
    return reference;
  }
}

function ensureCsv(dataPath: string) {
  if (!fs.existsSync(dataPath) || fs.readFileSync(dataPath, 'utf8').trim() === '') {
    fs.writeFileSync(dataPath, CSV_HEADER + '\n');
  }
}

function key(eventId: string, value: string) {
  return `${eventId}:${value}`;
}

function eventInfo({ id, name, venue, city, startsAt, currency }: SeedEvent) {
  return { id, name, venue, city, startsAt, currency };
}

function failure(error: ErrorCode) {
  return { error };
}
