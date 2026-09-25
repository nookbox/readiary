# 다읽어리 (readiary)

## 구성

```
readiary/
├── api/                 NestJS + Drizzle ORM
├── mobile/              Expo (React Native)
└── docker-compose.yml   개발용 Postgres 16
```

## 시작하기

```bash
docker compose up -d          # Postgres (127.0.0.1:5436)

cd api
pnpm install
cp .env.example .env          # ALADIN_TTB_KEY 등을 채운다
pnpm db:migrate
pnpm dev                      # → http://localhost:4000/api

cd ../mobile
pnpm install
pnpm dev                      # → Expo 개발 서버
```

동작 확인:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","database":"up","timestamp":"..."}
```

## 타입 공유 (OpenAPI)

```
api/src/**/*.dto.ts          @nestjs/swagger 데코레이터
        ↓  api 실행 (NODE_ENV !== production)
api/openapi.json             스펙 산출물
        ↓  cd mobile && pnpm gen:api
mobile/src/api/generated/     타입만 생성 (@hey-api/openapi-ts)
```

**API를 고쳤으면 api를 한 번 실행해 스펙을 갱신한 뒤 `pnpm gen:api`를 돌린다.**
응답 모양이 바뀌면 앱 쪽에서 타입 에러로 바로 드러난다.

SDK나 HTTP 클라이언트는 생성하지 않는다. fetch 래퍼는 `mobile/src/api/client.ts`에 직접 둔다.

스펙 UI는 http://localhost:4000/api-docs 에서 볼 수 있다.

### MVP 범위

포함: 바코드 스캔 → 책 등록 · 서재/상태 · 독후감(별점·본문) · 재독 · 검색 · 내보내기

제외: OCR·인용 노트 · AI · 친구 공유/피드/댓글 · 오프라인 동기화

### 포트

|                | 포트 | 비고                                                  |
| -------------- | ---- | ----------------------------------------------------- |
| API            | 4000 | 스펙 UI는 `/api-docs`                                 |
| Postgres       | 5436 | 127.0.0.1 바인딩. 5433~5435는 기존 프로젝트가 사용 중 |
| Drizzle Studio | 4983 | `cd api && pnpm db:studio`                            |

## License

© 2026 Jungsik Jeong. All rights reserved. 자세한 내용은 [LICENSE](./LICENSE)를 참고하세요.
