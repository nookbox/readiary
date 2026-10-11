import type { AuthUser } from '@/common/decorators/current-user.decorator';
import { BookReportsService } from '@/modules/book-reports/services/book-reports.service';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateBookReportDto } from '../dto/create-book-report.dto';
import type { UpdateBookReportDto } from '../dto/update-book-report.dto';
import { BookReportsController } from './book-reports.controller';

describe('BookReportsController', () => {
  let controller: BookReportsController;
  const service = { createBookReport: vi.fn(), updateBookReport: vi.fn() };

  const user: AuthUser = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'reader@example.com',
    name: '독서가',
    image: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookReportsController],
      providers: [{ provide: BookReportsService, useValue: service }],
    }).compile();

    controller = module.get<BookReportsController>(BookReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBookReport', () => {
    it('독후감을 처음 생성한다.', async () => {
      // ZodValidationPipe 를 거친 뒤라 날짜는 이미 Date 다.
      const dto: CreateBookReportDto = {
        bookId: '22222222-2222-4222-8222-222222222222',
        status: 'finished',
        rating: 5,
        content: '좋은 책이었습니다.',
        startedAt: new Date('2026-09-01T00:00:00.000Z'),
        finishedAt: new Date('2026-09-20T00:00:00.000Z'),
        publish: true,
      };
      const { publish: _publish, ...fields } = dto;
      const created = {
        id: '33333333-3333-4333-8333-333333333333',
        userId: user.id,
        round: 1,
        ...fields,
        publishedAt: new Date('2026-09-20T00:00:00.000Z'),
        createdAt: new Date('2026-09-20T00:00:00.000Z'),
        updatedAt: new Date('2026-09-20T00:00:00.000Z'),
      };

      service.createBookReport.mockResolvedValue(created);

      const result = await controller.createBookReport(user, dto);

      expect(service.createBookReport).toHaveBeenCalledWith(user.id, dto);
      expect(result).toEqual(created);
    });
  });

  describe('updateBookReport', () => {
    it('독후감을 수정한다.', async () => {
      const reportId = '33333333-3333-4333-8333-333333333333';
      const dto: UpdateBookReportDto = {
        content: '수정된 내용입니다.',
        publish: true,
      };

      const updated = {
        id: reportId,
        userId: user.id,
        round: 1,
        bookId: '22222222-2222-4222-8222-222222222222',
        status: 'finished',
        rating: 5,
        content: dto.content,
        startedAt: new Date('2026-09-01T00:00:00.000Z'),
        finishedAt: new Date('2026-09-20T00:00:00.000Z'),
        publishedAt: new Date('2026-09-20T00:00:00.000Z'),
        createdAt: new Date('2026-09-20T00:00:00.000Z'),
        updatedAt: new Date('2026-09-21T00:00:00.000Z'),
      };

      service.updateBookReport.mockResolvedValue(updated);

      const result = await controller.updateBookReport(user, reportId, dto);

      expect(service.updateBookReport).toHaveBeenCalledWith(user.id, reportId, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteBookReport', () => {
    it('독후감을 삭제한다.', async () => {
      const reportId = '33333333-3333-4333-8333-333333333333';

      service.deleteBookReport.mockResolvedValue(undefined);

      const result = await controller.deleteBookReport(user, reportId);

      expect(service.deleteBookReport).toHaveBeenCalledWith(user.id, reportId);
      expect(result).toBeUndefined();
    });
  });
});
