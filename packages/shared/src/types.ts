import type { ReadingStatus } from './reading-status';

export interface Book {
  id: string;
  isbn13: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface BookReport {
  id: string;
  userId: string;
  bookId: string;
  /** 회차. 재독하면 2, 3... 으로 늘어난다. */
  round: number;
  status: ReadingStatus;
  rating: number | null;
  content: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 서재 목록 한 줄: 책 + 가장 최근 회차. */
export interface ShelfItem {
  book: Book;
  latestReport: BookReport;
  totalRounds: number;
}
