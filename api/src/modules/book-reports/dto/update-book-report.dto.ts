import { bookReportSchema } from './book-report.dto';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateBookReportSchema = bookReportSchema
  .pick({
    status: true,
    rating: true,
    content: true,
    startedAt: true,
    finishedAt: true,
  })
  .partial()
  .extend({
    // 생략하면 발행 상태를 바꾸지 않음
    publish: z.boolean().optional(),
  });

export class UpdateBookReportDto extends createZodDto(updateBookReportSchema, { codec: true }) {}
