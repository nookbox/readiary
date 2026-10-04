import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { type BookRow } from '@/db/schema';
import { CreateBookDto } from '@/modules/books/dto/create-book.dto';
import { BooksClient } from '@/modules/books/clients/books.client';
import { BooksRepository } from '@/modules/books/repositories/books.repository';
import { BooksService } from './books.service';
import { BookResponseDto } from '../dto/book-response.dto';

describe('BooksService', () => {
  let service: BooksService;

  const booksRepository = { findByIsbn: vi.fn(), create: vi.fn() };
  const booksClient = { lookupByIsbn: vi.fn(), search: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: BooksRepository, useValue: booksRepository },
        { provide: BooksClient, useValue: booksClient },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const book: BookRow = {
    id: 'b3f1c0de-0000-4000-8000-000000000001',
    isbn13: '9788936434120',
    title: 'Test Book',
    author: null,
    publisher: null,
    coverUrl: null,
    pageCount: null,
    publishedAt: '2024-06-01',
    createdAt: new Date(),
  };

  it('DB 에 이미 있는 ISBN 이면 카카오을 부르지 않고 그대로 돌려준다.', async () => {
    booksRepository.findByIsbn.mockResolvedValue(book);

    const result = await service.foundByIsbn('9788936434120');

    expect(result).toEqual(book);
    expect(booksClient.lookupByIsbn).not.toHaveBeenCalled();
    expect(booksRepository.create).not.toHaveBeenCalled();
  });

  it('DB 에 없으면 카카오에서 조회한 정보로 저장한다.', async () => {
    const info: CreateBookDto = { title: 'Test Book', isbn13: '9788936434120' };
    booksRepository.findByIsbn.mockResolvedValue(null);
    booksClient.lookupByIsbn.mockResolvedValue(info);
    booksRepository.create.mockResolvedValue(book);

    const result = await service.foundByIsbn('9788936434120');

    expect(booksClient.lookupByIsbn).toHaveBeenCalledWith('9788936434120');
    expect(booksRepository.create).toHaveBeenCalledWith(info);
    expect(result).toEqual(book);
  });

  it('카카오에도 없으면 null 을 돌려준다.', async () => {
    booksRepository.findByIsbn.mockResolvedValue(null);
    booksClient.lookupByIsbn.mockResolvedValue(null);

    await expect(service.foundByIsbn('9788936434120')).resolves.toBeNull();
    expect(booksRepository.create).not.toHaveBeenCalled();
  });

  it('검색어를 카카오 검색에 넘기고 결과를 그대로 돌려준다.', async () => {
    const results: BookResponseDto = {
      meta: {
        is_end: true,
        pageable_count: 9,
        total_count: 10,
      },
      documents: [
        {
          authors: ['기시미 이치로', '고가 후미타케'],
          contents:
            '인간은 변할 수 있고, 누구나 행복해 질 수 있다. 단 그러기 위해서는 ‘용기’가 필요하다고 말한 철학자가 있다. 바로 프로이트, 융과 함께 ‘심리학의 3대 거장’으로 일컬어지고 있는 알프레드 아들러다. 『미움받을 용기』는 아들러 심리학에 관한 일본의 1인자 철학자 기시미 이치로와 베스트셀러 작가인 고가 후미타케의 저서로, 아들러의 심리학을 ‘대화체’로 쉽고 맛깔나게 정리하고 있다. 아들러 심리학을 공부한 철학자와 세상에 부정적이고 열등감 많은',
          datetime: '2014-11-17T00:00:00.000+09:00',
          isbn: '8996991341 9788996991342',
          price: 14900,
          publisher: '인플루엔셜',
          sale_price: 13410,
          status: '정상판매',
          thumbnail:
            'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038',
          title: '미움받을 용기',
          translators: ['전경아'],
          url: 'https://search.daum.net/search?w=bookpage&bookId=1467038&q=%EB%AF%B8%EC%9B%80%EB%B0%9B%EC%9D%84+%EC%9A%A9%EA%B8%B0',
        },
      ],
    };

    booksClient.search.mockResolvedValue(results);

    const result = await service.search('Test Book');

    expect(booksClient.search).toHaveBeenCalledWith('Test Book');
    expect(booksRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual(results);
  });

  it('카카오 검색 결과가 없으면 null 을 돌려준다.', async () => {
    booksClient.search.mockResolvedValue(null);

    const result = await service.search('Test Book');

    expect(booksClient.search).toHaveBeenCalledWith('Test Book');
    expect(result).toBeNull();
  });
});
