import { Module } from '@nestjs/common';
import { BooksClient } from './clients/books.client';
import { BooksController } from './controllers/books.controller';
import { BooksService } from './services/books.service';
import { BooksRepository } from './repositories/books.repository';

@Module({
  controllers: [BooksController],
  providers: [BooksService, BooksRepository, BooksClient],
  exports: [BooksService, BooksClient],
})
export class BooksModule {}
