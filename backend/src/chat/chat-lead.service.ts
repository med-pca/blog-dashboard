import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Repository } from 'typeorm'
import { ChatLead, ChatLeadStatus } from './entities/chat-lead.entity'
import { ChatMessage, FALLBACK_MESSAGE } from './chat.service'
import { DateRange, dateRangeOperator } from '../common/date-range'

export interface LeadStats {
  total: number
  active: number
  assisted: number
  contactRequested: number
}

// Bir konuşmanın "lead" sayılması için gereken kullanıcı mesajı sayısı
// (chatbot'ta değerlendirme sorulan eşikle aynı)
const LEAD_USER_MESSAGE_THRESHOLD = 2

// Modelin mesaj üretmiş olması tek başına "bu konuşma işe yaradı" demek değil:
// tek bir netleştirme sorusu ya da sabit hizmet-dışı mesajı konuşmayı 'active'
// bırakır. Gerçek bir cevap verildiyse lead 'assisted' olur.
export function isSubstantiveAnswer(reply: string): boolean {
  const text = reply.trim()
  if (!text || text === FALLBACK_MESSAGE) return false
  const sentences = text.split(/[.!?]+/).map(part => part.trim()).filter(Boolean)
  // Soru işaretiyle biten tek cümle = netleştirme sorusu, cevap değil.
  return sentences.length > 1 || !text.endsWith('?')
}

const PAGE_SIZE = 50

@Injectable()
export class ChatLeadService {
  constructor(
    @InjectRepository(ChatLead)
    private repo: Repository<ChatLead>,
  ) {}

  async upsertFromChat(sessionId: string | undefined, messages: ChatMessage[], reply: string): Promise<void> {
    if (!sessionId) return
    const messageCount = messages.filter(m => m.role === 'user').length
    if (messageCount < LEAD_USER_MESSAGE_THRESHOLD) return

    const conversation = [...messages, { role: 'assistant' as const, content: reply }]
    const assisted = isSubstantiveAnswer(reply)
    const existing = await this.repo.findOne({ where: { sessionId } })
    if (existing) {
      existing.conversation = conversation
      existing.messageCount = messageCount
      // Statü yalnızca yukarı gider: bir kez cevap alınmış konuşma, sonraki
      // netleştirme sorusu yüzünden 'active'e düşmez.
      if (assisted && existing.status === 'active') existing.status = 'assisted'
      await this.repo.save(existing)
    } else {
      await this.repo.save(
        this.repo.create({ sessionId, conversation, messageCount, status: assisted ? 'assisted' : 'active' }),
      )
    }
  }

  async attachRating(sessionId: string | undefined, rating: number): Promise<void> {
    if (!sessionId) return
    await this.repo.update({ sessionId }, { rating })
  }

  async remove(id: string): Promise<void> {
    const lead = await this.repo.findOne({ where: { id } })
    if (!lead) throw new NotFoundException('Talep bulunamadı')
    await this.repo.remove(lead)
  }

  async findAllWithStats(
    page = 1,
    status?: ChatLeadStatus,
    range: DateRange = {},
  ): Promise<{ stats: LeadStats; leads: ChatLead[]; page: number; pageCount: number }> {
    // Tarih filtresi createdAt üzerinden (talebin geldiği tarih); sıralama
    // updatedAt DESC kalır. Stats her zaman global — logs level deseniyle aynı.
    const where: FindOptionsWhere<ChatLead> = {}
    if (status) where.status = status
    const createdAt = dateRangeOperator(range)
    if (createdAt) where.createdAt = createdAt

    const [leads, filteredTotal, total, assisted, contactRequested] = await Promise.all([
      this.repo.find({ where, order: { updatedAt: 'DESC' }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
      this.repo.count({ where }),
      this.repo.count(),
      this.repo.count({ where: { status: 'assisted' } }),
      this.repo.count({ where: { status: 'contact_requested' } }),
    ])
    return {
      stats: { total, assisted, contactRequested, active: total - assisted - contactRequested },
      leads,
      page,
      pageCount: Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE)),
    }
  }
}
