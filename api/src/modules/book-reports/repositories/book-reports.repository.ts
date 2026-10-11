import { Database, DRIZZLE } from '@/db/db.module';
import { bookReports, type BookReportRow, type NewBookReportRow } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class BookReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(values: NewBookReportRow): Promise<BookReportRow> {
    const [row] = await this.db.insert(bookReports).values(values).returning();

    return row!;
  }

  // 수정: 서비스가 수정 전에 기존 글을 확인하려고 추가. 남의 글은 조회되지 않는다.
  async findById(userId: string, reportId: string): Promise<BookReportRow | undefined> {
    const [row] = await this.db
      .select()
      .from(bookReports)
      .where(and(eq(bookReports.id, reportId), eq(bookReports.userId, userId)));

    return row;
  }

  async update(
    userId: string,
    reportId: string,
    values: Partial<NewBookReportRow>,
  ): Promise<BookReportRow | undefined> {
    const [row] = await this.db
      .update(bookReports)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(bookReports.id, reportId), eq(bookReports.userId, userId)))
      .returning();

    return row;
  }
}
