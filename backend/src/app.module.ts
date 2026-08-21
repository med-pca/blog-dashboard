import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as Joi from 'joi'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { TerminusModule } from '@nestjs/terminus'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup'
import { LoggingMiddleware } from './common/logging.middleware'
import { RedisModule } from './redis/redis.module'
import { PublicCacheModule } from './common/public-cache.module'
import { AuthModule } from './auth/auth.module'
import { ProjectsModule } from './projects/projects.module'
import { UploadModule } from './upload/upload.module'
import { ReferencesModule } from './references/references.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { BlogModule } from './blog/blog.module'
import { FaqModule } from './faq/faq.module'
import { SitemapModule } from './sitemap/sitemap.module'
import { ChatModule } from './chat/chat.module'
import { QuoteModule } from './quote/quote.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { InstagramTokenModule } from './instagram-token/instagram-token.module'
import { GroqModule } from './groq/groq.module'
import { WeatherModule } from './weather/weather.module'
import { LogsModule } from './logs/logs.module'
import { AdsModule } from './ads/ads.module'
import { HealthController } from './health.controller'

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // Şema aynı zamanda env envanteri: uygulamanın okuduğu her değişken burada
      // listelenir. Boş string ".env'de boş bırakıldı = özellik kapalı" demektir,
      // bu yüzden opsiyonel string'lerde allow('') zorunlu.
      validationSchema: Joi.object({
        // ── Zorunlu ──
        JWT_SECRET: Joi.string().required(),
        APP_ENCRYPTION_KEY: Joi.string().pattern(/^[0-9a-f]{64}$/i).required(),
        DB_PASS: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        FRONTEND_URL: Joi.string().uri().required(),
        ADMIN_PASSWORD_HASH: Joi.string().required(),
        INSTAGRAM_APP_SECRET: Joi.string().required(),
        INSTAGRAM_WEBHOOK_VERIFY_TOKEN: Joi.string().required(),
        UMAMI_PASS: Joi.string().required(),
        // ── Default'lu (kodda kullanılan default'larla birebir aynı; empty('') =
        //    boş bırakılan değişken yazılmamış sayılır, default devreye girer) ──
        NODE_ENV: Joi.string().valid('development', 'production').empty('').default('development'),
        PORT: Joi.number().empty('').default(3001),
        DB_HOST: Joi.string().empty('').default('localhost'),
        DB_PORT: Joi.number().empty('').default(5432),
        DB_USER: Joi.string().empty('').default('postgres'),
        DB_NAME: Joi.string().empty('').default('renel_enerji'),
        JWT_EXPIRES_IN: Joi.string().empty('').default('8h'),
        ADMIN_USERNAME: Joi.string().empty('').default('admin'),
        UMAMI_USER: Joi.string().empty('').default('admin'),
        INSTAGRAM_HASHTAG: Joi.string().empty('').default('#proje'),
        GROQ_DAILY_LIMIT: Joi.number().integer().min(1).empty('').default(1000),
        // ── Opsiyonel (boşsa ilgili özellik devre dışı) ──
        // Virgüllü açık CORS origin listesi; boşsa FRONTEND_URL'den www türetilir
        CORS_ORIGINS: Joi.string().allow('').optional().custom((value: string, helpers) => {
          const bad = value
            .split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin !== '' && !/^https?:\/\/[^\s,/]+$/.test(origin.replace(/\/+$/, '')))
          if (bad.length > 0) {
            return helpers.message({ custom: `CORS_ORIGINS geçersiz origin içeriyor: ${bad.join(', ')}` })
          }
          return value
        }),
        UMAMI_URL: Joi.string().uri().allow('').optional(),
        UMAMI_WEBSITE_ID: Joi.string().allow('').optional(),
        OPENWEATHER_API_KEY: Joi.string().allow('').optional(),
        INSTAGRAM_ACCESS_TOKEN: Joi.string().allow('').optional(),
        INSTAGRAM_USER_ID: Joi.string().allow('').optional(),
        GROQ_API_KEY: Joi.string().allow('').optional(),
        GROQ_API_KEY_2: Joi.string().allow('').optional(),
        GROQ_API_KEY_3: Joi.string().allow('').optional(),
        GROQ_CHAT_KEYS: Joi.string().allow('').optional(),
        GROQ_PARSE_KEYS: Joi.string().allow('').optional(),
        SENTRY_DSN: Joi.string().allow('').optional(),
      }).custom((env: Record<string, string | undefined>, helpers) => {
        // Chatbot canlı sitenin parçası: yeni liste ya da eski key'lerden en az
        // biri boot anında mevcut olmalı (GroqService.getKeys ile aynı öncelik)
        const has = (v?: string) => typeof v === 'string' && v.trim() !== ''
        if (!has(env.GROQ_CHAT_KEYS) && !has(env.GROQ_API_KEY_3) && !has(env.GROQ_API_KEY)) {
          return helpers.message({ custom: 'GROQ_CHAT_KEYS veya GROQ_API_KEY(_3) tanımlı olmalı' })
        }
        if (!has(env.GROQ_PARSE_KEYS) && !has(env.GROQ_API_KEY)) {
          return helpers.message({ custom: 'GROQ_PARSE_KEYS veya GROQ_API_KEY tanımlı olmalı' })
        }
        return env
      }),
      validationOptions: { allowUnknown: true },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ ttl: 60000, limit: 60 }],
        getTracker: (req: { ip?: string; connection?: { remoteAddress?: string } }) =>
          req.ip ?? req.connection?.remoteAddress ?? 'unknown',
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USER', 'postgres'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME', 'renel_enerji'),
        autoLoadEntities: true,
        // Şema yalnızca migration'larla yönetilir (Baseline dahil); synchronize asla açılmaz
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
    }),
    TerminusModule,
    RedisModule,
    PublicCacheModule,
    AuthModule,
    ProjectsModule,
    UploadModule,
    ReferencesModule,
    AnalyticsModule,
    BlogModule,
    FaqModule,
    SitemapModule,
    ChatModule,
    QuoteModule,
    WebhooksModule,
    InstagramTokenModule,
    GroqModule,
    WeatherModule,
    LogsModule,
    AdsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('{*splat}')
  }
}
