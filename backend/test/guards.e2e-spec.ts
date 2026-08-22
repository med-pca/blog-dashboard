import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { createE2eApp } from './e2e-utils'

// Temsilci korumalı endpoint'ler: her modülden en az bir admin rotası.
// Cookie'siz istek 401 dönmeli — guard'ın unutulduğu bir rota buraya
// eklendiğinde bu test onu yakalar.
const PROTECTED_ROUTES: Array<['get' | 'post' | 'patch' | 'delete', string]> = [
  ['get', '/api/auth/me'],
  ['get', '/api/auth/2fa/status'],
  ['get', '/api/auth/2fa/setup'],
  ['post', '/api/auth/logout'],
  ['patch', '/api/auth/credentials'],
  ['post', '/api/blog'],
  ['get', '/api/blog/admin/all'],
  ['get', '/api/chat/lead/admin/all'],
  ['get', '/api/chat/rating/admin/all'],
  ['get', '/api/chat/lead/admin/funnel'],
  ['get', '/api/ai-content/status'],
  ['get', '/api/ai-content/campaigns'],
  ['post', '/api/ai-content/campaigns'],
  ['get', '/api/ai-content/jobs'],
  // AI auto-fill spends money at the model vendor: it must never be anonymous.
  ['post', '/api/projects/admin/parse-instagram'],
]

describe('JWT guard coverage (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>

  beforeAll(async () => {
    app = await createE2eApp()
    server = app.getHttpServer()
  })

  afterAll(async () => {
    await app.close()
  })

  it.each(PROTECTED_ROUTES)('%s %s returns 401 without a cookie', async (method, path) => {
    await request(server)[method](path).expect(401)
  })

  it('public endpoints stay reachable without a cookie', async () => {
    await request(server).get('/api/blog').expect(200)
    await request(server).get('/api/health').expect(200)
  })
})
