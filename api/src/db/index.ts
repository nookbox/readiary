import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL 이 설정되지 않았습니다. .env 를 확인하세요.');
}

// better-auth 는 Nest DI 밖(모듈 로드 시점)에서 db 가 필요하다.
// 그래서 커넥션 풀을 여기서 하나 만들고 DbModule 과 better-auth 어댑터가 같이 쓴다.
const client = postgres(url, { max: 10 });
export const db = drizzle(client, { schema, casing: 'snake_case' });

export type Database = typeof db;
