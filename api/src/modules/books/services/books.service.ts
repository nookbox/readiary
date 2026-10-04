import { BooksClient } from '@/modules/books/clients/books.client';
import { BooksRepository } from '@/modules/books/repositories/books.repository';
import { Injectable } from '@nestjs/common';
import { type BookResponseDto } from '../dto/book-response.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly booksClient: BooksClient,
  ) {}

  /** DB 에 있으면 그대로, 없으면 카카오에서 조회해 저장한 뒤 돌려준다. */
  async foundByIsbn(isbn13: string) {
    const book = await this.booksRepository.findByIsbn(isbn13);
    if (book) return book;

    const info = await this.booksClient.lookupByIsbn(isbn13);
    if (!info) return null;

    return this.booksRepository.create(info);
  }

  /** 카카오 책 검색으로 제목·저자 검색 */
  async search(query: string): Promise<BookResponseDto | null> {
    return this.booksClient.search(query);
  }
}
