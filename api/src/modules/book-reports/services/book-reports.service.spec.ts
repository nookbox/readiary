import { Test, TestingModule } from '@nestjs/testing';
import { BookReportsService } from './book-reports.service';
import { beforeEach, describe, expect, it } from 'vitest';

describe('BookReportsService', () => {
  let service: BookReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookReportsService],
    }).compile();

    service = module.get<BookReportsService>(BookReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
