import { NestExpressApplication } from '@nestjs/platform-express'
import { DataSource } from 'typeorm'
import request from 'supertest'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'
import { QuoteRequest } from '../src/quote/entities/quote-request.entity'

const VALID_BODY = {
  name: 'Mert Yılmaz',
  phone: '0554 379 60 04',
  city: 'Soma / Manisa',
  serviceType: 'cati-ges',
  monthlyBill: 1500,
  message: 'Çatıma güneş paneli yaptırmak istiyorum.',
  kvkkConsent: true,
}

describe('Quote requests (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let ds: DataSource
  let cookie: string

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
  })

  afterAll(async () => {
    await ds.getRepository(QuoteRequest).delete({ serviceType: 'cati-ges' })
    await app.close()
  })

  it('accepts a valid submission and stores it', async () => {
    const res = await request(server).post('/api/quote').send(VALID_BODY).expect(201)
    expect(res.body.id).toBeDefined()

    const saved = await ds.getRepository(QuoteRequest).findOne({ where: { id: res.body.id } })
    expect(saved?.phone).toBe('05543796004')
    expect(saved?.status).toBe('new')
    expect(saved?.kvkkConsent).toBe(true)
  })

  it('accepts an international phone number and keeps the country code', async () => {
    const res = await request(server)
      .post('/api/quote')
      .send({ ...VALID_BODY, phone: '+1 706 575 8955' })
      .expect(201)

    const saved = await ds.getRepository(QuoteRequest).findOne({ where: { id: res.body.id } })
    expect(saved?.phone).toBe('+17065758955')
  })

  it('rejects submission without kvkk consent', async () => {
    await request(server)
      .post('/api/quote')
      .send({ ...VALID_BODY, kvkkConsent: false })
      .expect(400)
  })

  it('rejects an invalid phone number', async () => {
    await request(server)
      .post('/api/quote')
      .send({ ...VALID_BODY, phone: '123' })
      .expect(400)
  })

  it('rejects an unknown service type', async () => {
    await request(server)
      .post('/api/quote')
      .send({ ...VALID_BODY, serviceType: 'ucan-daire' })
      .expect(400)
  })

  it('rejects when the honeypot field is filled', async () => {
    await request(server)
      .post('/api/quote')
      .send({ ...VALID_BODY, website: 'http://spamdomain.example' })
      .expect(400)
  })

  it('rejects admin list access without auth', async () => {
    await request(server).get('/api/quote/admin/all').expect(401)
  })

  it('lists submitted requests for an authenticated admin', async () => {
    const res = await request(server).get('/api/quote/admin/all').set('Cookie', cookie).expect(200)
    const names = (res.body.requests as QuoteRequest[]).map(r => r.name)
    expect(names).toContain('Mert Yılmaz')
    expect(res.body.stats.total).toBeGreaterThanOrEqual(1)
  })

  it('updates status and persists it', async () => {
    const created = await request(server).post('/api/quote').send(VALID_BODY).expect(201)

    await request(server)
      .patch(`/api/quote/admin/${created.body.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'contacted' })
      .expect(200)

    const saved = await ds.getRepository(QuoteRequest).findOne({ where: { id: created.body.id } })
    expect(saved?.status).toBe('contacted')
  })

  it('rejects delete without auth', async () => {
    await request(server).delete('/api/quote/admin/some-id').expect(401)
  })

  it('deletes a request', async () => {
    const created = await request(server).post('/api/quote').send(VALID_BODY).expect(201)

    await request(server).delete(`/api/quote/admin/${created.body.id}`).set('Cookie', cookie).expect(204)

    const saved = await ds.getRepository(QuoteRequest).findOne({ where: { id: created.body.id } })
    expect(saved).toBeNull()
  })

  // Bu blok en sona konur: ThrottlerGuard doğrulamadan önce çalıştığı için
  // yukarıdaki 400 dönen istekler de kotayı tüketir; kasıtlı olarak 429'a
  // değecek kadar tekrar ederek limitin gerçekten uygulandığını doğrular.
  it('throttles after repeated submissions from the same IP', async () => {
    let sawThrottled = false
    for (let i = 0; i < 15; i++) {
      const res = await request(server).post('/api/quote').send(VALID_BODY)
      if (res.status === 429) {
        sawThrottled = true
        break
      }
    }
    expect(sawThrottled).toBe(true)
  })
})
