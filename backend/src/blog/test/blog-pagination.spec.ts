import { FindOperator, Repository } from 'typeorm'
import { BlogService } from '../blog.service'
import { BlogPost } from '../entities/blog-post.entity'
import { PublicCacheService } from '../../common/public-cache.service'

function post(id: string, extra: Partial<BlogPost> = {}): BlogPost {
  return { id, title: `Post ${id}`, slug: id, published: true, ...extra } as BlogPost
}

function makeService() {
  const repo = {
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
    query: jest.fn().mockResolvedValue([]),
    metadata: { tableName: 'blog_posts' },
  } as unknown as Repository<BlogPost>

  return { service: new BlogService(repo, new PublicCacheService()), repo }
}

describe('BlogService.findPublicPage', () => {
  it('asks for one 12-post window and reports the real page count', async () => {
    const { service, repo } = makeService()
    jest.mocked(repo.findAndCount).mockResolvedValue([[post('a')], 37])

    const result = await service.findPublicPage(2)

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 12, skip: 12, where: { published: true } }),
    )
    // 37 posts over 12 per page = 4 pages (the last one holding a single post)
    expect(result).toMatchObject({ page: 2, pageCount: 4, total: 37 })
    expect(result.posts).toHaveLength(1)
  })

  it('keeps the pager alive on an empty blog', async () => {
    const { service } = makeService()
    await expect(service.findPublicPage(1)).resolves.toMatchObject({ pageCount: 1, total: 0 })
  })

  it('caches each page under its own key instead of sharing one list', async () => {
    const { service, repo } = makeService()

    await service.findPublicPage(1)
    await service.findPublicPage(1)
    await service.findPublicPage(2)

    // page 1 served from cache the second time; page 2 is a separate entry
    expect(repo.findAndCount).toHaveBeenCalledTimes(2)
  })

  it('drops the heavy HTML columns from list rows', async () => {
    const { service, repo } = makeService()
    await service.findPublicPage(1)
    const select = jest.mocked(repo.findAndCount).mock.calls[0][0]?.select as string[]
    expect(select).not.toContain('content')
    expect(select).toEqual(expect.arrayContaining(['title', 'slug', 'coverImage']))
  })
})

describe('BlogService.findAdminPage', () => {
  it('reports the four tab counts regardless of the active filter', async () => {
    const { service, repo } = makeService()
    jest.mocked(repo.count).mockResolvedValueOnce(30).mockResolvedValueOnce(18)
    jest.mocked(repo.query).mockResolvedValue([{ id: 'a' }, { id: 'b' }])

    const result = await service.findAdminPage(1, 'draft')

    expect(result.stats).toEqual({ all: 30, published: 18, draft: 12, duplicate: 2 })
  })

  it('filters drafts on published = false', async () => {
    const { service, repo } = makeService()
    await service.findAdminPage(1, 'draft')
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: false }, take: 20, skip: 0 }),
    )
  })

  it('applies no status filter on the "all" tab', async () => {
    const { service, repo } = makeService()
    await service.findAdminPage(3, 'all')
    expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: {}, skip: 40 }))
  })

  it('returns the page offset so a drag on page 2 keeps the global order', async () => {
    const { service } = makeService()
    await expect(service.findAdminPage(3, 'all')).resolves.toMatchObject({ offset: 40 })
  })

  it('keeps duplicates in the grouped SQL order, not the order the rows come back', async () => {
    const { service, repo } = makeService()
    // SQL groups same-title posts together; find() by id makes no such promise
    jest.mocked(repo.query).mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    jest.mocked(repo.find).mockResolvedValue([post('c'), post('a'), post('b')])

    const result = await service.findAdminPage(1, 'duplicate')

    expect(result.posts.map(p => p.id)).toEqual(['a', 'b', 'c'])
    expect(result.total).toBe(3)
  })

  it('pages through duplicates without a second scan', async () => {
    const { service, repo } = makeService()
    jest.mocked(repo.query).mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({ id: `d${i}` })),
    )
    jest.mocked(repo.find).mockResolvedValue([])

    const result = await service.findAdminPage(2, 'duplicate')

    expect(result.pageCount).toBe(2)
    // page 2 asks only for the 5 ids that remain after the first 20
    const where = jest.mocked(repo.find).mock.calls[0][0]?.where as unknown as {
      id: FindOperator<string>
    }
    expect(where.id.value).toHaveLength(5)
    expect(where.id.value[0]).toBe('d20')
  })

  it('skips the id lookup entirely when a duplicate page is empty', async () => {
    const { service, repo } = makeService()
    jest.mocked(repo.query).mockResolvedValue([])

    const result = await service.findAdminPage(1, 'duplicate')

    expect(repo.find).not.toHaveBeenCalled()
    expect(result.posts).toEqual([])
  })
})
