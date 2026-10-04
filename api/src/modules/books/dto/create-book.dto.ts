import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(500),
  author: z.string().trim().max(300).nullish(),
  publisher: z.string().trim().max(200).nullish(),
  isbn13: z
    .string()
    .regex(/^97[89]\d{10}$/)
    .nullish(),
  coverUrl: z.url().nullish(),
  pageCount: z.number().int().positive().nullish(),
  // 출판일
  publishedAt: z.iso.date().nullish(),
});

export class CreateBookDto extends createZodDto(createBookSchema) {}
