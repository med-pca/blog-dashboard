import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { Project } from '../projects/entities/project.entity'
import { PublicCacheService } from '../common/public-cache.service'

const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/guides', priority: '0.9', changefreq: 'monthly' },
  { loc: '/guides/meal-prep', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides/weeknight-dinners', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides/budget-cooking', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides/kitchen-setup', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides/cooking-mistakes', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides/30-minute-meals', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides/menu-planning', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides/cooking-techniques', priority: '0.7', changefreq: 'monthly' },
  { loc: '/about', priority: '0.8', changefreq: 'monthly' },
  { loc: '/collections', priority: '0.8', changefreq: 'weekly' },
  { loc: '/recipes', priority: '0.8', changefreq: 'weekly' },
  { loc: '/faq', priority: '0.7', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
  { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/cookies', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  { loc: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { loc: '/why-us/tested-recipes', priority: '0.6', changefreq: 'monthly' },
  { loc: '/why-us/practical-system', priority: '0.6', changefreq: 'monthly' },
  { loc: '/why-us/seasonal-ingredients', priority: '0.6', changefreq: 'monthly' },
  { loc: '/why-us/budget-planning', priority: '0.6', changefreq: 'monthly' },
  { loc: '/why-us/friendly-community', priority: '0.6', changefreq: 'monthly' },
  { loc: '/why-us/reliable-methodology', priority: '0.6', changefreq: 'monthly' },
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
      urlTag(`/recipes/${p.slug}`, {
        lastmod: p.updatedAt || p.publishedAt,
        priority: '0.7',
        changefreq: 'monthly',
      }),
    )

    const projectUrls = projects.map((p) =>
      urlTag(`/collections/${p.slug}`, {
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
