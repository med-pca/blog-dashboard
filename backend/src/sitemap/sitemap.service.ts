import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { Project } from '../projects/entities/project.entity'
import { PublicCacheService } from '../common/public-cache.service'

const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/hizmetler', priority: '0.9', changefreq: 'monthly' },
  { loc: '/hizmetler/sulama', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/cati-arazi', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/bag-evi', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/ev-sarj', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/ges-bakim-onarim', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/elektrik-altyapi-bakimi', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/proje-danismanlik', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/enerji-danismanlik', priority: '0.7', changefreq: 'monthly' },
  { loc: '/kurumsal', priority: '0.8', changefreq: 'monthly' },
  { loc: '/projelerimiz', priority: '0.8', changefreq: 'weekly' },
  { loc: '/referanslar', priority: '0.7', changefreq: 'weekly' },
  { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
  { loc: '/sss', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tasarruf-hesaplayici', priority: '0.7', changefreq: 'monthly' },
  { loc: '/iletisim', priority: '0.8', changefreq: 'monthly' },
  { loc: '/kvkk', priority: '0.3', changefreq: 'yearly' },
  { loc: '/cookies', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  { loc: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { loc: '/neden-biz/muhendislik-altyapisi', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/anahtar-teslim-hizmet', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/surdurulebilir-enerji', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/verimlilik-odakli', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/yerel-ve-guvenilir', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/onayli-ekipmanlar', priority: '0.6', changefreq: 'monthly' },
]

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(BlogPost) private blogRepo: Repository<BlogPost>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    private config: ConfigService,
    private cache: PublicCacheService,
  ) {}

  private get site(): string {
    return this.config.get<string>('FRONTEND_URL', 'https://pulserecipe.com').replace(/\/$/, '')
  }

  // Bot trafiği her seferinde iki sorgu atmasın; bust yok, ≤60sn bayatlık kabul
  generateXml(): Promise<string> {
    return this.cache.wrap('sitemap:xml', () => this.buildXml())
  }

  private async buildXml(): Promise<string> {
    const [posts, projects] = await Promise.all([
      this.blogRepo.find({
        where: { published: true },
        select: ['slug', 'updatedAt', 'publishedAt'],
        order: { publishedAt: 'DESC' },
      }),
      this.projectRepo.find({
        where: { published: true },
        select: ['slug', 'updatedAt'],
        order: { sortOrder: 'ASC' },
      }),
    ])

    const urlTag = (loc: string, opts: { lastmod?: Date; priority: string; changefreq: string }) => {
      const lastmod = opts.lastmod ? `\n    <lastmod>${opts.lastmod.toISOString().split('T')[0]}</lastmod>` : ''
      return `  <url>\n    <loc>${this.site}${xmlEscape(loc)}</loc>${lastmod}\n    <changefreq>${opts.changefreq}</changefreq>\n    <priority>${opts.priority}</priority>\n  </url>`
    }

    const staticUrls = STATIC_URLS.map((u) => urlTag(u.loc, { priority: u.priority, changefreq: u.changefreq }))

    const blogUrls = posts.map((p) =>
      urlTag(`/blog/${p.slug}`, {
        lastmod: p.updatedAt || p.publishedAt,
        priority: '0.7',
        changefreq: 'monthly',
      }),
    )

    const projectUrls = projects.map((p) =>
      urlTag(`/projelerimiz/${p.slug}`, {
        lastmod: p.updatedAt,
        priority: '0.6',
        changefreq: 'monthly',
      }),
    )

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...blogUrls, ...projectUrls].join('\n')}
</urlset>`
  }
}
