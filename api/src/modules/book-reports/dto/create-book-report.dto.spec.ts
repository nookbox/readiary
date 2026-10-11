import { describe, expect, it } from 'vitest';
import { createBookReportSchema } from './create-book-report.dto';

describe('createBookReportSchema', () => {
  const bookId = '22222222-2222-4222-8222-222222222222';

  it('본문이 있으면 발행할 수 있다.', () => {
    const result = createBookReportSchema.safeParse({ bookId, content: '좋은 책', publish: true });

    expect(result.success).toBe(true);
  });

  // DB CHECK 제약은 NULL 만 막는다. 공백뿐인 본문은 여기서만 걸러진다.
  it.each([undefined, null, '   '])('본문이 비어있으면 발행할 수 없다.', (content) => {
    const result = createBookReportSchema.safeParse({ bookId, content, publish: true });

    expect(result.success).toBe(false);
  });
});
