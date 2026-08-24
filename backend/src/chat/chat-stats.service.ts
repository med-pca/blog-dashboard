import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, Repository } from 'typeorm'
import { ChatDailyStat } from './entities/chat-daily-stat.entity'
import { ChatLead } from './entities/chat-lead.entity'
import { ChatRating } from './entities/chat-rating.entity'

export interface FunnelStats {
  days: number
  opened: number
  messaged: number
  assisted: number
  rated: number
}

@Injectable()
export class ChatStatsService {
  constructor(
    @InjectRepository(ChatDailyStat)
    private dailyRepo: Repository<ChatDailyStat>,
    @InjectRepository(ChatLead)
    private leadRepo: Repository<ChatLead>,
    @InjectRepository(ChatRating)
    private ratingRepo: Repository<ChatRating>,
  ) {}

  async recordOpen(): Promise<void> {
    await this.dailyRepo.query(
      `INSERT INTO "chat_daily_stats" ("date", "opened") VALUES (CURRENT_DATE, 1)
       ON CONFLICT ("date") DO UPDATE SET "opened" = "chat_daily_stats"."opened" + 1`,
    )
  }

  async funnel(days: number): Promise<FunnelStats> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const [openedRows, messaged, assisted, rated] = await Promise.all([
      this.dailyRepo.query(
        `SELECT COALESCE(SUM("opened"), 0)::int AS total FROM "chat_daily_stats" WHERE "date" >= $1::date`,
        [since.toISOString().slice(0, 10)],
      ),
      this.leadRepo.count({ where: { createdAt: MoreThanOrEqual(since) } }),
      this.leadRepo.count({ where: { createdAt: MoreThanOrEqual(since), status: 'assisted' } }),
      this.ratingRepo.count({ where: { createdAt: MoreThanOrEqual(since) } }),
    ])
    return { days, opened: openedRows[0]?.total ?? 0, messaged, assisted, rated }
  }
}
