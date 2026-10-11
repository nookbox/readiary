import { Database, DRIZZLE } from '@/db/db.module';
import { bookReports, type BookReportRow, type NewBookReportRow } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class BookReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(values: NewBookReportRow): Promise<BookReportRow> {
    const [row] = await this.db.insert(bookReports).values(values).returning();

    return row!;
  }

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
      .set({ ...values, updatedAt: sql`now()` })
      .where(and(eq(bookReports.id, reportId), eq(bookReports.userId, userId)))
      .returning();

    return row;
  }

  async delete(userId: string, reportId: string): Promise<BookReportRow | undefined> {
    const [row] = await this.db
      .delete(bookReports)
      .where(and(eq(bookReports.id, reportId), eq(bookReports.userId, userId)))
      .returning();

    return row;
  }
}
