import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

export class ContactNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Contact with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateContactException extends HttpException {
  constructor(email: string) {
    super(`Contact with email ${email} already exists`, HttpStatus.CONFLICT);
  }
}

export class InvalidContactDataException extends BadRequestException {
  constructor(errors: string[]) {
    super({
      message: 'Invalid contact data',
      errors: errors,
    });
  }
}

@Catch(HttpException)
export class ContactsExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const error = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: typeof error === 'string' ? { message: error } : error,
    });
  }
}
