import { AiTopicService } from '../ai-topic.service'
import { BlogPost } from '../../blog/entities/blog-post.entity'
import { AiGenerationJob } from '../entities/ai-generation-job.entity'
import { AiGenerationError } from '../lib/errors'
import { makeCampaign, makeJob, makeRepo } from './helpers'
import type { AiContentProvider } from '../types/ai-content.types'

const USAGE = { inputTokens: 100, outputTokens: 20 }

function makeService(topicRounds: string[][]) {
  const posts = makeRepo<BlogPost>()
  const jobs = makeRepo<AiGenerationJob>()
  let round = 0
  const provider: AiContentProvider = {
    suggestTopics: jest.fn(() => Promise.resolve({ topics: topicRounds[round++] ?? [], usage: USAGE })),
    writeArticle: jest.fn(),
  }
  return { service: new AiTopicService(posts, jobs, provider), posts, jobs, provider }
}

const OPTIONS = { model: 'gpt-5-nano', timeoutMs: 1000 }

describe('AiTopicService.pickTopic', () => {
  it('returns the first candidate that is not already covered', async () => {
    const { service, posts } = makeService([['Sheet Pan Honey Garlic Chicken']])
    ;(posts.find as jest.Mock).mockResolvedValue([{ title: 'No Knead Sourdough', slug: 'no-knead-sourdough' }])

    const picked = await service.pickTopic(makeCampaign(), OPTIONS)
    expect(picked.topic).toBe('Sheet Pan Honey Garlic Chicken')
    expect(picked.normalizedTopic).toBe('sheet pan honey garlic chicken')
    expect(picked.usage).toEqual(USAGE)
  })

  it('skips a candidate that only rewords an existing post title', async () => {
    const { service, posts } = makeService([['Weeknight Chicken Tacos, Easy!', 'Slow Cooker Beef Chili for a Crowd']])
    ;(posts.find as jest.Mock).mockResolvedValue([
      { title: 'Easy Weeknight Chicken Tacos', slug: 'easy-weeknight-chicken-tacos' },
    ])

    const picked = await service.pickTopic(makeCampaign(), OPTIONS)
    expect(picked.topic).toBe('Slow Cooker Beef Chili for a Crowd')
  })

  it('skips a candidate that collides with an existing slug rather than a title', async () => {
    const { service, posts } = makeService([['Sheet Pan Honey Garlic Chicken', 'Pressure Cooker Risotto']])
    ;(posts.find as jest.Mock).mockResolvedValue([
      { title: 'Totally Different Wording', slug: 'sheet-pan-honey-garlic-chicken' },
    ])

    const picked = await service.pickTopic(makeCampaign(), OPTIONS)
    expect(picked.topic).toBe('Pressure Cooker Risotto')
  })

  it('skips topics already queued or running for another campaign', async () => {
    const { service, posts, jobs } = makeService([['Sheet Pan Honey Garlic Chicken', 'Pressure Cooker Risotto']])
    ;(posts.find as jest.Mock).mockResolvedValue([])
    ;(jobs.find as jest.Mock).mockResolvedValue([
      makeJob({ status: 'queued', topic: 'Sheet Pan Honey Garlic Chicken', normalizedTopic: 'sheet pan honey garlic chicken' }),
    ])

    const picked = await service.pickTopic(makeCampaign(), OPTIONS)
    expect(picked.topic).toBe('Pressure Cooker Risotto')
  })

  it('asks again with the rejects as feedback before giving up', async () => {
    const { service, posts, provider } = makeService([
      ['Easy Weeknight Chicken Tacos'],
      ['Weeknight Chicken Tacos Easy'],
      ['Pressure Cooker Risotto'],
    ])
    ;(posts.find as jest.Mock).mockResolvedValue([
      { title: 'Easy Weeknight Chicken Tacos', slug: 'easy-weeknight-chicken-tacos' },
    ])

    const picked = await service.pickTopic(makeCampaign(), OPTIONS)
    expect(picked.topic).toBe('Pressure Cooker Risotto')
    expect(provider.suggestTopics).toHaveBeenCalledTimes(3)
    const lastCall = (provider.suggestTopics as jest.Mock).mock.calls[2][0]
    expect(lastCall.rejectedTopics).toContain('Weeknight Chicken Tacos Easy')
  })

  it('fails permanently, and only after a bounded number of rounds', async () => {
    const { service, posts, provider } = makeService([
      ['Easy Weeknight Chicken Tacos'],
      ['Easy Weeknight Chicken Tacos'],
      ['Easy Weeknight Chicken Tacos'],
      ['Pressure Cooker Risotto'],
    ])
    ;(posts.find as jest.Mock).mockResolvedValue([
      { title: 'Easy Weeknight Chicken Tacos', slug: 'easy-weeknight-chicken-tacos' },
    ])

    await expect(service.pickTopic(makeCampaign(), OPTIONS)).rejects.toMatchObject({
      code: 'TOPIC_EXHAUSTED',
      kind: 'permanent',
    })
    expect(provider.suggestTopics).toHaveBeenCalledTimes(3)
  })

  it('accumulates the token cost of every round it needed', async () => {
    const { service, posts } = makeService([['Easy Weeknight Chicken Tacos'], ['Pressure Cooker Risotto']])
    ;(posts.find as jest.Mock).mockResolvedValue([
      { title: 'Easy Weeknight Chicken Tacos', slug: 'easy-weeknight-chicken-tacos' },
    ])

    const picked = await service.pickTopic(makeCampaign(), OPTIONS)
    expect(picked.usage).toEqual({ inputTokens: 200, outputTokens: 40 })
  })

  it('caps the avoid-list it sends to the model', async () => {
    const { service, posts, provider } = makeService([['Pressure Cooker Risotto']])
    ;(posts.find as jest.Mock).mockResolvedValue(
      Array.from({ length: 120 }, (_, i) => ({ title: `Recipe number ${i}`, slug: `recipe-number-${i}` })),
    )

    await service.pickTopic(makeCampaign(), OPTIONS)
    expect((provider.suggestTopics as jest.Mock).mock.calls[0][0].avoidTitles).toHaveLength(40)
  })
})

describe('AiTopicService.assertTitleIsOriginal', () => {
  it('rejects a finished title that drifted onto an existing article', async () => {
    const { service, posts } = makeService([])
    ;(posts.find as jest.Mock).mockResolvedValue([
      { title: 'Easy Weeknight Chicken Tacos', slug: 'easy-weeknight-chicken-tacos' },
    ])
    await expect(
      service.assertTitleIsOriginal('Weeknight Chicken Tacos, Easy!', 'camp-1', 'job-1'),
    ).rejects.toBeInstanceOf(AiGenerationError)
  })

  it('accepts an original title', async () => {
    const { service, posts } = makeService([])
    ;(posts.find as jest.Mock).mockResolvedValue([{ title: 'No Knead Sourdough', slug: 'no-knead-sourdough' }])
    await expect(service.assertTitleIsOriginal('Pressure Cooker Risotto', 'camp-1', 'job-1')).resolves.toBeUndefined()
  })
})
