import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';
import { isoDateTime } from '@/common/zod-codecs';

// DB books 행 응답
export const bookSchema = z.object({
  id: z.uuid(),
  isbn13: z.string().nullable(),
  title: z.string(),
  author: z.string().nullable(),
  publisher: z.string().nullable(),
  coverUrl: z.string().nullable(),
  pageCount: z.number().int().nullable(),
  // 출판일 (YYYY-MM-DD)
  publishedAt: z.string().nullable(),
  createdAt: isoDateTime,
});

export class BookDto extends createZodDto(bookSchema, { codec: true }) {}
