import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  DynamicModule,
  ExceptionFilter,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ErrorCode, Store } from './store.js';

const MESSAGES: Record<ErrorCode, string> = {
  INVALID_REQUEST: 'Something went wrong with that request, please try again',
  INVALID_EMAIL: "That email doesn't look right",
  EVENT_NOT_FOUND: "We couldn't find that event",
  SEAT_NOT_FOUND: "We couldn't find that seat",
  EMAIL_ALREADY_RESERVED: 'This email already has a seat for this event',
  SEAT_UNAVAILABLE: 'Sorry, that seat has just been taken',
  RESERVATION_NOT_FOUND: "We couldn't find that reservation",
  INTERNAL_ERROR: 'Something went wrong on our side, please try again',
};

const STATUS: Record<ErrorCode, number> = {
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

class ApiError extends Error {
  constructor(readonly code: ErrorCode) {
    super(MESSAGES[code]);
  }
}

@Catch()
class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const { httpAdapter } = this.adapterHost;

    if (exception instanceof NotFoundException) return httpAdapter.reply(res, exception.message, 404);

    let code: ErrorCode = 'INTERNAL_ERROR';
    if (exception instanceof ApiError) code = exception.code;
    else if (exception instanceof BadRequestException) code = 'INVALID_REQUEST';
    else console.error(exception);

    httpAdapter.reply(res, { error: { code, message: MESSAGES[code] } }, STATUS[code]);
  }
}

@Controller('api')
class ApiController {
  constructor(private readonly store: Store) {}

  @Get('events')
  listEvents() {
    return { events: this.store.listEvents() };
  }

  @Get('events/:eventId')
  getEvent(@Param('eventId') eventId: string) {
    const event = this.store.getEvent(eventId);
    if (!event) throw new ApiError('EVENT_NOT_FOUND');
    return event;
  }

  @Post('events/:eventId/reservations')
  reserve(@Param('eventId') eventId: string, @Body() body: unknown, @Res({ passthrough: true }) res: ServerResponse) {
    if (!this.store.hasEvent(eventId)) throw new ApiError('EVENT_NOT_FOUND');

    const isObject = body !== null && typeof body === 'object' && !Array.isArray(body);
    if (!isObject || !('seatId' in body) || typeof body.seatId !== 'string' || Object.keys(body).some((k) => k !== 'seatId' && k !== 'email')) {
      throw new ApiError('INVALID_REQUEST');
    }

    const email = 'email' in body && typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) throw new ApiError('INVALID_EMAIL');

    const result = this.store.reserve({ eventId, seatId: body.seatId, email });
    if ('error' in result) throw new ApiError(result.error);

    res.setHeader('Location', `/api/reservations/${result.reservation.reference}`);
    return result.reservation;
  }

  @Get('reservations/:reference')
  getReservation(@Param('reference') reference: string) {
    const reservation = this.store.getReservation(reference);
    if (!reservation) throw new ApiError('RESERVATION_NOT_FOUND');
    return reservation;
  }
}

@Module({})
class AppModule {
  static register(store: Store): DynamicModule {
    return {
      module: AppModule,
      controllers: [ApiController],
      providers: [
        { provide: Store, useValue: store },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
      ],
    };
  }
}

function cors(req: IncomingMessage, res: ServerResponse, next: () => void) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method !== 'OPTIONS') return next();
  res.statusCode = 204;
  res.end();
}

export async function createApp({ seedPath, dataPath }: { seedPath: string; dataPath: string }) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(new Store(seedPath, dataPath)), {
    bodyParser: false,
    logger: ['error', 'warn'],
  });
  app.use(cors);
  app.useBodyParser('json');
  return app;
}
