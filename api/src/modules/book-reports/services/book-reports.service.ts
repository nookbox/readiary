import type { BookReportRow, NewBookReportRow } from '@/db/schema';
import { BookReportsRepository } from '@/modules/book-reports/repositories/book-reports.repository';
import { Injectable } from '@nestjs/common';
import type { CreateBookReportDto } from '../dto/create-book-report.dto';
import type { UpdateBookReportDto } from '../dto/update-book-report.dto';
import { BookReportNotFoundError, PublishWithoutContentError } from '../errors/book-report.errors';

@Injectable()
export class BookReportsService {
  constructor(private readonly bookReportsRepository: BookReportsRepository) {}

  async createBookReport(userId: string, dto: CreateBookReportDto): Promise<BookReportRow> {
    const { publish, ...fields } = dto;

    return this.bookReportsRepository.create({
      ...fields,
      userId,
      publishedAt: publish ? new Date() : null,
    });
  }

  async updateBookReport(
    userId: string,
    reportId: string,
    dto: UpdateBookReportDto,
  ): Promise<BookReportRow> {
    const report = await this.bookReportsRepository.findById(userId, reportId);
    if (!report) throw new BookReportNotFoundError(reportId);

    const { publish, ...fields } = dto;

    // publish 를 안 보냈으면 기존 발행 상태를, content 를 안 보냈으면 기존 본문을 기준으로 본다.
    const willBePublished = publish ?? report.publishedAt !== null;
    const content = fields.content !== undefined ? fields.content : report.content;
    if (willBePublished && !content?.trim()) throw new PublishWithoutContentError();

    const values: Partial<NewBookReportRow> = { ...fields };
    // publish 를 보냈을 때만 발행 상태를 바꾼다. 이미 발행된 글은 처음 발행 시각을 유지한다.
    if (publish !== undefined) {
      values.publishedAt = publish ? (report.publishedAt ?? new Date()) : null;
    }

    const updated = await this.bookReportsRepository.update(userId, reportId, values);
    // 조회와 수정 사이에 삭제된 경우
    if (!updated) throw new BookReportNotFoundError(reportId);

    return updated;
  }
}
