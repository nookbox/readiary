import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';
import { toIsbn13 } from '@/common/isbn';

// 클라이언트는 ISBN 만 보낸다. 책 정보는 서버가 카카오에서 조회해 채운다.
export const findOrCreateBookSchema = z.object({
  isbn: z.string().transform((raw, ctx) => {
    const isbn13 = toIsbn13(raw);
    if (!isbn13) {
      ctx.addIssue({ code: 'custom', message: '올바른 ISBN 이 아닙니다.' });
      return z.NEVER;
    }
    return isbn13;
  }),
});

export class FindOrCreateBookDto extends createZodDto(findOrCreateBookSchema) {}
