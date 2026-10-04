import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BookReportsController } from './book-reports.controller';

describe('BookReportsController', () => {
  let controller: BookReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookReportsController],
    }).compile();

    controller = module.get<BookReportsController>(BookReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
