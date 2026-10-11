import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BookReportNotFoundError, PublishWithoutContentError } from '../errors/book-report.errors';
import { BookReportErrorFilter } from './book-report-error.filter';

describe('BookReportErrorFilter', () => {
  const filter = new BookReportErrorFilter();

  // res.status(...).json(...) 체이닝을 흉내 내는 가짜 Express 응답
  function mockHost() {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => res }),
    } as unknown as ArgumentsHost;
    return { host, res };
  }

  it('BookReportNotFoundError 는 404 로 응답한다.', () => {
    const { host, res } = mockHost();

    filter.catch(new BookReportNotFoundError('report-id'), host);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: '독후감을 찾을 수 없습니다.',
      error: 'BookReportNotFoundError',
    });
  });

  it('PublishWithoutContentError 는 400 으로 응답한다.', () => {
    const { host, res } = mockHost();

    filter.catch(new PublishWithoutContentError(), host);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: '본문 없이 발행할 수 없습니다.',
      error: 'PublishWithoutContentError',
    });
  });
});
