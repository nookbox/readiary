/** 한 회차의 독서 상태. DB에는 varchar + CHECK 제약으로 저장한다. */
export const READING_STATUSES = ['want', 'reading', 'done', 'dropped'] as const;

export type ReadingStatus = (typeof READING_STATUSES)[number];

export const READING_STATUS_LABEL: Record<ReadingStatus, string> = {
  want: '읽고 싶은',
  reading: '읽는 중',
  done: '완독',
  dropped: '중단',
};

export function isReadingStatus(value: string): value is ReadingStatus {
  return (READING_STATUSES as readonly string[]).includes(value);
}
