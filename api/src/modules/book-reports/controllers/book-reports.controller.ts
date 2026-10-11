import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { BookReportDto } from '../dto/book-report.dto';
import { CreateBookReportDto } from '../dto/create-book-report.dto';
import type { UpdateBookReportDto } from '../dto/update-book-report.dto';
import { BookReportErrorFilter } from '../filters/book-report-error.filter';
import { BookReportsService } from '../services/book-reports.service';

@ApiTags('book-reports')
@Controller('book-reports')
@UseFilters(BookReportErrorFilter)
export class BookReportsController {
  constructor(private readonly bookReportsService: BookReportsService) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: BookReportDto })
  async createBookReport(@CurrentUser() user: AuthUser, @Body() dto: CreateBookReportDto) {
    return this.bookReportsService.createBookReport(user.id, dto);
  }

  @Patch(':id')
  @ZodResponse({ status: HttpStatus.OK, type: BookReportDto })
  async updateBookReport(
    @CurrentUser() user: AuthUser,
    @Param('id') reportId: string,
    @Body() dto: UpdateBookReportDto,
  ) {
    return this.bookReportsService.updateBookReport(user.id, reportId, dto);
  }

  @Delete(':id')
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBookReport(@CurrentUser() user: AuthUser, @Param('id') reportId: string) {
    return this.bookReportsService.deleteBookReport(user.id, reportId);
  }
}
