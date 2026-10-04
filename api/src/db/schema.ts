import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable(
  'session',
  {
    id: uuid().primaryKey().defaultRandom(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // IdP 세션 식별자(id_token.sid). 백채널 로그아웃 통지를 이 세션 하나로 좁힌다.
    idpSid: text(),
  },
  (t) => [index('session_user_id_idx').on(t.userId), index('session_idp_sid_idx').on(t.idpSid)],
);

export const account = pgTable(
  'account',
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('account_provider_account_uq').on(t.providerId, t.accountId),
    index('account_user_id_idx').on(t.userId),
  ],
);

export const verification = pgTable(
  'verification',
  {
    id: uuid().primaryKey().defaultRandom(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);

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
