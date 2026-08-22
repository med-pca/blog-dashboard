import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Ip, Logger, Param, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChatMessage, ChatService } from './chat.service'
import { INJECTION_PATTERNS, sanitizeContent } from './chat-guards'
import { ChatHistoryService } from './chat-history.service'
import { ChatRatingService } from './chat-rating.service'
import { ChatLeadService } from './chat-lead.service'
import { ChatStatsService } from './chat-stats.service'
import { ChatBodyDto, SummaryBodyDto } from './dto/chat-body.dto'
import { RatingBodyDto } from './dto/rating-body.dto'
import { EventBodyDto } from './dto/event-body.dto'
import { parsePage } from '../common/pagination'
import { parseDateRange } from '../common/date-range'

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name)

  constructor(
    private readonly chatService: ChatService,
    private readonly historyService: ChatHistoryService,
    private readonly ratingService: ChatRatingService,
    private readonly leadService: ChatLeadService,
    private readonly statsService: ChatStatsService,
  ) {}

  // Lead takibi asıl akışı asla bozmamalı; hatalar loglanıp yutulur
  private trackLead(promise: Promise<void>): void {
    promise.catch(err =>
      this.logger.warn(`Lead kaydı başarısız: ${err instanceof Error ? err.message : err}`),
    )
  }

  // Injection denetimi yalnızca kullanıcı girdisine uygulanır; assistant
  // mesajları artık istemciden gelmez (geçmiş sunucuda tutulur)
  private sanitizeAndGuard(content: string, ip: string): ChatMessage {
    const clean = sanitizeContent(content)
    const matched = INJECTION_PATTERNS.find(p => p.test(clean))
    if (matched) {
      this.logger.warn(
        `Injection denemesi engellendi (ip: ${ip}, desen: ${matched}): "${clean.slice(0, 120)}"`,
      )
      throw new BadRequestException('Geçersiz mesaj içeriği')
    }
    if (!clean) throw new BadRequestException('Mesaj boş olamaz')
    return { role: 'user', content: clean }
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async chat(@Body() dto: ChatBodyDto, @Ip() ip: string) {
    const userMessage = this.sanitizeAndGuard(dto.message, ip)
    const history = await this.historyService.load(dto.sessionId)
    const messages = [...history, userMessage]

    const reply = await this.chatService.chat(messages)

    // Cevap callModel'de sanitize edildi; geçmişe temiz haliyle yazılır
    await this.historyService.save(dto.sessionId, [...messages, { role: 'assistant', content: reply }])
    this.trackLead(this.leadService.upsertFromChat(dto.sessionId, messages, reply))
    return { reply }
  }

  @Post('summary')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async summary(@Body() dto: SummaryBodyDto) {
    const history = await this.historyService.load(dto.sessionId)
    if (history.length < 2) {
      throw new BadRequestException('Özet için yeterli görüşme geçmişi yok')
    }
    const text = await this.chatService.generateSummary(history)
    this.trackLead(this.leadService.markWhatsapp(dto.sessionId))
    return { text }
  }

  @Post('rating')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async rate(@Body() dto: RatingBodyDto) {
    const conversation = await this.historyService.load(dto.sessionId)
    await this.ratingService.create(dto.rating, conversation, dto.sessionId)
    this.trackLead(this.leadService.attachRating(dto.sessionId, dto.rating))
    return { ok: true }
  }

  @UseGuards(JwtAuthGuard)
  @Get('rating/admin/all')
  adminRatings(@Query('page') page?: string) {
    return this.ratingService.findAllWithStats(parsePage(page))
  }

  @UseGuards(JwtAuthGuard)
  @Delete('rating/admin/:id')
  @HttpCode(204)
  removeRating(@Param('id') id: string) {
    return this.ratingService.remove(id)
  }

  @Post('event')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async event(@Body() dto: EventBodyDto) {
    if (dto.type === 'open') this.trackLead(this.statsService.recordOpen())
    return { ok: true }
  }

  @UseGuards(JwtAuthGuard)
  @Get('lead/admin/all')
  adminLeads(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const narrowed = status === 'active' || status === 'whatsapp' ? status : undefined
    return this.leadService.findAllWithStats(parsePage(page), narrowed, parseDateRange(from, to))
  }

  @UseGuards(JwtAuthGuard)
  @Delete('lead/admin/:id')
  @HttpCode(204)
  removeLead(@Param('id') id: string) {
    return this.leadService.remove(id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('lead/admin/funnel')
  adminFunnel(@Query('days') days?: string) {
    // Sessizce 30'a düşmek yerine geçersiz değeri açıkça reddet
    if (days !== undefined && days !== '7' && days !== '30') {
      throw new BadRequestException('days yalnızca 7 veya 30 olabilir')
    }
    return this.statsService.funnel(days === '7' ? 7 : 30)
  }
}
