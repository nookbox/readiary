/**
 * 상태의 표시 이름. 값 자체는 서버가 정하고 openapi 타입으로 내려온다.
 * 한글 라벨은 UI 관심사라 앱에 둔다.
 */
export const READING_STATUS_LABEL = {
  want: '읽고 싶은',
  reading: '읽는 중',
  done: '완독',
  dropped: '중단',
} as const;

export type ReadingStatus = keyof typeof READING_STATUS_LABEL;

export const READING_STATUSES = Object.keys(READING_STATUS_LABEL) as ReadingStatus[];
