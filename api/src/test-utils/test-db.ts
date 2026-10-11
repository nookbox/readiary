import * as schema from '@/db/schema';
import { getTableName, sql, type Table } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeEach, inject } from 'vitest';

/**
 * 테스트용 Postgres 컨테이너(test/global-setup.ts)에 붙는 db 를 만든다. describe 안에서 호출한다.
 * 매 테스트 전에 넘긴 테이블을 비우고, 스위트가 끝나면 연결을 닫는다.
 */
export function useTestDb(tables: Table[]) {
  const client = postgres(inject('databaseUrl'), { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema, casing: 'snake_case' });

  beforeEach(async () => {
    const names = sql.join(
      tables.map((t) => sql.identifier(getTableName(t))),
      sql`, `,
    );
    await db.execute(sql`TRUNCATE TABLE ${names} CASCADE`);
  });

  afterAll(async () => {
    await client.end();
  });

  return db;
}
