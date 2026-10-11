import { Module } from '@nestjs/common';
import { BookReportsController } from './controllers/book-reports.controller';
import { BookReportsRepository } from './repositories/book-reports.repository';
import { BookReportsService } from './services/book-reports.service';

@Module({
  controllers: [BookReportsController],
  // 수정: BookReportsRepository 추가. 없으면 서비스 주입이 실패해 앱이 뜨지 않는다.
  providers: [BookReportsService, BookReportsRepository],
})
export class BookReportsModule {}
