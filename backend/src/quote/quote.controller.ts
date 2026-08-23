import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { QuoteService } from './quote.service'
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto'
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto'
import { parsePage } from '../common/pagination'
import { parseDateRange } from '../common/date-range'
import { QuoteStatus } from './entities/quote-request.entity'

const STATUSES: QuoteStatus[] = ['new', 'replied', 'closed']

@Controller('quote')
export class QuoteController {
  constructor(private readonly service: QuoteService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(@Body() dto: CreateQuoteRequestDto) {
    const request = await this.service.create(dto)
    return { id: request.id }
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAll(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const narrowed = STATUSES.find(s => s === status)
    return this.service.findAllWithStats(parsePage(page), narrowed, parseDateRange(from, to))
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.service.updateStatus(id, dto.status)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
