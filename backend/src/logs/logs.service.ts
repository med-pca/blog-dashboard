import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Cron } from '@nestjs/schedule'
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm'
import { AppLog, LogLevel } from './entities/app-log.entity'
import { DateRange, dateRangeOperator } from '../common/date-range'

// Loglar sayfasında gösterilen saklama süresi; değişirse purge cron'u ile senkron kalmalı
export const LOG_RETENTION_INTERVAL = '30 days'

const MESSAGE_LIMIT = 4000
const PAGE_SIZE = 50
const DAY_MS = 24 * 60 * 60 * 1000

// Hata fırtınası koruması: aynı mesaj+context bu pencere içinde tekrar yazılmaz
// (Redis/sağlayıcı kesintisinde saniyede onlarca özdeş satır DB'ye akıyordu)
const DEDUPE_WINDOW_MS = 10_000
const DEDUPE_MAX_KEYS = 500

export interface LogStats {
  total: number
  errors24h: number
  warns24h: number
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name)

  constructor(
    @InjectRepository(AppLog)
    private repo: Repository<AppLog>,
  ) {}

  // Tek instance çalıştığı için in-memory yeterli; anahtar sayısı sınırlanıp
  // süresi geçen girdiler budanır ki kesinti anındaki sel Map'i şişirmesin
  private readonly recentLogs = new Map<string, number>()

  private isDuplicate(key: string): boolean {
    const now = Date.now()
    const last = this.recentLogs.get(key)
    if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return true

    if (this.recentLogs.size >= DEDUPE_MAX_KEYS) {
      for (const [k, t] of this.recentLogs) {
        if (now - t >= DEDUPE_WINDOW_MS) this.recentLogs.delete(k)
      }
    }
    this.recentLogs.set(key, now)
    return false
  }

  // DİKKAT: DbLogger'ın error/warn kancasından çağrılıyor. Burada Nest Logger
  // KULLANILMAZ — sonsuz döngü oluşur. Kendi hataları console'a yazılır.
  async record(level: LogLevel, message: string, context?: string): Promise<void> {
    const trimmed = message.slice(0, MESSAGE_LIMIT)
    if (this.isDuplicate(`${level}|${context ?? ''}|${trimmed}`)) return

    try {
      await this.repo.insert({
        level,
        context: context ?? null,
        message: trimmed,
      })
    } catch (err) {
      console.error('Log kaydı yazılamadı:', err instanceof Error ? err.message : err)
    }
  }

  async findAllWithStats(
    level?: LogLevel,
    page = 1,
    range: DateRange = {},
  ): Promise<{ stats: LogStats; logs: AppLog[]; page: number; pageCount: number }> {
    const cutoff = new Date(Date.now() - DAY_MS)
    const where: FindOptionsWhere<AppLog> = {}
    if (level) where.level = level
    const createdAt = dateRangeOperator(range)
    if (createdAt) where.createdAt = createdAt
    const [logs, filteredTotal, total, errors24h, warns24h] = await Promise.all([
      this.repo.find({
        where,
        order: { createdAt: 'DESC' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      // Sayfa sayısı aktif level filtresine göre hesaplanır; stats.total ise
      // her zaman tüm kayıtları gösterir
      this.repo.count({ where }),
      this.repo.count(),
      this.repo.count({ where: { level: 'error', createdAt: MoreThan(cutoff) } }),
      this.repo.count({ where: { level: 'warn', createdAt: MoreThan(cutoff) } }),
    ])
    return {
      stats: { total, errors24h, warns24h },
      logs,
      page,
      pageCount: Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE)),
    }
  }

  @Cron('30 4 * * *')
  async purgeOldLogs(): Promise<void> {
    try {
      const result = await this.repo
        .createQueryBuilder()
        .delete()
        .where('"createdAt" < now() - :retention::interval', { retention: LOG_RETENTION_INTERVAL })
        .execute()
      if ((result.affected ?? 0) > 0) {
        this.logger.log(`Log temizliği: ${result.affected} eski kayıt silindi`)
      }
    } catch (err) {
      this.logger.error(`Log temizliği başarısız: ${err instanceof Error ? err.message : err}`)
    }
  }
}
