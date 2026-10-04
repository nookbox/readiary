import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeEach, describe, inject } from 'vitest';
import { BookReportsRepository } from './book-reports.repository';

describe('BookReportsRepository', () => {
  const client = postgres(inject('databaseUrl'), { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const repository = new BookReportsRepository(db);

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE book_reports CASCADE`);
  });

  afterAll(async () => {
    await client.end();
  });
});
