import { READING_STATUSES } from '@/common/reading-status';
import { isoDateTime } from '@/common/zod-codecs';
import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

// DB book_reports 행 응답
export const bookReportSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  bookId: z.uuid(),
  round: z.number().int().min(1),
  status: z.enum(READING_STATUSES),
  rating: z.number().int().min(1).max(5).nullable(),
  content: z.string().nullable(),
  startedAt: isoDateTime.nullable(),
  finishedAt: isoDateTime.nullable(),
  // null 이면 임시저장
  publishedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export class BookReportDto extends createZodDto(bookReportSchema, { codec: true }) {}
