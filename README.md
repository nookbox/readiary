# 다읽어리 (readiary)

종이책 독후감 기록 앱. 맥미니 홈서버에 API와 DB를 두고, Expo 앱에서 기록한다.

> `read` + `diary` → `readiary` / "다 읽어" + "다이어리" → **다읽어리**

## 구성

```
readiary/
├── api/                 NestJS + Drizzle ORM   (독립 프로젝트)
├── mobile/              Expo (React Native)    (독립 프로젝트)
└── docker-compose.yml   개발용 Postgres 16
```

두 프로젝트는 서로 의존하지 않는다. 각자 `node_modules`를 갖고 따로 설치·실행한다.
**타입은 OpenAPI로 공유한다** — api가 스펙을 떨구고 mobile이 그걸로 타입을 생성한다.

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

### 무엇을 공유하고 무엇을 공유하지 않는가

OpenAPI가 가져다주는 것은 **타입**이다. 로직은 각자 갖는다.

- ISBN 판정 — 진짜 검증(체크디지트 포함)은 `api/src/common/isbn.ts`.
  앱의 `mobile/src/constants/isbn.ts`는 부가기호 바코드를 걸러내기 위한 정규식 한 줄짜리 UX 필터다.
  클라이언트는 믿지 않는다는 원칙은 그대로다.
- 상태 한글 라벨 — UI 관심사이므로 `mobile/src/constants/reading-status.ts`.
  상태 값 자체는 서버가 정하고 생성된 타입으로 내려온다.

## 데이터 모델

테이블은 셋이다.

**`users`** — 비밀번호 컬럼이 없다. 인증은 외부 IdP(nook auth)가 담당하고 여기엔 `idp_sub`만 둔다.
내부 `id`(uuid)를 따로 두는 이유는 나중에 IdP를 바꿔도 다른 테이블의 FK가 깨지지 않게 하기 위해서다.

**`books`** — 책 자체. ISBN 단위의 마스터 데이터이고 특정 사용자에게 속하지 않는다.
알라딘 API 응답을 여기에 복사해 둔다. 외부 API가 죽거나 책이 절판돼도 내 서재는 남아야 하기 때문이다.
`isbn13`은 nullable이다 — 오래된 책, 독립출판물, 해외 직구본은 ISBN이 없을 수 있다.

**`book_reports`** — 한 번의 "읽기"와 그에 딸린 독후감.
`round`(회차)가 있어서 재독하면 같은 책에 행이 하나 더 생기고, 독후감·별점·기간이 회차별로 따로 남는다.

```
사피엔스  round=1  done     2023.03~2023.04  ★5  "처음 읽었을 때..."
사피엔스  round=2  reading  2026.09~          -   (작성 중)
```

`(user_id, book_id, round)` unique가 같은 회차의 중복 생성을 막는다.
`round`는 자동 증가가 아니므로 앱이 `max(round) + 1`로 계산해 넣는다.

### 설계 결정

- **`status`는 varchar + CHECK.** Postgres ENUM은 값 추가는 쉽지만 이름 변경·삭제가 어렵다.
- **`started_at` / `finished_at`은 nullable.** `want`는 아직 시작 전, `reading`은 완독일이 없다.
- **상태 이력 테이블은 두지 않는다.** 재독은 `round`로 해결된다. 한 회차 안의 상태 변화까지
  추적하고 싶어지면 그때 `status_changes`를 얹는다.
- **`books`에 `user_id`가 없다.** 책은 누구의 것도 아니고, "누가 읽었나"는 전부 `book_reports`가 안다.
  나중에 친구 공유를 붙일 때 이 구조가 그대로 쓰인다.

### ISBN 처리

책 뒷면에는 바코드가 둘 있다 — ISBN 바코드와 부가기호 바코드(5자리).
스캐너가 부가기호를 먼저 읽는 일이 잦으므로 **13자리이면서 `978`/`979`로 시작하는 값만** 책으로 인정한다.
DB에도 같은 규칙을 CHECK 제약으로 걸어 뒀다. 저장 전 하이픈·공백은 제거한다.

## 아키텍처 메모

**서버 온리.** 로컬 SQLite·동기화·충돌 처리는 두지 않는다. 혼자 쓰는 MVP에서 그 복잡도는 값을 못 한다.
대신 작성 중인 글은 `AsyncStorage`에 임시저장(draft)해서, 저장 실패로 글이 날아가는 최악만 막는다.

맥미니가 죽으면 앱도 멈춘다는 뜻이다. 그게 실제로 불편해지면 그때 오프라인 우선으로 전환한다
(기능 추가가 아니라 구조 교체에 가깝다).

### MVP 범위

포함: 바코드 스캔 → 책 등록 · 서재/상태 · 독후감(별점·본문) · 재독 · 검색 · 내보내기

제외: OCR·인용 노트 · AI · 친구 공유/피드/댓글 · 오프라인 동기화

### 포트

| | 포트 | 비고 |
| --- | --- | --- |
| API | 4000 | 스펙 UI는 `/api-docs` |
| Postgres | 5436 | 127.0.0.1 바인딩. 5433~5435는 기존 프로젝트가 사용 중 |
| Drizzle Studio | 4983 | `cd api && pnpm db:studio` |

## 참고

- **Expo + pnpm에는 `node-linker=hoisted`가 필요하다** (`mobile/.npmrc`). Metro가 pnpm의 심볼릭 링크 구조를 제대로 해석하지 못한다.
- pnpm 11부터 `package.json`의 `pnpm` 필드는 무시된다. 설정은 `pnpm-workspace.yaml`에 둔다 (워크스페이스가 아니어도 설정 파일로 읽힌다).
