import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

export type Database = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error('DATABASE_URL 이 설정되지 않았습니다. .env 를 확인하세요.');
        }
        const client = postgres(url, { max: 10 });
        return drizzle(client, { schema, casing: 'snake_case' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
