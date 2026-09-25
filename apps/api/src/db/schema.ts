import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * 사용자.
 *
 * 비밀번호 컬럼이 없다. 인증은 외부 IdP(nook auth)가 담당하고,
 * 여기에는 IdP가 발급한 고유 식별자(sub)만 보관한다.
 * 내부 id를 uuid로 따로 두는 이유는, 나중에 IdP를 바꾸거나 추가해도
 * 다른 테이블의 FK가 깨지지 않게 하기 위해서다.
 */
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  idpSub: varchar({ length: 255 }).notNull().unique(),
  displayName: varchar({ length: 100 }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * 책 자체. ISBN 단위의 마스터 데이터로, 특정 사용자에게 속하지 않는다.
 * 『사피엔스』는 누가 읽든 하나이며, 표지와 저자는 모두에게 동일하다.
 *
 * 알라딘 API 응답을 여기에 복사해 둔다. API가 죽거나 책이 절판돼
 * 외부에서 사라져도 내 서재는 그대로 남아야 하기 때문이다.
 *
 * isbn13 은 nullable 이다. 오래된 책, 독립출판물, 해외 직구본처럼
 * ISBN이 아예 없는 책을 수동 등록할 수 있어야 한다.
 */
export const books = pgTable(
  'books',
  {
    id: uuid().primaryKey().defaultRandom(),
    isbn13: varchar({ length: 13 }).unique(),
    title: varchar({ length: 500 }).notNull(),
    author: varchar({ length: 300 }),
    publisher: varchar({ length: 200 }),
    coverUrl: text(),
    pageCount: integer(),
    publishedAt: date(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('books_isbn13_format', sql`${t.isbn13} IS NULL OR ${t.isbn13} ~ '^97[89][0-9]{10}$'`),
    index('books_title_idx').on(t.title),
  ],
);

/**
 * 한 번의 "읽기"와 그에 딸린 독후감.
 *
 * 한 책을 여러 번 읽을 수 있으므로 round(회차)를 둔다.
 * 재독하면 같은 book_id 에 round=2 인 행이 새로 생기고,
 * 독후감·별점·기간이 회차별로 따로 기록된다.
 *
 * status 는 varchar + CHECK 다. Postgres ENUM 타입은 값 추가는 쉽지만
 * 이름 변경·삭제가 어려워, 제약만 다시 걸면 되는 쪽을 택했다.
 *
 * startedAt / finishedAt 이 nullable 인 것은 의도된 설계다.
 * 'want' 상태면 아직 시작하지 않았고, 'reading' 이면 완독일이 없다.
 */
export const bookReports = pgTable(
  'book_reports',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: uuid()
      .notNull()
      .references(() => books.id, { onDelete: 'restrict' }),
    round: integer().notNull().default(1),
    status: varchar({ length: 20 }).notNull().default('want'),
    rating: smallint(),
    content: text(),
    startedAt: timestamp({ withTimezone: true }),
    finishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // 같은 책의 같은 회차가 중복 생성되는 것을 막는다.
    // 버튼 연타로 2회차가 두 개 생기는 사고 방지.
    unique('book_reports_user_book_round_uq').on(t.userId, t.bookId, t.round),
    // 서재 화면은 항상 "내 책 중 특정 상태"로 조회한다.
    index('book_reports_user_status_idx').on(t.userId, t.status),
    check('book_reports_round_positive', sql`${t.round} >= 1`),
    check('book_reports_rating_range', sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 5`),
    check(
      'book_reports_status_allowed',
      sql`${t.status} IN ('want', 'reading', 'done', 'dropped')`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BookRow = typeof books.$inferSelect;
export type NewBookRow = typeof books.$inferInsert;
export type BookReportRow = typeof bookReports.$inferSelect;
export type NewBookReportRow = typeof bookReports.$inferInsert;
