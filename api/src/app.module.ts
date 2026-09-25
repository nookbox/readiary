import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BetterAuthGuard } from './common/guards/better-auth.guard';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DbModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: BetterAuthGuard }],
})
export class AppModule {}
