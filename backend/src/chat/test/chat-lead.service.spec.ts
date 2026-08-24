import { Between, Repository } from 'typeorm'
import { ChatLeadService, isSubstantiveAnswer } from '../chat-lead.service'
import { FALLBACK_MESSAGE } from '../chat.service'
import { ChatLead } from '../entities/chat-lead.entity'

const SESSION = '3f2b8c1a-9d4e-4f6a-8b2c-1d3e5f7a9b0c'

function makeService() {
  const repo = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation(async (lead: ChatLead) => lead),
    create: jest.fn().mockImplementation((data: Partial<ChatLead>) => data as ChatLead),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<Repository<ChatLead>>
  return { service: new ChatLeadService(repo), repo }
}

describe('ChatLeadService', () => {
  describe('upsertFromChat', () => {
    it('sessionId yoksa hiçbir şey yapmaz', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(undefined, [{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }], 'cevap')
      expect(repo.save).not.toHaveBeenCalled()
    })

    it('tek kullanıcı mesajında lead oluşturmaz', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(SESSION, [{ role: 'user', content: 'merhaba' }], 'cevap')
      expect(repo.save).not.toHaveBeenCalled()
    })

    it('iki kullanıcı mesajında lead oluşturur, bot cevabını da dahil eder', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(
        SESSION,
        [
          { role: 'user', content: 'çatı ges' },
          { role: 'assistant', content: 'fatura?' },
          { role: 'user', content: '2500' },
        ],
        'şebeke bağlantısı?',
      )
      expect(repo.save).toHaveBeenCalledTimes(1)
      const saved = (repo.save as jest.Mock).mock.calls[0][0]
      expect(saved.sessionId).toBe(SESSION)
      expect(saved.messageCount).toBe(2)
      expect(saved.conversation).toHaveLength(4)
      expect(saved.conversation[3]).toEqual({ role: 'assistant', content: 'şebeke bağlantısı?' })
      // tek netleştirme sorusu konuşmayı tamamlamış saymaz
      expect(saved.status).toBe('active')
    })

    it('gerçek bir cevap verildiğinde lead assisted olur', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(
        SESSION,
        [
          { role: 'user', content: 'quick dinner?' },
          { role: 'assistant', content: 'How much time do you have?' },
          { role: 'user', content: '20 minutes' },
        ],
        'A sheet-pan chicken works in 20 minutes. Roast everything at 220 C and rest it briefly.',
      )
      expect((repo.save as jest.Mock).mock.calls[0][0].status).toBe('assisted')
    })

    it('sabit hizmet-dışı mesajı konuşmayı assisted yapmaz', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(
        SESSION,
        [
          { role: 'user', content: 'quick dinner?' },
          { role: 'assistant', content: 'How much time do you have?' },
          { role: 'user', content: '20 minutes' },
        ],
        FALLBACK_MESSAGE,
      )
      expect((repo.save as jest.Mock).mock.calls[0][0].status).toBe('active')
    })

    it('bir kez assisted olan lead sonraki soruda active\'e düşmez', async () => {
      const { service, repo } = makeService()
      const existing = { sessionId: SESSION, conversation: [], messageCount: 2, status: 'assisted' } as unknown as ChatLead
      ;(repo.findOne as jest.Mock).mockResolvedValue(existing)
      await service.upsertFromChat(
        SESSION,
        [
          { role: 'user', content: 'a' },
          { role: 'assistant', content: 'b' },
          { role: 'user', content: 'c' },
        ],
        'And what are you cooking tomorrow?',
      )
      expect(existing.status).toBe('assisted')
    })

    it('mevcut lead varsa yenisini açmaz, konuşmayı günceller', async () => {
      const { service, repo } = makeService()
      const existing = { sessionId: SESSION, conversation: [], messageCount: 2 } as unknown as ChatLead
      ;(repo.findOne as jest.Mock).mockResolvedValue(existing)
      await service.upsertFromChat(
        SESSION,
        [
          { role: 'user', content: 'a' },
          { role: 'assistant', content: 'b' },
          { role: 'user', content: 'c' },
          { role: 'assistant', content: 'd' },
          { role: 'user', content: 'e' },
        ],
        'cevap',
      )
      expect(repo.create).not.toHaveBeenCalled()
      expect(existing.messageCount).toBe(3)
      expect(existing.conversation).toHaveLength(6)
    })
  })

  describe('findAllWithStats', () => {
    it('filtresiz çağrıda boş where ile listeler, stats globaldir', async () => {
      const { service, repo } = makeService()
      ;(repo.count as jest.Mock)
        .mockResolvedValueOnce(60) // filtreli toplam (sayfa hesabı)
        .mockResolvedValueOnce(60) // stats.total
        .mockResolvedValueOnce(25) // stats.assisted
        .mockResolvedValueOnce(0) // stats.contactRequested
      const result = await service.findAllWithStats()
      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        order: { updatedAt: 'DESC' },
        take: 50,
        skip: 0,
      })
      expect(result.stats).toEqual({ total: 60, assisted: 25, contactRequested: 0, active: 35 })
      expect(result.pageCount).toBe(2)
    })

    it('status filtresi where\'e uygulanır, sayfa sayısı filtreli count\'tan gelir', async () => {
      const { service, repo } = makeService()
      ;(repo.count as jest.Mock)
        .mockResolvedValueOnce(3) // filtreli toplam
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(25)
      const result = await service.findAllWithStats(1, 'active')
      expect((repo.find as jest.Mock).mock.calls[0][0].where).toEqual({ status: 'active' })
      expect((repo.count as jest.Mock).mock.calls[0][0]).toEqual({ where: { status: 'active' } })
      expect(result.pageCount).toBe(1)
      // stats status filtresinden etkilenmez
      expect(result.stats.total).toBe(60)
    })

    it('tarih aralığı createdAt üzerinden filtrelenir, status ile birleşir', async () => {
      const { service, repo } = makeService()
      const from = new Date('2026-07-01T00:00:00.000Z')
      const to = new Date('2026-07-15T23:59:59.999Z')
      await service.findAllWithStats(1, 'assisted', { from, to })
      expect((repo.find as jest.Mock).mock.calls[0][0].where).toEqual({
        status: 'assisted',
        createdAt: Between(from, to),
      })
    })
  })

  describe('isSubstantiveAnswer', () => {
    it('tek netleştirme sorusunu cevap saymaz', () => {
      expect(isSubstantiveAnswer('How many servings do you cook for?')).toBe(false)
      expect(isSubstantiveAnswer('   ')).toBe(false)
      expect(isSubstantiveAnswer(FALLBACK_MESSAGE)).toBe(false)
    })

    it('cevap + takip sorusunu cevap sayar', () => {
      expect(
        isSubstantiveAnswer('Roast them at 220 C for 25 minutes. Want a vegetarian version?'),
      ).toBe(true)
      expect(isSubstantiveAnswer('Use 100 g of pasta per person.')).toBe(true)
    })
  })

  describe('attachRating', () => {
    it('sessionId yoksa update çağrılmaz', async () => {
      const { service, repo } = makeService()
      await service.attachRating(undefined, 5)
      expect(repo.update).not.toHaveBeenCalled()
    })

    it('puanı lead\'e işler', async () => {
      const { service, repo } = makeService()
      await service.attachRating(SESSION, 3)
      expect(repo.update).toHaveBeenCalledWith({ sessionId: SESSION }, { rating: 3 })
    })
  })
})
