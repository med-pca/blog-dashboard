import { NotFoundException } from '@nestjs/common'
import { AiJobsService, JOBS_PAGE_SIZE } from '../ai-jobs.service'
import { AiGenerationJob } from '../entities/ai-generation-job.entity'
import { makeCampaign, makeJob, makeRepo } from './helpers'

function makeService() {
  const repo = makeRepo<AiGenerationJob>()
  return { service: new AiJobsService(repo), repo }
}

describe('AiJobsService.findAll', () => {
  it('paginates in the database and reports the page count', async () => {
    const { service, repo } = makeService()
    ;(repo.findAndCount as jest.Mock).mockResolvedValue([[makeJob()], 60])

    const page = await service.findAll({ page: 2, range: {} })

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: JOBS_PAGE_SIZE, skip: JOBS_PAGE_SIZE }),
    )
    expect(page).toMatchObject({ page: 2, pageCount: 3, total: 60 })
  })

  it('applies the campaign, status, trigger and date filters together', async () => {
    const { service, repo } = makeService()
    const range = { from: new Date('2026-05-01T00:00:00Z'), to: new Date('2026-05-02T00:00:00Z') }
    await service.findAll({ campaignId: 'camp-1', status: 'failed', triggerType: 'manual', page: 1, range })

    const { where } = (repo.findAndCount as jest.Mock).mock.calls[0][0]
    expect(where).toMatchObject({ campaignId: 'camp-1', status: 'failed', triggerType: 'manual' })
    expect(where.createdAt).toBeDefined()
  })

  it('reduces the joined campaign to what the table renders', async () => {
    const { service, repo } = makeService()
    ;(repo.findAndCount as jest.Mock).mockResolvedValue([
      [{ ...makeJob(), campaign: makeCampaign({ masterPrompt: 'secret sauce brief' }) }],
      1,
    ])

    const page = await service.findAll({ page: 1, range: {} })
    expect(page.jobs[0].campaign).toEqual({ id: 'camp-1', name: 'Weeknight dinners' })
  })

  it('always reports at least one page', async () => {
    const { service } = makeService()
    expect((await service.findAll({ page: 1, range: {} })).pageCount).toBe(1)
  })
})

describe('AiJobsService.findById', () => {
  it('404s on an unknown job', async () => {
    const { service } = makeService()
    await expect(service.findById('nope')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('AiJobsService.countActive', () => {
  it('counts only the jobs that still hold the campaign', async () => {
    const { service, repo } = makeService()
    ;(repo.count as jest.Mock).mockResolvedValue(1)
    expect(await service.countActive('camp-1')).toBe(1)
    expect((repo.count as jest.Mock).mock.calls[0][0].where.status).toBeDefined()
  })
})
