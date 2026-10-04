import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

// 카카오 책 검색 API 응답 (https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide#search-book)
export const kakaoBookDocumentSchema = z.object({
  title: z.string(),
  contents: z.string(),
  url: z.string(),
  // "ISBN10 ISBN13" 공백 구분. 둘 중 하나만 있거나 빈 문자열일 수 있다.
  isbn: z.string(),
  // ISO 8601 (예: 2014-11-17T00:00:00.000+09:00). 없으면 빈 문자열.
  datetime: z.string(),
  authors: z.array(z.string()),
  publisher: z.string(),
  translators: z.array(z.string()),
  price: z.number().int(),
  sale_price: z.number().int(),
  // 없으면 빈 문자열
  thumbnail: z.string(),
  status: z.string(),
});

export const bookResponseSchema = z.object({
  meta: z.object({
    is_end: z.boolean(),
    pageable_count: z.number().int(),
    total_count: z.number().int(),
  }),
  documents: z.array(kakaoBookDocumentSchema),
});

export type KakaoBookDocument = z.infer<typeof kakaoBookDocumentSchema>;
export type BookResponse = z.infer<typeof bookResponseSchema>;

export class BookResponseDto extends createZodDto(bookResponseSchema) {}
