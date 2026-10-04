import { Database, DRIZZLE } from '@/db/db.module';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class BookReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}
}
