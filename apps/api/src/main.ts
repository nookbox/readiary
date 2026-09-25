import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 개발 중에는 Expo 개발 서버(로컬 네트워크)에서 바로 붙을 수 있게 열어 둔다.
  app.enableCors({ origin: true });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`readiary api → http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
