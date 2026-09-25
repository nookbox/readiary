import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 개발 중 Expo 앱이 로컬 네트워크에서 바로 붙을 수 있게 열어 둔다.
  app.enableCors({ origin: true });

  const config = new DocumentBuilder()
    .setTitle('readiary API')
    .setDescription('다읽어리 — 독후감 기록 API')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // UI: /api-docs, spec JSON: /api-docs-json
  SwaggerModule.setup('api-docs', app, document);

  // openapi.json 은 mobile 의 gen:api 용 개발 산출물이다.
  // 컨테이너에서는 파일시스템이 읽기전용일 수 있으므로 건너뛴다.
  if (process.env.NODE_ENV !== 'production') {
    writeFileSync('openapi.json', JSON.stringify(document, null, 2));
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`readiary api → http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`api docs     → http://localhost:${port}/api-docs`, 'Bootstrap');
}

void bootstrap();
