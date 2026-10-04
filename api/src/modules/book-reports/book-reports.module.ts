import { Module } from '@nestjs/common';
import { BookReportsController } from './controllers/book-reports.controller';
import { BookReportsService } from './services/book-reports.service';

@Module({
  controllers: [BookReportsController],
  providers: [BookReportsService]
})
export class BookReportsModule {}
