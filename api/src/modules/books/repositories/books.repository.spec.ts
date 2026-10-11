import { describe, expect, it } from 'vitest';
import { books } from '@/db/schema';
import { useTestDb } from '@/test-utils/test-db';
import { BooksRepository } from './books.repository';

// 테스트용 Postgres 컨테이너(test/global-setup.ts)에 붙는 통합 테스트.
describe('BooksRepository', () => {
  const db = useTestDb([books]);
  const repository = new BooksRepository(db);

  it('책을 저장하고 DB 가 채운 id·createdAt 까지 돌려준다.', async () => {
    const book = await repository.create({ title: 'Test Book', isbn13: '9788936434120' });

    expect(book.id).toEqual(expect.any(String));
    expect(book.createdAt).toBeInstanceOf(Date);
    expect(book).toMatchObject({ title: 'Test Book', isbn13: '9788936434120' });
  });

  it('같은 isbn13 으로 다시 저장하면 에러 없이 기존 책을 덮어쓰지 않고 돌려준다.', async () => {
    const first = await repository.create({ title: 'First', isbn13: '9788936434120' });
    const second = await repository.create({ title: 'Second', isbn13: '9788936434120' });

    expect(second.id).toBe(first.id);
    expect(second.title).toBe('First');
    expect(await db.$count(books)).toBe(1);
  });

  it('isbn13 이 없으면 같은 제목이어도 매번 새로 저장한다.', async () => {
    const first = await repository.create({ title: 'No ISBN' });
    const second = await repository.create({ title: 'No ISBN' });

    expect(second.id).not.toBe(first.id);
    expect(await db.$count(books)).toBe(2);
  });

  it('형식이 틀린 isbn13 은 DB CHECK 제약에서 막힌다.', async () => {
    await expect(repository.create({ title: 'Bad', isbn13: '1234567890123' })).rejects.toThrow();
  });
});
