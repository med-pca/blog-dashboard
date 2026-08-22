import { InternalServerErrorException } from '@nestjs/common'
import type { Repository } from 'typeorm'
import type { ConfigService } from '@nestjs/config'
import { InstagramImportService } from '../instagram-import.service'
import type { Project } from '../entities/project.entity'
import type { ProjectsService } from '../projects.service'
import type { MediaService } from '../media.service'
import type { InstagramParseService } from '../instagram-parse.service'
import type { InstagramTokenService } from '../../instagram-token/instagram-token.service'
import type { PublicCacheService } from '../../common/public-cache.service'
import type { InstagramPost, ParsedProject } from '../instagram-types'

// Mock external dependencies
jest.mock('sharp', () => jest.fn().mockReturnValue({ webp: jest.fn().mockReturnThis(), toFile: jest.fn() }))
jest.mock('fs/promises', () => ({ ...jest.requireActual('fs/promises'), rm: jest.fn() }))
jest.mock('fs', () => ({ ...jest.requireActual('fs'), createWriteStream: jest.fn() }))
jest.mock('stream/promises', () => ({ pipeline: jest.fn().mockResolvedValue(undefined) }))

import { createWriteStream } from 'fs'
import { rm } from 'fs/promises'
import { pipeline } from 'stream/promises'
import sharp from 'sharp'
import { MediaType } from '../entities/project-media.entity'

// 1x1 şeffaf piksel — gerçek PNG magic byte'ları; assertMagicBytesFromBuffer
// artık gerçek file-type kontrolü yaptığı için mutlu yol testlerinde bu şart
const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

const mockPost = (id: string, caption: string): InstagramPost => ({
  id,
  caption,
  media_type: 'IMAGE',
  media_url: 'https://example.com/image.jpg',
  thumbnail_url: null,
})

// Private metodlara tip güvenli erişim: gerçek imzaların yapısal kopyası
type ServicePrivates = {
  createProjectFromInstagram(parsed: ParsedProject, post: InstagramPost, published: boolean): Promise<Project>
  importInstagramImages(project: Pick<Project, 'id' | 'slug'>, post: InstagramPost): Promise<number>
}
const privates = (s: InstagramImportService) => s as unknown as ServicePrivates

type FindArgs = { where?: { instagramMediaId?: string | { _value?: string[] } } }

function makeService(overrides: {
  existingIds?: string[]
  tokenValue?: string | null
  parseResult?: ParsedProject
  saveShouldFail?: boolean
} = {}) {
  const existingIds = new Set(overrides.existingIds ?? [])

  // Transaction'da save'e giden entity'ler: published=false ile kaydedildiği burada doğrulanır
  const transactionSaves: Record<string, unknown>[] = []

  const projectRepo = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    findOne: jest.fn().mockImplementation(({ where }: FindArgs) => {
      const id = where?.instagramMediaId as string | undefined
      return Promise.resolve(id && existingIds.has(id) ? { id: 'existing', instagramMediaId: id } : null)
    }),
    find: jest.fn().mockImplementation(({ where }: FindArgs) => {
      // In() operatörünün FindOperator'ı; testte yalnızca _value okunur
      const operator = where?.instagramMediaId as { _value?: string[] } | undefined
      const ids = operator?._value ?? []
      return Promise.resolve(
        ids.filter(id => existingIds.has(id)).map(id => ({ instagramMediaId: id })),
      )
    }),
    create: jest.fn().mockImplementation((data: Record<string, unknown>) => ({ ...data })),
    save: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation(
        async (cb: (manager: { create: jest.Mock; save: jest.Mock }) => Promise<unknown>) => {
          const manager = {
            create: jest.fn().mockImplementation((_: unknown, data: Record<string, unknown>) => ({ ...data })),
            save: jest.fn().mockImplementation((entity: Record<string, unknown>) => {
              if (overrides.saveShouldFail) throw Object.assign(new Error('DB error'), { code: '99999' })
              transactionSaves.push(entity)
              return Promise.resolve({ ...entity, id: 'new-project-id' })
            }),
          }
          return cb(manager)
        },
      ),
    },
  }

  const projectsService = {
    uniqueSlug: jest.fn().mockResolvedValue('test-proje'),
    toSlug: jest.fn().mockReturnValue('test-proje'),
  }

  const mediaService = {
    addMedia: jest.fn().mockResolvedValue({ id: 'media-id' }),
  }

  const parseService = {
    parseInstagram: jest.fn().mockResolvedValue(
      overrides.parseResult ?? {
        name: 'Test Proje',
        location: 'Manisa',
        kw: 10,
        date: '2024',
        description: 'Test açıklama',
        specs: [],
        highlights: [],
        statBoxes: [],
      },
    ),
  }

  const tokenService = {
    getAccessToken: jest.fn().mockResolvedValue(overrides.tokenValue !== undefined ? overrides.tokenValue : 'mock-token'),
  }

  const config = {
    get: jest.fn().mockImplementation((key: string, def?: string) => {
      const vals: Record<string, string> = {
        INSTAGRAM_USER_ID: 'test-user-id',
        INSTAGRAM_HASHTAG: '#proje',
      }
      return vals[key] ?? def ?? 'test-user-id'
    }),
  }

  const cache = { bust: jest.fn() }

  const service = new InstagramImportService(
    projectRepo as unknown as Repository<Project>,
    projectsService as unknown as ProjectsService,
    mediaService as unknown as MediaService,
    parseService as unknown as InstagramParseService,
    tokenService as unknown as InstagramTokenService,
    config as unknown as ConfigService,
    cache as unknown as PublicCacheService,
  )

  return { service, projectRepo, mediaService, parseService, tokenService, transactionSaves, cache }
}

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('InstagramImportService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('syncInstagram — N+1 protection', () => {
    it('should use a single batch query instead of N+1 findOne calls', async () => {
      const posts = [
        mockPost('111', 'Test proje #proje'),
        mockPost('222', 'Başka proje #proje'),
        mockPost('333', 'Üçüncü proje #proje'),
      ]

      const { service, projectRepo } = makeService({ existingIds: ['111'] })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: posts }),
        text: () => Promise.resolve(''),
      })
      // Image download mock
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('fake-image')),
      })

      await service.syncInstagram()

      // Batch find should be called once (not once per post)
      expect(projectRepo.find).toHaveBeenCalledTimes(1)
      // Individual findOne should NOT be called in the sync loop
      expect(projectRepo.findOne).not.toHaveBeenCalled()
    })

    it('should skip already-existing posts without calling parseInstagram', async () => {
      const posts = [mockPost('existing-id', 'Mevcut proje #proje')]
      const { service, parseService } = makeService({ existingIds: ['existing-id'] })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: posts }),
        text: () => Promise.resolve(''),
      })

      const result = await service.syncInstagram()

      expect(result.skipped).toBe(1)
      expect(result.imported).toBe(0)
      expect(parseService.parseInstagram).not.toHaveBeenCalled()
    })

    // B.1: parseInstagram bozuk ALANLARI düşürüp gönderiyi kurtarıyor, ama
    // kurtarılamayan durumlarda (name yok, sağlayıcı erişilemiyor) hâlâ throw ediyor.
    // Döngünün o postu atlayıp DİĞERLERİNE DEVAM ettiğini kilitler — tek bozuk
    // gönderi tüm sync partisini düşürmemeli.
    it('skips a post whose parse failed and keeps importing the rest', async () => {
      const posts = [mockPost('bad-1', 'Bozuk gönderi #proje'), mockPost('good-1', 'İyi gönderi #proje')]
      const { service, parseService } = makeService()

      parseService.parseInstagram
        .mockRejectedValueOnce(new InternalServerErrorException('LLM çıktısı şemaya uymuyor (specs)'))
        .mockResolvedValueOnce({ name: 'İyi Proje', location: 'Manisa', kw: 5, date: '2025', description: 'x' })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: posts }),
        text: () => Promise.resolve(''),
      })
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('fake-image')),
      })

      const result = await service.syncInstagram()

      expect(parseService.parseInstagram).toHaveBeenCalledTimes(2)
      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(1)
    })
  })

  describe('createProjectFromInstagram — transaction', () => {
    it('should save project inside a DB transaction', async () => {
      const post = mockPost('new-id', 'Yeni proje #proje')
      const { service, projectRepo } = makeService()

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('fake')),
      })

      await privates(service).createProjectFromInstagram(
        { name: 'Test', location: 'İzmir', kw: 5, date: '2024', description: 'desc', specs: [], highlights: [], statBoxes: [] },
        post,
        true,
      )

      expect(projectRepo.manager.transaction).toHaveBeenCalledTimes(1)
    })

    it('should still return existing project on race condition (23505)', async () => {
      const post = mockPost('race-id', 'Race proje #proje')
      const { service, projectRepo } = makeService({ saveShouldFail: true })

      const err = Object.assign(new Error('unique constraint'), { code: '23505' })
      projectRepo.manager.transaction = jest.fn().mockRejectedValue(err)
      projectRepo.findOne = jest.fn().mockResolvedValue({ id: 'existing-race', instagramMediaId: 'race-id' })

      const result = await privates(service).createProjectFromInstagram(
        { name: 'Race', location: 'X', kw: 1, date: '2024', description: 'd', specs: [], highlights: [], statBoxes: [] },
        post,
        true,
      )

      expect(result.instagramMediaId).toBe('race-id')
    })
  })

  describe('createProjectFromInstagram — medya bitmeden yayınlanmaz (4.3)', () => {
    const parsed: ParsedProject = {
      name: 'Test', location: 'İzmir', kw: 5, date: '2024', description: 'desc',
      specs: [], highlights: [], statBoxes: [],
    }

    it('saves as draft first, publishes only after media import succeeds', async () => {
      const post = mockPost('pub-id', 'Yeni proje #proje')
      const { service, projectRepo, transactionSaves, cache } = makeService()

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(REAL_PNG),
      })

      const result = await privates(service).createProjectFromInstagram(parsed, post, true)

      // İlk kayıt her zaman taslak; yayın ancak medya başarısından sonra
      expect(transactionSaves[0].published).toBe(false)
      expect(projectRepo.update).toHaveBeenCalledWith('new-project-id', { published: true })
      expect(result.published).toBe(true)
      // Yayına alma ProjectsService'i bypass eder; public cache burada düşürülmeli
      expect(cache.bust).toHaveBeenCalledWith('projects')
    })

    it('leaves the project as draft when no media could be imported', async () => {
      const post = mockPost('fail-id', 'Yeni proje #proje')
      const { service, projectRepo } = makeService()

      mockFetch.mockResolvedValue({ ok: false })

      const result = await privates(service).createProjectFromInstagram(parsed, post, true)

      expect(projectRepo.update).not.toHaveBeenCalled()
      expect(result.published).toBe(false)
    })

    it('never publishes when the caller did not request it (manual sync path)', async () => {
      const post = mockPost('manual-id', 'Yeni proje #proje')
      const { service, projectRepo } = makeService()

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('fake')),
      })

      const result = await privates(service).createProjectFromInstagram(parsed, post, false)

      expect(projectRepo.update).not.toHaveBeenCalled()
      expect(result.published).toBe(false)
    })
  })

  describe('syncInstagramByMediaId — missing token', () => {
    it('should throw when access token is missing', async () => {
      const { service } = makeService({ tokenValue: null })

      await expect(service.syncInstagramByMediaId('some-media-id')).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })

  describe('importInstagramImages — video streaming (OOM guard)', () => {
    const videoPost: InstagramPost = {
      id: 'video-id',
      media_type: 'VIDEO',
      media_url: 'https://example.com/video.mp4',
      thumbnail_url: null,
    }
    const emptyWebStream = () => new ReadableStream({ start: c => c.close() })

    it('streams videos to disk without buffering them in memory', async () => {
      const { service, mediaService } = makeService()
      const arrayBuffer = jest.fn()
      mockFetch.mockResolvedValue({ ok: true, body: emptyWebStream(), arrayBuffer })

      await privates(service).importInstagramImages({ id: 'p1', slug: 'test-proje' }, videoPost)

      expect(pipeline).toHaveBeenCalledTimes(1)
      expect(createWriteStream).toHaveBeenCalledWith(expect.stringContaining('.mp4'))
      // Video RAM'e alınmamalı — OOM regresyon kilidi
      expect(arrayBuffer).not.toHaveBeenCalled()
      expect(mediaService.addMedia).toHaveBeenCalledWith(
        'p1',
        MediaType.VIDEO,
        expect.stringMatching(/^\/uploads\/test-proje-ig-.*\.mp4$/),
      )
    })

    it('removes the partial file and skips the media when streaming fails', async () => {
      const { service, mediaService } = makeService()
      ;(pipeline as jest.Mock).mockRejectedValueOnce(new Error('network reset'))
      mockFetch.mockResolvedValue({ ok: true, body: emptyWebStream() })

      await privates(service).importInstagramImages({ id: 'p1', slug: 'test-proje' }, videoPost)

      expect(rm).toHaveBeenCalledWith(expect.stringContaining('.mp4'), { force: true })
      expect(mediaService.addMedia).not.toHaveBeenCalled()
    })

    it('downloads carousel media sequentially, not in parallel', async () => {
      const { service } = makeService()
      let inFlight = 0
      let maxInFlight = 0
      mockFetch.mockImplementation(async () => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise(r => setTimeout(r, 5))
        inFlight--
        return { ok: true, arrayBuffer: () => Promise.resolve(Buffer.from('img')) }
      })

      const carousel: InstagramPost = {
        id: 'carousel-id',
        media_type: 'CAROUSEL_ALBUM',
        children: {
          data: [
            { id: 'c1', media_type: 'IMAGE', media_url: 'https://example.com/1.jpg' },
            { id: 'c2', media_type: 'IMAGE', media_url: 'https://example.com/2.jpg' },
            { id: 'c3', media_type: 'IMAGE', media_url: 'https://example.com/3.jpg' },
          ],
        },
      }
      await privates(service).importInstagramImages({ id: 'p1', slug: 'test-proje' }, carousel)

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(maxInFlight).toBe(1)
    })
  })

  describe('importInstagramImages — magic-byte doğrulaması (sharp CVE maruziyeti)', () => {
    const imagePost: InstagramPost = {
      id: 'image-id',
      media_type: 'IMAGE',
      media_url: 'https://example.com/image.jpg',
      thumbnail_url: null,
    }

    it('reddedilen bir buffer için sharp\'ı hiç çağırmaz, medyayı kaydetmez', async () => {
      const { service, mediaService } = makeService()
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('bu bir görsel değil')),
      })

      const imported = await privates(service).importInstagramImages(
        { id: 'p1', slug: 'test-proje' },
        imagePost,
      )

      expect(imported).toBe(0)
      expect(sharp).not.toHaveBeenCalled()
      expect(mediaService.addMedia).not.toHaveBeenCalled()
    })

    it('gerçek bir görsel buffer\'ını sharp\'a geçirir', async () => {
      const { service, mediaService } = makeService()
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(REAL_PNG),
      })

      const imported = await privates(service).importInstagramImages(
        { id: 'p1', slug: 'test-proje' },
        imagePost,
      )

      expect(imported).toBe(1)
      expect(mediaService.addMedia).toHaveBeenCalledWith(
        'p1',
        MediaType.IMAGE,
        expect.stringMatching(/^\/uploads\/test-proje-ig-.*\.webp$/),
      )
    })
  })
})
