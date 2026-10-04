import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { auth } from './lib/auth';

async function bootstrap() {
  // better-auth 는 raw body 를 직접 읽는다. Nest 의 body parser 를 끄고 auth 핸들러 뒤에 다시 켠다.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ZodValidationPipe());

  // app.enableCors({ origin: true });

  // /api/auth/* 는 전부 better-auth 가 처리한다 (로그인·콜백·세션·로그아웃).
  app.use('/api/auth', toNodeHandler(auth));
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });

  const config = new DocumentBuilder()
    .setTitle('readiary API')
    .setDescription('다읽어리 — 독후감 기록 API')
    .setVersion('0.1.0')
    .build();
  // nestjs-zod 의 DTO 스키마를 OpenAPI 형식으로 정리한다.
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
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
