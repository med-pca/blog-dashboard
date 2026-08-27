import { Injectable, NotFoundException, Optional } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm'
import { BlogPost } from './entities/blog-post.entity'
import { BaseContentService } from '../common/base-content.service'
import { PublicCacheService } from '../common/public-cache.service'
import { sanitizeRichHtml, stripHtml } from '../common/html-sanitize'
import { AiCoverImageService } from '../ai/ai-cover-image.service'

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

// Admin listesi de içerik/HTML taşımaz: satırda görünmeyen content/ingredients/
// method alanları yüzlerce yazıda yanıtın ezici çoğunluğuydu. Formu açan ekran
// tek yazıyı GET /blog/admin/post/:id ile tam haliyle çeker.
const ADMIN_LIST_FIELDS: (keyof BlogPost)[] = [
  'id',
  'title',
  'slug',
  'excerpt',
  'coverImage',
  'published',
  'publishedAt',
  'createdAt',
  'collectionId',
  'aiGenerated',
  'sortOrder',
]

const PUBLIC_PAGE_SIZE = 12
const ADMIN_PAGE_SIZE = 20

export type AdminBlogFilter = 'all' | 'published' | 'draft' | 'duplicate'
export const ADMIN_BLOG_FILTERS: AdminBlogFilter[] = ['all', 'published', 'draft', 'duplicate']

export interface PagedPosts {
  posts: BlogPost[]
  page: number
  pageCount: number
  total: number
}

export interface AdminBlogStats {
  all: number
  published: number
  draft: number
  duplicate: number
}

export interface AdminPagedPosts extends PagedPosts {
  stats: AdminBlogStats
  filter: AdminBlogFilter
  // Sürüklenen satırın global sortOrder'ı için sayfanın başlangıç indeksi
  offset: number
}

// "Aynı yazı iki kez" tespiti: başlık küçültülüp harf/rakam dışındaki her şey
// (boşluk, noktalama, emoji) atılır. "Easy Overnight Oats" ile
// "easy overnight oats!" aynı anahtara düşer. [:alnum:] POSIX sınıfı aksanlı
// harfleri korur — [a-z0-9] olsaydı "Crème Brûlée" -> "crmebrle" olurdu.
const TITLE_KEY_SQL = `regexp_replace(lower(title), '[^[:alnum:]]+', '', 'g')`

@Injectable()
export class BlogService extends BaseContentService<BlogPost> {
  protected readonly entityClass = BlogPost
  protected readonly notFoundMessage = 'Yazı bulunamadı'
  protected readonly fileField = 'coverImage'
  protected readonly uniqueConflictMessage = 'Bu slug zaten kullanımda'

  constructor(
    @InjectRepository(BlogPost) repo: Repository<BlogPost>,
    cache: PublicCacheService,
    @Optional() private readonly coverImages?: AiCoverImageService,
  ) {
    super(repo, cache)
  }

  override async update(id: string, dto: DeepPartial<BlogPost>): Promise<BlogPost> {
    const current = await this.findById(id)
    const firstPublication = dto.published === true && !current.published
    if (firstPublication && current.aiGenerated && !current.coverImage && current.aiImagePrompt && this.coverImages) {
      const generated = await this.coverImages.generate(current.slug, current.title, current.aiImagePrompt)
      if (generated) dto.coverImage = generated
    }
    return super.update(id, dto)
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
    if (typeof post.ingredients === 'string') post.ingredients = sanitizeRichHtml(post.ingredients)
    if (typeof post.method === 'string') post.method = sanitizeRichHtml(post.method)
    if (typeof post.excerpt === 'string') post.excerpt = stripHtml(post.excerpt)
    if (typeof post.authorName === 'string') post.authorName = stripHtml(post.authorName)
    if (typeof post.authorBio === 'string') post.authorBio = stripHtml(post.authorBio)
    stripCardText(post)
  }

  // update() dto'yu hook'tan SONRA entity'ye kopyalar — burada dto temizlenir
  protected onUpdate(post: BlogPost, dto: DeepPartial<BlogPost>): void {
    if (dto.published && !post.published && !post.publishedAt) post.publishedAt = new Date()
    if (typeof dto.content === 'string') dto.content = sanitizeRichHtml(dto.content)
    if (typeof dto.ingredients === 'string') dto.ingredients = sanitizeRichHtml(dto.ingredients)
    if (typeof dto.method === 'string') dto.method = sanitizeRichHtml(dto.method)
    if (typeof dto.excerpt === 'string') dto.excerpt = stripHtml(dto.excerpt)
    if (typeof dto.authorName === 'string') dto.authorName = stripHtml(dto.authorName)
    if (typeof dto.authorBio === 'string') dto.authorBio = stripHtml(dto.authorBio)
    stripCardText(dto)
  }

  // Public liste artık sayfa sayfa iner: 12'lik dilim + toplam sayfa adedi.
  // Anahtar tablo adıyla öneklendiği için her yazma işleminde tüm sayfalar bust.
  findPublicPage(page: number): Promise<PagedPosts> {
    return this.cache.wrap(this.cacheKey(`page:${page}`), async () => {
      const [posts, total] = await this.repo.findAndCount({
        ...this.publicFindOptions(),
        take: PUBLIC_PAGE_SIZE,
        skip: (page - 1) * PUBLIC_PAGE_SIZE,
      })
      return { posts, page, pageCount: pageCountOf(total, PUBLIC_PAGE_SIZE), total }
    })
  }

  // Admin listesi: sayfalama + durum/kopya filtresi. Sekmelerdeki rozetler için
  // dört sayaç her istekte global olarak hesaplanır (quote/logs deseniyle aynı),
  // böylece "Drafts 12" filtre açıkken de doğru kalır.
  async findAdminPage(page: number, filter: AdminBlogFilter): Promise<AdminPagedPosts> {
    const [all, published, duplicateIds] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { published: true } }),
      this.duplicateIds(),
    ])
    const stats: AdminBlogStats = {
      all,
      published,
      draft: all - published,
      duplicate: duplicateIds.length,
    }

    const skip = (page - 1) * ADMIN_PAGE_SIZE
    const base = { page, offset: skip, stats, filter }

    if (filter === 'duplicate') {
      // Kopya sırası SQL'de kuruldu (aynı başlık yan yana); sayfa dilimini
      // o sırayı koruyarak döndür — In() sıralamayı garanti etmez.
      const pageIds = duplicateIds.slice(skip, skip + ADMIN_PAGE_SIZE)
      const rows = pageIds.length
        ? await this.repo.find({ where: { id: In(pageIds) }, select: ADMIN_LIST_FIELDS })
        : []
      const byId = new Map(rows.map(row => [row.id, row]))
      const posts = pageIds.map(id => byId.get(id)).filter((p): p is BlogPost => !!p)
      return {
        ...base,
        posts,
        total: duplicateIds.length,
        pageCount: pageCountOf(duplicateIds.length, ADMIN_PAGE_SIZE),
      }
    }

    const where: FindOptionsWhere<BlogPost> = {}
    if (filter === 'published') where.published = true
    if (filter === 'draft') where.published = false

    const [posts, total] = await this.repo.findAndCount({
      where,
      order: this.defaultOrder(),
      select: ADMIN_LIST_FIELDS,
      take: ADMIN_PAGE_SIZE,
      skip,
    })
    return { ...base, posts, total, pageCount: pageCountOf(total, ADMIN_PAGE_SIZE) }
  }

  // Başlığı normalize edildiğinde en az bir başka yazıyla çakışan kayıtların
  // id'leri, kopyalar ardışık gelecek şekilde sıralı. Pencere fonksiyonu tek
  // taramada hem grubu hem sayısını verir; GROUP BY + ikinci sorgu gerekmez.
  private async duplicateIds(): Promise<string[]> {
    const rows: { id: string }[] = await this.repo.query(
      `SELECT id FROM (
         SELECT id, "createdAt",
                ${TITLE_KEY_SQL} AS dup_key,
                COUNT(*) OVER (PARTITION BY ${TITLE_KEY_SQL}) AS dup_count
         FROM "${this.repo.metadata.tableName}"
       ) t
       WHERE dup_count > 1
       ORDER BY dup_key ASC, "createdAt" ASC`,
    )
    return rows.map(row => row.id)
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

// Boş listede bile pager 1/1 gösterebilsin diye taban 1
function pageCountOf(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size))
}

// Fiche recette'in serbest metin alanları düz yazıdır: HTML kabul edilmez.
function stripCardText(target: DeepPartial<BlogPost>): void {
  for (const field of ['servings', 'course', 'cuisine'] as const) {
    if (typeof target[field] === 'string') {
      target[field] = stripHtml(target[field] as string) as never
    }
  }
}
