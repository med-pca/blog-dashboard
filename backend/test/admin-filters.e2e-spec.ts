import { NestExpressApplication } from '@nestjs/platform-express'
import { DataSource } from 'typeorm'
import request from 'supertest'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'
import { AppLog } from '../src/logs/entities/app-log.entity'
import { ChatLead } from '../src/chat/entities/chat-lead.entity'

// 4.9 admin liste filtreleri: tarih penceresi ve status filtresi gerçek
// Postgres'te doğru alt kümeyi döndürmeli; geçersiz tarih 400'lemeli.
describe('Admin list filters (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let cookie: string
  let ds: DataSource

  const JUNE = new Date('2026-06-10T12:00:00.000Z')
  const JULY = new Date('2026-07-10T12:00:00.000Z')
  const WINDOW = 'from=2026-07-01T00:00:00.000Z&to=2026-07-31T23:59:59.999Z'

  const LEAD_SESSIONS = {
    juneActive: '11111111-1111-4111-8111-111111111111',
    julyActive: '22222222-2222-4222-8222-222222222222',
    julyAssisted: '33333333-3333-4333-8333-333333333333',
  }

  beforeAll(async () => {
    app = await createE2eApp()
    server = app.getHttpServer()
    ds = app.get(DataSource)
    await resetAdminConfig(app)
    await flushTestRedis(app)

    const login = await request(server)
      .post('/api/auth/login')
      .send({ username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD })
      .expect(201)
    cookie = extractAdminCookie(login.headers['set-cookie'])

    // createdAt açıkça verilir: @CreateDateColumn yalnızca değer yoksa doldurur
    const logs = ds.getRepository(AppLog)
    await logs.save([
      logs.create({ level: 'error', context: 'E2eFilterSeed', message: 'haziran hatası', createdAt: JUNE }),
      logs.create({ level: 'warn', context: 'E2eFilterSeed', message: 'temmuz uyarısı', createdAt: JULY }),
    ])

    const leads = ds.getRepository(ChatLead)
    await leads.save([
      leads.create({ sessionId: LEAD_SESSIONS.juneActive, conversation: null, messageCount: 2, status: 'active', createdAt: JUNE }),
      leads.create({ sessionId: LEAD_SESSIONS.julyActive, conversation: null, messageCount: 3, status: 'active', createdAt: JULY }),
      leads.create({ sessionId: LEAD_SESSIONS.julyAssisted, conversation: null, messageCount: 4, status: 'assisted', createdAt: JULY }),
    ])
  })

  afterAll(async () => {
    await ds.getRepository(AppLog).delete({ context: 'E2eFilterSeed' })
    for (const sessionId of Object.values(LEAD_SESSIONS)) {
      await ds.getRepository(ChatLead).delete({ sessionId })
    }
    await app.close()
  })

  describe('GET /api/logs/admin/all', () => {
    it('tarih penceresi yalnızca penceredeki kayıtları döndürür', async () => {
      const res = await request(server)
        .get(`/api/logs/admin/all?${WINDOW}`)
        .set('Cookie', cookie)
        .expect(200)
      const messages = (res.body.logs as AppLog[]).map(l => l.message)
      expect(messages).toContain('temmuz uyarısı')
      expect(messages).not.toContain('haziran hatası')
    })

    it('tarih ve level filtreleri birlikte çalışır', async () => {
      const res = await request(server)
        .get(`/api/logs/admin/all?level=error&${WINDOW}`)
        .set('Cookie', cookie)
        .expect(200)
      const seeded = (res.body.logs as AppLog[]).filter(l => l.context === 'E2eFilterSeed')
      expect(seeded).toHaveLength(0) // penceredeki tek seed kaydı warn
    })

    it('geçersiz tarih 400 döner', async () => {
      await request(server)
        .get('/api/logs/admin/all?from=dun')
        .set('Cookie', cookie)
        .expect(400)
    })
  })

  describe('GET /api/chat/lead/admin/all', () => {
    it('status filtresi yalnızca o statüdeki talepleri döndürür', async () => {
      const res = await request(server)
        .get('/api/chat/lead/admin/all?status=assisted')
        .set('Cookie', cookie)
        .expect(200)
      const sessions = (res.body.leads as ChatLead[]).map(l => l.sessionId)
      expect(sessions).toContain(LEAD_SESSIONS.julyAssisted)
      expect(sessions).not.toContain(LEAD_SESSIONS.juneActive)
      expect(sessions).not.toContain(LEAD_SESSIONS.julyActive)
    })

    it('tarih penceresi createdAt üzerinden filtreler, stats global kalır', async () => {
      const res = await request(server)
        .get(`/api/chat/lead/admin/all?${WINDOW}`)
        .set('Cookie', cookie)
        .expect(200)
      const sessions = (res.body.leads as ChatLead[]).map(l => l.sessionId)
      expect(sessions).toContain(LEAD_SESSIONS.julyActive)
      expect(sessions).toContain(LEAD_SESSIONS.julyAssisted)
      expect(sessions).not.toContain(LEAD_SESSIONS.juneActive)
      expect(res.body.stats.total).toBeGreaterThanOrEqual(3)
    })

    it('status ve tarih birlikte uygulanır', async () => {
      const res = await request(server)
        .get(`/api/chat/lead/admin/all?status=active&${WINDOW}`)
        .set('Cookie', cookie)
        .expect(200)
      const sessions = (res.body.leads as ChatLead[]).map(l => l.sessionId)
      expect(sessions).toEqual([LEAD_SESSIONS.julyActive])
    })

    it('ters aralık 400 döner', async () => {
      await request(server)
        .get('/api/chat/lead/admin/all?from=2026-07-31T00:00:00.000Z&to=2026-07-01T00:00:00.000Z')
        .set('Cookie', cookie)
        .expect(400)
    })
  })
})
