import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';
import { bookReportSchema } from './book-report.dto';

// 독후감 생성 요청. id/userId/round/publishedAt/타임스탬프는 서버가 채운다.
export const createBookReportSchema = bookReportSchema
  .pick({
    bookId: true,
    status: true,
    rating: true,
    content: true,
    startedAt: true,
    finishedAt: true,
  })
  .partial({
    status: true,
    rating: true,
    content: true,
    startedAt: true,
    finishedAt: true,
  })
  .extend({
    // false(기본값)면 임시저장, true 면 서버가 publishedAt 을 현재 시각으로 채운다.
    publish: z.boolean().default(false),
  })
  .refine((v) => !v.publish || (v.content != null && v.content.trim() !== ''), {
    message: '본문 없이 발행할 수 없습니다.',
    path: ['content'],
  });

export class CreateBookReportDto extends createZodDto(createBookReportSchema, { codec: true }) {}
