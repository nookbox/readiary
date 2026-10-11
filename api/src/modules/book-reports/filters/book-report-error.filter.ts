import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { BookReportNotFoundError, PublishWithoutContentError } from '../errors/book-report.errors';

type BookReportError = BookReportNotFoundError | PublishWithoutContentError;

@Catch(BookReportNotFoundError, PublishWithoutContentError)
export class BookReportErrorFilter implements ExceptionFilter<BookReportError> {
  catch(error: BookReportError, host: ArgumentsHost) {
    const status =
      error instanceof BookReportNotFoundError ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;

    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      message: error.message,
      error: error.name,
    });
  }
}
