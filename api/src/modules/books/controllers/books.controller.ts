import { BookDto } from '@/modules/books/dto/book.dto';
import { BookResponseDto } from '@/modules/books/dto/book-response.dto';
import { SearchBooksQueryDto } from '@/modules/books/dto/search-books.dto';
import { BooksService } from '@/modules/books/services/books.service';
import { Controller, Get, HttpStatus, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // ':isbn' 보다 먼저 선언해야 /books/search 가 ISBN 으로 잡히지 않는다
  @Get('search')
  @ZodResponse({ status: HttpStatus.OK, type: BookResponseDto })
  async search(@Query() query: SearchBooksQueryDto) {
    const result = await this.booksService.search(query.q);

    if (!result) throw new NotFoundException('책을 찾을 수 없습니다.');

    return result;
  }

  @Get(':isbn')
  @ZodResponse({ status: HttpStatus.OK, type: BookDto })
  async findByIsbn(@Param('isbn') isbn: string) {
    const result = await this.booksService.foundByIsbn(isbn);

    if (!result) throw new NotFoundException('책을 찾을 수 없습니다.');

    return result;
  }
}
