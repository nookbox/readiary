import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BookResponse, BookResponseDto, KakaoBookDocument } from '../dto/book-response.dto';
import type { CreateBookDto } from '../dto/create-book.dto';

const BASE_URL = 'https://dapi.kakao.com/v3/search/book';

type KakaoSearchTarget = 'title' | 'isbn' | 'publisher' | 'person';

@Injectable()
export class BooksClient {
  private readonly logger = new Logger(BooksClient.name);

  constructor(private readonly config: ConfigService) {}

  /** ISBN-13 으로 책 한 권을 조회해 DB 저장 형태로 돌려준다. 없으면 null. */
  async lookupByIsbn(isbn13: string): Promise<CreateBookDto | null> {
    const body = await this.request({ query: isbn13, target: 'isbn', size: 1 });
    const doc = body?.documents[0];

    return doc ? toCreateBook(doc) : null;
  }

  /** 제목·저자 키워드로 검색한다. 결과가 없으면 빈 배열. */
  async search(query: string, size = 20): Promise<BookResponseDto | null> {
    const documents = await this.request({ query, size });

    return documents ? documents : null;
  }

  private async request(params: {
    query: string;
    target?: KakaoSearchTarget;
    size?: number;
  }): Promise<BookResponseDto | null> {
    const url = new URL(BASE_URL);
    url.search = new URLSearchParams({
      query: params.query,
      ...(params.target && { target: params.target }),
      ...(params.size && { size: String(params.size) }),
    }).toString();

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${this.config.getOrThrow<string>('KAKAO_REST_API_KEY')}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      this.logger.warn(`카카오 책 검색 응답 오류: ${res.status} ${await res.text()}`);
      throw new BadGatewayException('책 정보를 가져오지 못했습니다.');
    }

    const body = (await res.json()) as BookResponse;
    // this.logger.log(`카카오 책 검색 응답: ${JSON.stringify(body)}`);

    return body ?? null;
  }
}

/** 카카오 검색 문서 → books 테이블 insert 형태 */
function toCreateBook(doc: KakaoBookDocument): CreateBookDto {
  return {
    // isbn 은 "ISBN10 ISBN13" 공백 구분이고 한쪽만 있을 수 있다
    isbn13: doc.isbn.split(' ').find((v) => v.length === 13) ?? null,
    title: doc.title,
    author: toAuthor(doc.authors),
    publisher: doc.publisher || null,
    coverUrl: doc.thumbnail || null,
    // 카카오 응답엔 쪽수가 없다
    pageCount: null,
    publishedAt: toDate(doc.datetime),
  };
}

function toAuthor(authors: string[]): string | null {
  return authors.length > 0 ? authors.join(', ') : null;
}

/** datetime 앞의 YYYY-MM-DD 만 쓴다. */
function toDate(datetime: string): string | null {
  const date = datetime.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}
