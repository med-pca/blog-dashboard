import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Repository } from 'typeorm'
import { QuoteRequest, QuoteStatus } from './entities/quote-request.entity'
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto'
import { DateRange, dateRangeOperator } from '../common/date-range'
import { sanitizeContent } from '../chat/chat-guards'

export interface QuoteStats {
  total: number
  new: number
  replied: number
  closed: number
}

const PAGE_SIZE = 50

@Injectable()
export class QuoteService {
  constructor(
    @InjectRepository(QuoteRequest)
    private repo: Repository<QuoteRequest>,
  ) {}

  async create(dto: CreateQuoteRequestDto): Promise<QuoteRequest> {
    return this.repo.save(
      this.repo.create({
        name: dto.name.trim(),
        email: dto.email,
        message: dto.message ? sanitizeContent(dto.message) : null,
        kvkkConsent: dto.kvkkConsent,
        consentAt: new Date(),
      }),
    )
  }

  async updateStatus(id: string, status: QuoteStatus): Promise<QuoteRequest> {
    const request = await this.repo.findOne({ where: { id } })
    if (!request) throw new NotFoundException('Talep bulunamadı')
    request.status = status
    return this.repo.save(request)
  }

  async remove(id: string): Promise<void> {
    const request = await this.repo.findOne({ where: { id } })
    if (!request) throw new NotFoundException('Talep bulunamadı')
    await this.repo.remove(request)
  }

  async findAllWithStats(
    page = 1,
    status?: QuoteStatus,
    range: DateRange = {},
  ): Promise<{ stats: QuoteStats; requests: QuoteRequest[]; page: number; pageCount: number }> {
    // Tarih filtresi createdAt üzerinden; sıralama en yeni talep önde.
    // Stats her zaman global — chat-lead/logs deseniyle aynı.
    const where: FindOptionsWhere<QuoteRequest> = {}
    if (status) where.status = status
    const createdAt = dateRangeOperator(range)
    if (createdAt) where.createdAt = createdAt

    const [requests, filteredTotal, total, newCount, replied, closed] = await Promise.all([
      this.repo.find({ where, order: { createdAt: 'DESC' }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
      this.repo.count({ where }),
      this.repo.count(),
      this.repo.count({ where: { status: 'new' } }),
      this.repo.count({ where: { status: 'replied' } }),
      this.repo.count({ where: { status: 'closed' } }),
    ])
    return {
      stats: { total, new: newCount, replied, closed },
      requests,
      page,
      pageCount: Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE)),
    }
  }
}
