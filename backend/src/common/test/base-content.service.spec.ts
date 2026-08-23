import { ConflictException, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { BlogService } from '../../blog/blog.service'
import { BlogPost } from '../../blog/entities/blog-post.entity'
import { FaqService } from '../../faq/faq.service'
import { Faq } from '../../faq/entities/faq.entity'
import { deleteUploadedFile } from '../../upload/uploaded-files'
import { PublicCacheService } from '../public-cache.service'

jest.mock('../../upload/uploaded-files', () => ({
  deleteUploadedFile: jest.fn().mockResolvedValue(undefined),
}))

const mockDeleteFile = deleteUploadedFile as jest.MockedFunction<typeof deleteUploadedFile>

function makeRepo<T extends object>(existing: Partial<T> | null = null) {
  const managerQuery = jest.fn().mockResolvedValue(undefined)
  return {
    repo: {
      create: jest.fn().mockImplementation((data: Partial<T>) => ({ ...data })),
      save: jest.fn().mockImplementation(async (entity: T) => entity),
      findOne: jest.fn().mockResolvedValue(existing),
      remove: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockResolvedValue([]),
      manager: { query: managerQuery },
      metadata: {
        name: 'BlogPost',
        tableName: 'blog_posts',
        findColumnWithPropertyName: (prop: string) =>
          prop === 'id' || prop === 'sortOrder' ? { databaseName: prop } : undefined,
      },
    } as unknown as jest.Mocked<Repository<T>>,
    managerQuery,
  }
}

beforeEach(() => mockDeleteFile.mockClear())

describe('BaseContentService (BlogService üzerinden)', () => {
  it('yayınlanan yeni yazıya publishedAt damgalar', async () => {
    const { repo } = makeRepo<BlogPost>()
    const service = new BlogService(repo, new PublicCacheService())
    const saved = await service.create({ title: 'a', published: true })
    expect(saved.publishedAt).toBeInstanceOf(Date)
  })

  it('taslak yazıya publishedAt damgalamaz', async () => {
    const { repo } = makeRepo<BlogPost>()
    const service = new BlogService(repo, new PublicCacheService())
    const saved = await service.create({ title: 'a', published: false })
    expect(saved.publishedAt).toBeUndefined()
  })

  it('taslak ilk kez yayınlanırken publishedAt damgalar', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', published: false, publishedAt: null as unknown as Date })
    const service = new BlogService(repo, new PublicCacheService())
    const saved = await service.update('1', { published: true })
    expect(saved.publishedAt).toBeInstanceOf(Date)
  })

  it('daha önce yayınlanmış yazının publishedAt değerini değiştirmez', async () => {
    const original = new Date('2026-01-01')
    const { repo } = makeRepo<BlogPost>({ id: '1', published: false, publishedAt: original })
    const service = new BlogService(repo, new PublicCacheService())
    const saved = await service.update('1', { published: true })
    expect(saved.publishedAt).toBe(original)
  })

  it('slug çakışmasında (23505) ConflictException fırlatır', async () => {
    const { repo } = makeRepo<BlogPost>()
    ;(repo.save as jest.Mock).mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }))
    const service = new BlogService(repo, new PublicCacheService())
    await expect(service.create({ title: 'a', slug: 'x' })).rejects.toThrow(ConflictException)
  })

  it('kapak değişince eski dosyayı siler', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', coverImage: '/uploads/eski.webp' })
    const service = new BlogService(repo, new PublicCacheService())
    await service.update('1', { coverImage: '/uploads/yeni.webp' })
    expect(mockDeleteFile).toHaveBeenCalledWith('/uploads/eski.webp')
  })

  it('kapak dto\'da yoksa dosya silinmez', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', coverImage: '/uploads/eski.webp' })
    const service = new BlogService(repo, new PublicCacheService())
    await service.update('1', { title: 'yeni başlık' })
    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  it('silinen yazının kapak dosyasını da siler', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', coverImage: '/uploads/kapak.webp' })
    const service = new BlogService(repo, new PublicCacheService())
    await service.remove('1')
    expect(mockDeleteFile).toHaveBeenCalledWith('/uploads/kapak.webp')
  })

  it('bulunamayan id için NotFoundException fırlatır', async () => {
    const { repo } = makeRepo<BlogPost>(null)
    const service = new BlogService(repo, new PublicCacheService())
    await expect(service.findById('yok')).rejects.toThrow(NotFoundException)
  })

  it('reorder tüm sıralamayı tek CASE sorgusuyla yazar', async () => {
    const { repo, managerQuery } = makeRepo<BlogPost>()
    const service = new BlogService(repo, new PublicCacheService())
    await service.reorder(['b', 'a', 'c'])
    expect(managerQuery).toHaveBeenCalledTimes(1)
    const [sql, params] = managerQuery.mock.calls[0]
    expect(sql).toContain('UPDATE "blog_posts" SET "sortOrder" = CASE')
    expect(params).toEqual([['b', 'a', 'c'], 'b', 'a', 'c'])
  })
})

describe('BaseContentService — public cache (4.4)', () => {
  it('findAllPublic ikinci çağrıda repo\'ya gitmez', async () => {
    const { repo } = makeRepo<BlogPost>()
    const service = new BlogService(repo, new PublicCacheService())
    await service.findAllPublic()
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledTimes(1)
  })

  it('create ve reorder cache\'i düşürür (reorder raw SQL kullandığından burası kritik)', async () => {
    const { repo } = makeRepo<BlogPost>()
    const service = new BlogService(repo, new PublicCacheService())
    await service.findAllPublic()
    await service.create({ title: 'yeni' })
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledTimes(2)
    await service.reorder(['a', 'b'])
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledTimes(3)
  })

  it('update ve remove cache\'i düşürür', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1' })
    const service = new BlogService(repo, new PublicCacheService())
    await service.findAllPublic()
    await service.update('1', { title: 'x' })
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledTimes(2)
    await service.remove('1')
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledTimes(3)
  })
})

describe('FaqService — sıralama farkı', () => {
  it('public liste en eski üstte okunur', async () => {
    const { repo } = makeRepo<Faq>()
    const service = new FaqService(repo, new PublicCacheService())
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledWith({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    })
  })
})
