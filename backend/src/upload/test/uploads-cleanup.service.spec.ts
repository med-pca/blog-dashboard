import { mkdtemp, rm, writeFile, utimes, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { Repository } from 'typeorm'
import { ProjectMedia } from '../../projects/entities/project-media.entity'
import { BlogPost } from '../../blog/entities/blog-post.entity'
import { UploadsCleanupService } from '../uploads-cleanup.service'

// UPLOADS_DIR sabitini geçici test dizinine yönlendir
let mockUploadsDir: string
jest.mock('../uploaded-files', () => ({
  get UPLOADS_DIR() {
    return mockUploadsDir
  },
}))

function makeService(referenced: { media?: string[]; covers?: string[] }) {
  const mediaRepo = {
    find: jest.fn().mockResolvedValue((referenced.media ?? []).map(src => ({ src }))),
  } as unknown as Repository<ProjectMedia>
  const blogRepo = {
    find: jest.fn().mockResolvedValue((referenced.covers ?? []).map(coverImage => ({ coverImage }))),
  } as unknown as Repository<BlogPost>

  return new UploadsCleanupService(mediaRepo, blogRepo)
}

async function createFile(name: string, ageHours: number) {
  const path = join(mockUploadsDir, name)
  await writeFile(path, 'x')
  const mtime = new Date(Date.now() - ageHours * 60 * 60 * 1000)
  await utimes(path, mtime, mtime)
}

describe('UploadsCleanupService', () => {
  beforeEach(async () => {
    mockUploadsDir = await mkdtemp(join(tmpdir(), 'uploads-cleanup-'))
  })

  afterEach(async () => {
    await rm(mockUploadsDir, { recursive: true, force: true })
  })

  it('should delete old unreferenced files but keep referenced and fresh ones', async () => {
    await createFile('referenced.webp', 48)
    await createFile('orphan-old.webp', 48)
    await createFile('orphan-fresh.webp', 1)
    await writeFile(join(mockUploadsDir, '.gitkeep'), '')

    const service = makeService({ media: ['/uploads/referenced.webp'] })
    const deleted = await service.run()

    expect(deleted).toBe(1)
    const remaining = await readdir(mockUploadsDir)
    expect(remaining.sort()).toEqual(['.gitkeep', 'orphan-fresh.webp', 'referenced.webp'])
  })

  it('should honour references from blog covers', async () => {
    await createFile('cover.webp', 48)
    await createFile('gone.webp', 48)

    const service = makeService({ covers: ['/uploads/cover.webp'] })
    const deleted = await service.run()

    expect(deleted).toBe(1)
    const remaining = await readdir(mockUploadsDir)
    expect(remaining.sort()).toEqual(['cover.webp'])
  })

  it('should delete nothing when every file is referenced', async () => {
    await createFile('a.webp', 48)
    await createFile('b.mp4', 48)

    const service = makeService({ media: ['/uploads/a.webp', '/uploads/b.mp4'] })

    await expect(service.run()).resolves.toBe(0)
  })
})
