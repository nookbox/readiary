// test/global-setup.ts 가 provide 하는 값의 타입. 테스트에서 inject('databaseUrl') 로 꺼낸다.
declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export {};
