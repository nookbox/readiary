import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateBookReportDto } from '../dto/create-book-report.dto';
import type { UpdateBookReportDto } from '../dto/update-book-report.dto';
// 수정: HTTP 예외(NotFoundException/BadRequestException) 대신 도메인 에러를 기대한다
import { BookReportNotFoundError, PublishWithoutContentError } from '../errors/book-report.errors';
import { BookReportsRepository } from '../repositories/book-reports.repository'; // 수정: 클래스 토큰으로 주입하려고 추가
import { BookReportsService } from './book-reports.service';

describe('BookReportsService', () => {
  let service: BookReportsService;

  const bookReportsRepository = { create: vi.fn(), update: vi.fn(), findById: vi.fn() };

  const userId = '11111111-1111-4111-8111-111111111111';
  const bookId = '22222222-2222-4222-8222-222222222222';
  const reportId = '33333333-3333-4333-8333-333333333333';

  beforeEach(async () => {
    vi.resetAllMocks(); // 수정: 호출 기록뿐 아니라 mock 반환값도 초기화해서 테스트끼리 영향이 없게 한다

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookReportsService,

        { provide: BookReportsRepository, useValue: bookReportsRepository },
      ],
    }).compile();

    service = module.get<BookReportsService>(BookReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBookReport', () => {
    const dto: CreateBookReportDto = {
      bookId,
      status: 'finished',
      rating: 5,
      content: '좋은 책이었습니다.',
      startedAt: new Date('2026-09-01T00:00:00.000Z'),
      finishedAt: new Date('2026-09-20T00:00:00.000Z'),
      publish: true,
    };

    it('publish 가 true 면 publishedAt 을 현재 시각으로 채워 저장한다.', async () => {
      const { publish: _publish, ...fields } = dto;
      const created = { id: reportId, userId, round: 1, ...fields, publishedAt: new Date() };
      bookReportsRepository.create.mockResolvedValue(created);

      const result = await service.createBookReport(userId, dto);

      // publish 는 DB 컬럼이 아니라 빠지고, 대신 publishedAt 이 들어가야 한다.
      expect(bookReportsRepository.create).toHaveBeenCalledWith({
        ...fields,
        userId,
        publishedAt: expect.any(Date),
      });
      expect(result).toEqual(created);
    });

    it('publish 가 false 면 publishedAt 을 null 로 저장한다. (임시저장)', async () => {
      await service.createBookReport(userId, { bookId, publish: false });

      expect(bookReportsRepository.create).toHaveBeenCalledWith({
        bookId,
        userId,
        publishedAt: null,
      });
    });
  });

  describe('updateBookReport', () => {
    // 수정: 서비스는 update 결과가 없으면 NotFound 로 본다. 기본으로 수정된 행을 돌려주게 해 둔다.
    beforeEach(() => {
      bookReportsRepository.update.mockResolvedValue({ id: reportId, userId });
    });

    it('이미 있는 독후감을 수정한다.', async () => {
      bookReportsRepository.findById.mockResolvedValue({
        id: reportId,
        userId,
        content: '감상',
        publishedAt: null,
      });
      const updated = { id: reportId, userId, rating: 4, content: '다시 읽어도 좋았다.' };
      bookReportsRepository.update.mockResolvedValue(updated);
      const dto: UpdateBookReportDto = { rating: 4, content: '다시 읽어도 좋았다.' };

      const result = await service.updateBookReport(userId, reportId, dto);

      // publish 를 안 보냈으면 publishedAt 은 건드리지 않는다.
      expect(bookReportsRepository.update).toHaveBeenCalledWith(userId, reportId, {
        rating: 4,
        content: '다시 읽어도 좋았다.',
      });
      expect(result).toEqual(updated);
    });

    it('독후감이 없거나 다른 사람 것이면 BookReportNotFoundError 를 던진다.', async () => {
      bookReportsRepository.findById.mockResolvedValue(undefined);

      await expect(service.updateBookReport(userId, reportId, { rating: 4 })).rejects.toThrow(
        BookReportNotFoundError,
      );
      expect(bookReportsRepository.update).not.toHaveBeenCalled();
    });

    it('본문 있는 임시저장 글을 발행하면 publishedAt 을 채운다.', async () => {
      bookReportsRepository.findById.mockResolvedValue({
        id: reportId,
        userId,
        content: '감상',
        publishedAt: null,
      });

      await service.updateBookReport(userId, reportId, { publish: true });

      expect(bookReportsRepository.update).toHaveBeenCalledWith(userId, reportId, {
        publishedAt: expect.any(Date),
      });
    });

    it('publish 가 false 면 발행을 취소한다. (publishedAt → null)', async () => {
      bookReportsRepository.findById.mockResolvedValue({
        id: reportId,
        userId,
        content: '감상',
        publishedAt: new Date(),
      });

      await service.updateBookReport(userId, reportId, { publish: false });

      expect(bookReportsRepository.update).toHaveBeenCalledWith(userId, reportId, {
        publishedAt: null,
      });
    });

    it('본문 없는 임시저장 글을 발행하려 하면 PublishWithoutContentError 를 던진다.', async () => {
      bookReportsRepository.findById.mockResolvedValue({
        id: reportId,
        userId,
        content: null,
        publishedAt: null,
      });

      await expect(
        service.updateBookReport(userId, reportId, { rating: 4, publish: true }),
      ).rejects.toThrow(PublishWithoutContentError);
      // 잘못된 요청은 DB 까지 가면 안 된다.
      expect(bookReportsRepository.update).not.toHaveBeenCalled();
    });

    it('본문을 공백으로 바꾸면서 발행하려 하면 PublishWithoutContentError 를 던진다.', async () => {
      // 기존 글엔 본문이 있지만, 새로 보낸 본문이 공백이라 결과적으로 본문이 없는 발행이 된다.
      bookReportsRepository.findById.mockResolvedValue({
        id: reportId,
        userId,
        content: '감상',
        publishedAt: null,
      });

      await expect(
        service.updateBookReport(userId, reportId, { content: '   ', publish: true }),
      ).rejects.toThrow(PublishWithoutContentError);
      expect(bookReportsRepository.update).not.toHaveBeenCalled();
    });
  });
});
