import { bookReports, books, users } from '@/db/schema';
import { eq } from 'drizzle-orm'; // 수정: 다른 사람 독후감 테스트에서 DB 를 직접 조회하려고 추가
import { useTestDb } from '@/test-utils/test-db';
import { beforeEach, describe, expect, it } from 'vitest';
import { BookReportsRepository } from './book-reports.repository';

describe('BookReportsRepository', () => {
  const db = useTestDb([bookReports, books, users]);
  const repository = new BookReportsRepository(db);

  let userId: string;
  let bookId: string;

  beforeEach(async () => {
    // 테이블은 useTestDb 가 먼저 비운다. 그 다음 외래키 대상 행을 만든다.
    const [user] = await db
      .insert(users)
      .values({ name: '독서가', email: 'reader@example.com' })
      .returning();
    const [book] = await db.insert(books).values({ title: '테스트 책' }).returning();

    userId = user!.id;
    bookId = book!.id;
  });

  it('본문 없이 발행하면 DB가 거부한다.', async () => {
    await expect(
      repository.create({ userId, bookId, content: null, publishedAt: new Date() }),
    ).rejects.toMatchObject({
      cause: { constraint_name: 'book_reports_published_has_content' },
    });
  });

  it('본문 없는 임시저장은 허용한다.', async () => {
    const row = await repository.create({ userId, bookId, content: null, publishedAt: null });

    expect(row.publishedAt).toBeNull();
  });

  it('본문이 있는 독후감을 생성한다.', async () => {
    const row = await repository.create({
      userId,
      bookId,
      content: '좋은 책이었음',
      publishedAt: null,
    });

    expect(row.content).toBe('좋은 책이었음');
    expect(row.publishedAt).toBeNull();
  });

  it('시작 날짜가 종료 날짜보다 이후이면 DB가 거부한다.', async () => {
    await expect(
      repository.create({
        userId,
        bookId,
        startedAt: new Date('2024-01-02'),
        finishedAt: new Date('2024-01-01'),
        content: '테스트',
        publishedAt: null,
      }),
    ).rejects.toMatchObject({
      cause: { constraint_name: 'book_reports_started_before_finished' },
    });
  });

  it('시작 날짜와 종료 날짜가 같으면 허용한다.', async () => {
    const row = await repository.create({
      userId,
      bookId,
      startedAt: new Date('2024-01-01'),
      finishedAt: new Date('2024-01-01'),
      content: '테스트',
      publishedAt: null,
    });

    expect(row.startedAt).toEqual(new Date('2024-01-01'));
    expect(row.finishedAt).toEqual(new Date('2024-01-01'));
  });

  describe('update', () => {
    it('보낸 필드만 수정하고 나머지는 유지한다.', async () => {
      const created = await repository.create({
        userId,
        bookId,
        rating: 3,
        content: '처음 쓴 감상',
        publishedAt: null,
      });

      const updated = await repository.update(userId, created.id, { rating: 5 });

      expect(updated?.rating).toBe(5);
      expect(updated?.content).toBe('처음 쓴 감상');
      expect(updated?.publishedAt).toBeNull();
    });

    it('수정하면 updatedAt 이 갱신된다.', async () => {
      const created = await repository.create({
        userId,
        bookId,
        content: '감상',
        publishedAt: null,
      });

      const updated = await repository.update(userId, created.id, { rating: 4 });

      expect(updated!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('다른 사람의 독후감은 수정되지 않는다.', async () => {
      const [other] = await db
        .insert(users)
        .values({ name: '다른 사람', email: 'other@example.com' })
        .returning();
      const created = await repository.create({ userId, bookId, rating: 3, publishedAt: null });

      const updated = await repository.update(other!.id, created.id, { rating: 1 });

      expect(updated).toBeUndefined();
      const [row] = await db.select().from(bookReports).where(eq(bookReports.id, created.id));
      expect(row?.rating).toBe(3);
    });

    it('본문 있는 임시저장 글을 발행할 수 있다.', async () => {
      const draft = await repository.create({ userId, bookId, content: '감상', publishedAt: null });

      const published = await repository.update(userId, draft.id, { publishedAt: new Date() });

      expect(published?.publishedAt).toBeInstanceOf(Date);
    });

    // CHECK 제약은 UPDATE 에도 걸린다. "임시저장 → 발행"은 실제로 update 에서 일어나는 흐름이라 대표로 하나만 확인한다.
    it('본문 없는 임시저장 글을 발행하면 DB가 거부한다.', async () => {
      const draft = await repository.create({ userId, bookId, content: null, publishedAt: null });

      await expect(
        repository.update(userId, draft.id, { publishedAt: new Date() }),
      ).rejects.toMatchObject({
        cause: { constraint_name: 'book_reports_published_has_content' },
      });
    });
  });
});
