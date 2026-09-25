import { defineConfig } from '@hey-api/openapi-ts';

// api 가 부팅 시 ../api/openapi.json 을 떨궈준다.
// 스펙 갱신: api 한 번 실행 → `pnpm gen:api`
export default defineConfig({
  input: '../api/openapi.json',
  // fetch 래퍼는 직접 두므로 SDK/HTTP 클라이언트는 만들지 않고 타입만 생성한다.
  output: 'src/api/generated',
  plugins: ['@hey-api/typescript'],
});
