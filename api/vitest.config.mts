import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    env: { DOTENV_CONFIG_QUIET: 'true' },
    // 레포지토리 테스트용 Postgres 컨테이너를 한 번 띄우고 마이그레이션을 적용한다.
    globalSetup: ['./test/global-setup.ts'],
    // 수정: 레포지토리 테스트들이 같은 DB 를 공유한다. 파일을 병렬로 돌리면 서로의 테이블을 TRUNCATE 해서 깨진다.
    fileParallelism: false,
  },
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },

  plugins: [swc.vite({ module: { type: 'es6' } })],
});
