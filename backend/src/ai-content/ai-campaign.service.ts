import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, IsNull, MoreThan, Repository } from 'typeorm'
import { AiContentConfig } from './ai-content.config'
import { AiCampaignStatus, AiContentCampaign } from './entities/ai-content-campaign.entity'
import { AiGenerationJob } from './entities/ai-generation-job.entity'
import { CreateAiCampaignDto } from './dto/create-ai-campaign.dto'
import { UpdateAiCampaignDto } from './dto/update-ai-campaign.dto'
import { clampIntoWindow, evaluateWindow, isValidTimezone } from './lib/schedule'
import type { CampaignStats } from './types/ai-content.types'

const DAY_MS = 24 * 60 * 60 * 1000

const DEFAULTS = {
  language: 'English',
  tone: 'friendly and practical',
  targetWords: 1200,
  dailyTarget: 2,
  generationStartHour: 8,
  generationEndHour: 22,
  timezone: 'UTC',
}

@Injectable()
export class AiCampaignService {
  constructor(
    @InjectRepository(AiContentCampaign) private readonly campaigns: Repository<AiContentCampaign>,
    @InjectRepository(AiGenerationJob) private readonly jobs: Repository<AiGenerationJob>,
    private readonly config: AiContentConfig,
  ) {}

  findAll(): Promise<AiContentCampaign[]> {
    return this.campaigns.find({ where: { archivedAt: IsNull() }, order: { createdAt: 'DESC' } })
  }

  async findById(id: string): Promise<AiContentCampaign> {
    const campaign = await this.campaigns.findOne({ where: { id } })
    if (!campaign) throw new NotFoundException('Campaign not found')
    return campaign
  }

  async create(dto: CreateAiCampaignDto): Promise<AiContentCampaign> {
    const draft = this.campaigns.create({
      ...DEFAULTS,
      intervalMinutes: this.config.defaultIntervalMinutes,
      ...stripUndefined(dto),
      keywords: dto.keywords ?? [],
      generatedToday: 0,
      generatedTodayDate: null,
    })
    this.assertConsistent(draft)
    draft.status = draft.enabled ? 'active' : 'paused'
    draft.nextGenerationAt = draft.enabled ? clampIntoWindow(new Date(), draft) : null
    return this.campaigns.save(draft)
  }

  async update(id: string, dto: UpdateAiCampaignDto): Promise<AiContentCampaign> {
    const campaign = await this.findById(id)
    if (campaign.archivedAt) throw new BadRequestException('Archived campaigns cannot be edited')
    const wasEnabled = campaign.enabled
    Object.assign(campaign, stripUndefined(dto))
    this.assertConsistent(campaign)

    if (dto.enabled !== undefined && dto.enabled !== wasEnabled) {
      campaign.status = dto.enabled ? 'active' : 'paused'
    }
    // Re-open the schedule when the campaign becomes runnable, or when the
    // window moved and the stored slot now falls outside it.
    if (campaign.enabled && campaign.status === 'active') {
      const base = campaign.nextGenerationAt ?? new Date()
      campaign.nextGenerationAt = clampIntoWindow(base > new Date() ? base : new Date(), campaign)
    }
    return this.campaigns.save(campaign)
  }

  // Activate/resume share one path: both mean "run from now on".
  async setEnabled(id: string, enabled: boolean): Promise<AiContentCampaign> {
    const campaign = await this.findById(id)
    if (campaign.archivedAt) throw new BadRequestException('Archived campaigns cannot be resumed')
    campaign.enabled = enabled
    campaign.status = enabled ? 'active' : 'paused'
    campaign.nextGenerationAt = enabled ? clampIntoWindow(new Date(), campaign) : null
    return this.campaigns.save(campaign)
  }

  // The admin's delete action is intentionally a soft delete. It removes the
  // campaign from the active workspace without losing drafts or job history.
  async remove(id: string): Promise<void> {
    const campaign = await this.findById(id)
    campaign.enabled = false
    campaign.status = 'paused'
    campaign.nextGenerationAt = null
    campaign.archivedAt = new Date()
    await this.campaigns.save(campaign)
  }

  async stats(id: string): Promise<CampaignStats> {
    const campaign = await this.findById(id)
    const since = new Date(Date.now() - DAY_MS)

    const [queued, running, failed24h, succeeded24h, totalDrafts, totals] = await Promise.all([
      this.jobs.count({ where: { campaignId: id, status: 'queued' } }),
      this.jobs.count({ where: { campaignId: id, status: 'running' } }),
      this.jobs.count({ where: { campaignId: id, status: 'failed', createdAt: MoreThan(since) } }),
      this.jobs.count({ where: { campaignId: id, status: 'succeeded', createdAt: MoreThan(since) } }),
      this.jobs.count({ where: { campaignId: id, status: 'succeeded' } }),
      this.jobs
        .createQueryBuilder('job')
        .select('COALESCE(SUM(job."inputTokens"), 0)', 'inputTokens')
        .addSelect('COALESCE(SUM(job."outputTokens"), 0)', 'outputTokens')
        .addSelect('COALESCE(SUM(job."estimatedCost"), 0)', 'estimatedCost')
        .where('job."campaignId" = :id', { id })
        .getRawOne<{ inputTokens: string; outputTokens: string; estimatedCost: string }>(),
    ])

    const limit = this.effectiveDailyTarget(campaign)
    return {
      campaignId: campaign.id,
      status: campaign.status,
      enabled: campaign.enabled,
      dailyTarget: limit,
      generatedToday: campaign.generatedToday,
      remainingToday: Math.max(0, limit - campaign.generatedToday),
      queued,
      running,
      failed24h,
      succeeded24h,
      totalDrafts,
      nextGenerationAt: campaign.nextGenerationAt ? campaign.nextGenerationAt.toISOString() : null,
      lastGenerationAt: campaign.lastGenerationAt ? campaign.lastGenerationAt.toISOString() : null,
      lastRunAt: campaign.lastRunAt ? campaign.lastRunAt.toISOString() : null,
      inputTokens: Number(totals?.inputTokens ?? 0),
      outputTokens: Number(totals?.outputTokens ?? 0),
      estimatedCost: Math.round(Number(totals?.estimatedCost ?? 0) * 1e6) / 1e6,
      schedule: evaluateWindow(campaign),
      unavailableReason: this.config.unavailableReason(),
    }
  }

  effectiveDailyTarget(campaign: AiContentCampaign): number {
    return Math.min(campaign.dailyTarget, this.config.dailyMaxPerCampaign)
  }

  // Cross-field rules the DTO cannot express on its own.
  private assertConsistent(campaign: AiContentCampaign): void {
    if (campaign.generationStartHour >= campaign.generationEndHour) {
      throw new BadRequestException(
        'generationStartHour must be earlier than generationEndHour (overnight windows are not supported)',
      )
    }
    if (!isValidTimezone(campaign.timezone)) {
      throw new BadRequestException('timezone must be a valid IANA time zone')
    }
    const max = this.config.dailyMaxPerCampaign
    if (campaign.dailyTarget > max) {
      throw new BadRequestException(`dailyTarget cannot exceed AI_DAILY_MAX_PER_CAMPAIGN (${max})`)
    }
  }

  // Campaign summary used by the list screen: one query instead of one stats
  // call per row.
  async listWithCounters(): Promise<Array<AiContentCampaign & { queued: number; running: number }>> {
    const campaigns = await this.findAll()
    if (!campaigns.length) return []
    const rows = await this.jobs
      .createQueryBuilder('job')
      .select('job."campaignId"', 'campaignId')
      .addSelect('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('job."campaignId" IN (:...ids)', { ids: campaigns.map(c => c.id) })
      .andWhere('job.status IN (:...open)', { open: ['queued', 'running'] })
      .groupBy('job."campaignId"')
      .addGroupBy('job.status')
      .getRawMany<{ campaignId: string; status: string; count: string }>()

    return campaigns.map(campaign => ({
      ...campaign,
      queued: Number(rows.find(r => r.campaignId === campaign.id && r.status === 'queued')?.count ?? 0),
      running: Number(rows.find(r => r.campaignId === campaign.id && r.status === 'running')?.count ?? 0),
    }))
  }

  // Campaigns the scheduler may act on this tick.
  runnable(): Promise<AiContentCampaign[]> {
    return this.campaigns.find({
      where: { enabled: true, status: In<AiCampaignStatus>(['active']) },
      order: { createdAt: 'ASC' },
    })
  }
}

function stripUndefined<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>
}
