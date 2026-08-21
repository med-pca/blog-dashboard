import { ValidationPipe, RequestMethod } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

// main.ts ile e2e testleri aynı HTTP davranışını (güvenlik başlıkları, cookie
// parsing, DTO validasyonu, /api prefix'i) buradan paylaşır. CORS, Swagger,
// statik dosyalar ve DbLogger yalnızca main.ts'te kalır.
export function configureApp(app: NestExpressApplication): void {
  // Trust the first proxy hop (Nginx) so req.ip reflects the real client IP
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cookieParser())

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'sitemap.xml', method: RequestMethod.GET },
      { path: 'ads.txt', method: RequestMethod.GET },
    ],
  })
}
