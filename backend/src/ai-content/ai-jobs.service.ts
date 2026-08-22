import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, In, Repository } from 'typeorm'
import { DateRange, dateRangeOperator } from '../common/date-range'
import { AiGenerationJob, type AiJobStatus, type AiJobTrigger } from './entities/ai-generation-job.entity'

export const JOBS_PAGE_SIZE = 25

export interface JobQuery {
  campaignId?: string
  status?: AiJobStatus
  triggerType?: AiJobTrigger
  page: number
  range: DateRange
}

export interface JobPage {
  jobs: AiGenerationJob[]
  page: number
  pageCount: number
  total: number
}

// Read model behind the "AI Generation Logs" screen. Paginated in the database:
// a busy instance accumulates one row per attempt, per campaign, per day.
@Injectable()
export class AiJobsService {
  constructor(@InjectRepository(AiGenerationJob) private readonly jobs: Repository<AiGenerationJob>) {}

  async findAll(query: JobQuery): Promise<JobPage> {
    const where: FindOptionsWhere<AiGenerationJob> = {}
    if (query.campaignId) where.campaignId = query.campaignId
    if (query.status) where.status = query.status
    if (query.triggerType) where.triggerType = query.triggerType
    const createdAt = dateRangeOperator(query.range)
    if (createdAt) where.createdAt = createdAt

    const [jobs, total] = await this.jobs.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: JOBS_PAGE_SIZE,
      skip: (query.page - 1) * JOBS_PAGE_SIZE,
      relations: { campaign: true },
    })

    return {
      // The campaign relation is only needed for its name in the table.
      jobs: jobs.map(job => ({ ...job, campaign: job.campaign ? ({ id: job.campaign.id, name: job.campaign.name } as AiGenerationJob['campaign']) : undefined })),
      page: query.page,
      pageCount: Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE)),
      total,
    }
  }

  async findById(id: string): Promise<AiGenerationJob> {
    const job = await this.jobs.findOne({ where: { id } })
    if (!job) throw new NotFoundException('Generation job not found')
    return job
  }

  countActive(campaignId: string): Promise<number> {
    return this.jobs.count({ where: { campaignId, status: In(['queued', 'running']) } })
  }
}
