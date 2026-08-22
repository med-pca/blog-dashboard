import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, FindManyOptions, Repository } from 'typeorm'
import { BlogPost } from './entities/blog-post.entity'
import { BaseContentService } from '../common/base-content.service'
import { PublicCacheService } from '../common/public-cache.service'
import { sanitizeRichHtml, stripHtml } from '../common/html-sanitize'

// Liste uçları içerik/HTML taşımaz: kart için gereken alanlar yeter
const PUBLIC_LIST_FIELDS: (keyof BlogPost)[] = [
  'id',
  'title',
  'slug',
  'excerpt',
  'coverImage',
  'publishedAt',
  'createdAt',
  'collectionId',
]

@Injectable()
export class BlogService extends BaseContentService<BlogPost> {
  protected readonly entityClass = BlogPost
  protected readonly notFoundMessage = 'Yazı bulunamadı'
  protected readonly fileField = 'coverImage'
  protected readonly uniqueConflictMessage = 'Bu slug zaten kullanımda'

  constructor(@InjectRepository(BlogPost) repo: Repository<BlogPost>, cache: PublicCacheService) {
    super(repo, cache)
  }

  // Public liste hafif alanlarla ve yayın tarihine göre döner
  protected publicFindOptions(): FindManyOptions<BlogPost> {
    return {
      where: { published: true },
      order: { sortOrder: 'ASC', publishedAt: 'DESC', createdAt: 'DESC' },
      select: PUBLIC_LIST_FIELDS,
    }
  }

  // İlk kez yayınlanırken publishedAt damgalanır; HTML içerik yazma anında
  // sunucuda da temizlenir (render'daki DOMPurify tek savunma olmasın)
  protected onCreate(post: BlogPost, dto: DeepPartial<BlogPost>): void {
    if (dto.published && !post.publishedAt) post.publishedAt = new Date()
    if (typeof post.content === 'string') post.content = sanitizeRichHtml(post.content)
    if (typeof post.excerpt === 'string') post.excerpt = stripHtml(post.excerpt)
  }

  // update() dto'yu hook'tan SONRA entity'ye kopyalar — burada dto temizlenir
  protected onUpdate(post: BlogPost, dto: DeepPartial<BlogPost>): void {
    if (dto.published && !post.published && !post.publishedAt) post.publishedAt = new Date()
    if (typeof dto.content === 'string') dto.content = sanitizeRichHtml(dto.content)
    if (typeof dto.excerpt === 'string') dto.excerpt = stripHtml(dto.excerpt)
  }

  // Koleksiyon detay sayfasındaki "bu koleksiyondaki tarifler" listesi.
  // Anahtar tablo adıyla öneklendiği için her blog yazımında bust edilir.
  findByCollection(collectionId: string) {
    return this.cache.wrap(this.cacheKey(`collection:${collectionId}`), () =>
      this.repo.find({
        where: { published: true, collectionId },
        order: { sortOrder: 'ASC', publishedAt: 'DESC', createdAt: 'DESC' },
        select: PUBLIC_LIST_FIELDS,
      }),
    )
  }

  // Koleksiyon listesi kartlarındaki yazı sayısı: tek sorguda { id: adet }
  countsByCollection(): Promise<Record<string, number>> {
    return this.cache.wrap(this.cacheKey('collection-counts'), async () => {
      const rows = await this.repo
        .createQueryBuilder('post')
        .select('post.collectionId', 'collectionId')
        .addSelect('COUNT(*)', 'count')
        .where('post.published = true')
        .andWhere('post.collectionId IS NOT NULL')
        .groupBy('post.collectionId')
        .getRawMany<{ collectionId: string; count: string }>()
      return Object.fromEntries(rows.map(r => [r.collectionId, Number(r.count)]))
    })
  }

  findBySlug(slug: string) {
    return this.cache.wrap(this.cacheKey(`slug:${slug}`), async () => {
      const post = await this.repo.findOne({ where: { slug, published: true } })
      if (!post) throw new NotFoundException('Yazı bulunamadı')
      return post
    })
  }
}
