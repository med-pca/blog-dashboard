import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { parsePage } from '../common/pagination'
import { parseDateRange } from '../common/date-range'
import { AiContentConfig } from './ai-content.config'
import { AiCampaignService } from './ai-campaign.service'
import { AiContentService } from './ai-content.service'
import { AiJobsService } from './ai-jobs.service'
import { AiSchedulerService } from './ai-scheduler.service'
import { CreateAiCampaignDto } from './dto/create-ai-campaign.dto'
import { UpdateAiCampaignDto } from './dto/update-ai-campaign.dto'
import { evaluateWindow } from './lib/schedule'
import type { AiJobStatus, AiJobTrigger } from './entities/ai-generation-job.entity'

const JOB_STATUSES: AiJobStatus[] = ['queued', 'running', 'succeeded', 'failed', 'cancelled']
const JOB_TRIGGERS: AiJobTrigger[] = ['scheduled', 'manual', 'retry', 'test']

// Every route here is admin-only. The guard sits on the class so a new route
// cannot be added without it.
@UseGuards(JwtAuthGuard)
@Controller('ai-content')
export class AiContentController {
  constructor(
    private readonly campaigns: AiCampaignService,
    private readonly content: AiContentService,
    private readonly jobs: AiJobsService,
    private readonly scheduler: AiSchedulerService,
    private readonly config: AiContentConfig,
  ) {}

  // Lets the panel explain *why* generation is off without ever exposing the key.
  @Get('status')
  status() {
    return {
      enabled: this.config.enabled,
      model: this.config.model,
      dailyMaxPerCampaign: this.config.dailyMaxPerCampaign,
      defaultIntervalMinutes: this.config.defaultIntervalMinutes,
      workerConcurrency: this.config.workerConcurrency,
      unavailableReason: this.config.unavailableReason(),
    }
  }

  @Get('campaigns')
  listCampaigns() {
    return this.campaigns.listWithCounters()
  }

  @Post('campaigns')
  createCampaign(@Body() dto: CreateAiCampaignDto) {
    return this.campaigns.create(dto)
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.findById(id)
  }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAiCampaignDto) {
    return this.campaigns.update(id, dto)
  }

  @Delete('campaigns/:id')
  @HttpCode(204)
  removeCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.remove(id)
  }

  @Post('campaigns/:id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.setEnabled(id, true)
  }

  // Same transition as activate; kept separate because the panel labels them
  // differently and the audit trail reads better.
  @Post('campaigns/:id/resume')
  resume(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.setEnabled(id, true)
  }

  @Post('campaigns/:id/pause')
  pause(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.setEnabled(id, false)
  }

  @Get('campaigns/:id/stats')
  stats(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.stats(id)
  }

  @Get('campaigns/:id/drafts')
  drafts(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.draftsForCampaign(id)
  }

  // One draft outside the rotation: does not move the daily counter and does
  // not shift nextGenerationAt.
  @Post('campaigns/:id/test')
  test(@Param('id', ParseUUIDPipe) id: string) {
    return this.enqueueOnDemand(id, 'test')
  }

  // Pulls the next scheduled article forward; counts against today's target.
  @Post('campaigns/:id/generate-now')
  generateNow(@Param('id', ParseUUIDPipe) id: string) {
    return this.enqueueOnDemand(id, 'manual')
  }

  @Get('jobs')
  listJobs(
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: string,
    @Query('triggerType') triggerType?: string,
    @Query('page') page?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.jobs.findAll({
      campaignId: campaignId || undefined,
      status: JOB_STATUSES.includes(status as AiJobStatus) ? (status as AiJobStatus) : undefined,
      triggerType: JOB_TRIGGERS.includes(triggerType as AiJobTrigger) ? (triggerType as AiJobTrigger) : undefined,
      page: parsePage(page),
      range: parseDateRange(from, to),
    })
  }

  // Re-runs a failed job as a fresh row so the original failure stays readable.
  @Post('jobs/:id/retry')
  async retry(@Param('id', ParseUUIDPipe) id: string) {
    this.assertAvailable()
    const job = await this.jobs.findById(id)
    if (job.status !== 'failed' && job.status !== 'cancelled') {
      throw new BadRequestException('Only failed or cancelled jobs can be retried')
    }
    const campaign = await this.campaigns.findById(job.campaignId)
    const created = await this.scheduler.enqueueJob(
      campaign,
      new Date(),
      'retry',
      `retry:${job.id}:${Date.now()}`,
    )
    if (!created) throw new ConflictException('Could not queue the retry; try again in a moment')
    return created
  }

  private async enqueueOnDemand(campaignId: string, triggerType: 'manual' | 'test') {
    this.assertAvailable()
    const campaign = await this.campaigns.findById(campaignId)

    const schedule = evaluateWindow(campaign)
    if (triggerType === 'manual' && !campaign.enabled) {
      throw new BadRequestException('Activate the campaign before generating its next article')
    }

    const active = await this.jobs.countActive(campaign.id)
    if (active > 0) {
      throw new ConflictException('A generation is already in flight for this campaign')
    }

    const created = await this.scheduler.enqueueJob(
      campaign,
      new Date(),
      triggerType,
      `${triggerType}:${campaign.id}:${Date.now()}`,
    )
    if (!created) throw new ConflictException('Could not queue the generation; try again in a moment')
    return { job: created, schedule }
  }

  private assertAvailable(): void {
    const reason = this.config.unavailableReason()
    if (reason) throw new ServiceUnavailableException(reason)
  }
}
