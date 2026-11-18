import express from 'express';

const MESSAGES = {
  INVALID_REQUEST: 'Something went wrong with that request, please try again',
  INVALID_EMAIL: "That email doesn't look right",
  EVENT_NOT_FOUND: "We couldn't find that event",
  SEAT_NOT_FOUND: "We couldn't find that seat",
  EMAIL_ALREADY_RESERVED: 'This email already has a seat for this event',
  SEAT_UNAVAILABLE: 'Sorry, that seat has just been taken',
  RESERVATION_NOT_FOUND: "We couldn't find that reservation",
  INTERNAL_ERROR: 'Something went wrong on our side, please try again',
};

const STATUS = {
  INVALID_REQUEST: 400,
  INVALID_EMAIL: 400,
  EVENT_NOT_FOUND: 404,
  SEAT_NOT_FOUND: 404,
  RESERVATION_NOT_FOUND: 404,
  EMAIL_ALREADY_RESERVED: 409,
  SEAT_UNAVAILABLE: 409,
  INTERNAL_ERROR: 500,
};

const EMAIL_PATTERN = /^[^\s@,"]+@[^\s@,".]+(\.[^\s@,".]+)+$/;

function sendError(res, code) {
  res.status(STATUS[code]).json({ error: { code, message: MESSAGES[code] } });
}

export function createApp(store) {
  const app = express();

  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json());

  app.get('/api/events', (req, res) => {
    res.json({ events: store.listEvents() });
  });

  app.get('/api/events/:eventId', (req, res) => {
    const event = store.getEvent(req.params.eventId);
    if (!event) return sendError(res, 'EVENT_NOT_FOUND');
    res.json(event);
  });

  app.post('/api/events/:eventId/reservations', (req, res) => {
    const { eventId } = req.params;
    if (!store.hasEvent(eventId)) return sendError(res, 'EVENT_NOT_FOUND');

    const body = req.body;
    const isObject = body !== null && typeof body === 'object' && !Array.isArray(body);
    if (!isObject || typeof body.seatId !== 'string' || Object.keys(body).some((k) => k !== 'seatId' && k !== 'email')) {
      return sendError(res, 'INVALID_REQUEST');
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) return sendError(res, 'INVALID_EMAIL');

    const result = store.reserve({ eventId, seatId: body.seatId, email });
    if (result.error) return sendError(res, result.error);

    res.status(201).location(`/api/reservations/${result.reservation.reference}`).json(result.reservation);
  });

  app.get('/api/reservations/:reference', (req, res) => {
    const reservation = store.getReservation(req.params.reference);
    if (!reservation) return sendError(res, 'RESERVATION_NOT_FOUND');
    res.json(reservation);
  });

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return sendError(res, 'INVALID_REQUEST');
    console.error(err);
    sendError(res, 'INTERNAL_ERROR');
  });

  return app;
}
