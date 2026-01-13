import { HttpException, HttpStatus } from '@nestjs/common';

export class SessionExpiredException extends HttpException {
  constructor(message = 'Session has expired') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class SessionNotFoundException extends HttpException {
  constructor(message = 'Session not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class TooManySessionsException extends HttpException {
  constructor(message = 'Maximum concurrent sessions limit exceeded') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class InvalidSessionException extends HttpException {
  constructor(message = 'Invalid session') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
