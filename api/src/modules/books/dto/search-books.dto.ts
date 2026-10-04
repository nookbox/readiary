import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

export const searchBooksQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});

export class SearchBooksQueryDto extends createZodDto(searchBooksQuerySchema) {}
