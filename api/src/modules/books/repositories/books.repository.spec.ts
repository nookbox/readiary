import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';
import * as schema from '@/db/schema';
import { BooksRepository } from './books.repository';

// 테스트용 Postgres 컨테이너(test/global-setup.ts)에 붙는 통합 테스트.
describe('BooksRepository', () => {
  const client = postgres(inject('databaseUrl'), { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const repository = new BooksRepository(db);

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE books CASCADE`);
  });

  afterAll(async () => {
    await client.end();
  });

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
    expect(await db.$count(schema.books)).toBe(1);
  });

  it('isbn13 이 없으면 같은 제목이어도 매번 새로 저장한다.', async () => {
    const first = await repository.create({ title: 'No ISBN' });
    const second = await repository.create({ title: 'No ISBN' });

    expect(second.id).not.toBe(first.id);
    expect(await db.$count(schema.books)).toBe(2);
  });

  it('형식이 틀린 isbn13 은 DB CHECK 제약에서 막힌다.', async () => {
    await expect(repository.create({ title: 'Bad', isbn13: '1234567890123' })).rejects.toThrow();
  });
});
