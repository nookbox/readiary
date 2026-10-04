import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '@/db/db.module';
import { books, type BookRow } from '@/db/schema';
import { CreateBookDto } from '@/modules/books/dto/create-book.dto';

@Injectable()
export class BooksRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findByIsbn(isbn13: string): Promise<BookRow | null> {
    const [book] = await this.db.select().from(books).where(eq(books.isbn13, isbn13)).limit(1);
    return book ?? null;
  }

  async create(dto: CreateBookDto): Promise<BookRow> {
    const [inserted] = await this.db
      .insert(books)
      .values(dto)
      .onConflictDoNothing({ target: books.isbn13 })
      .returning();

    if (inserted) return inserted;

    const [existing] = await this.db
      .select()
      .from(books)
      .where(eq(books.isbn13, dto.isbn13!))
      .limit(1);

    if (!existing) {
      // 충돌 직후 기존 행이 삭제된 경우 등. 정상 흐름에선 오지 않는다.
      throw new InternalServerErrorException('책을 저장하지 못했습니다.');
    }

    return existing;
  }
}
