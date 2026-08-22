import { Repository } from 'typeorm'
import { BlogService } from '../blog.service'
import { BlogPost } from '../entities/blog-post.entity'
import { sanitizeAiHtml, sanitizeRichHtml, stripHtml } from '../../common/html-sanitize'
import { PublicCacheService } from '../../common/public-cache.service'

function makeService() {
  const repo = {
    create: jest.fn((dto: Partial<BlogPost>) => ({ ...dto })),
    save: jest.fn((entity: BlogPost) => Promise.resolve(entity)),
    findOne: jest.fn(),
    metadata: { tableName: 'blog_posts' },
  } as unknown as Repository<BlogPost>

  return { service: new BlogService(repo, new PublicCacheService()), repo }
}

describe('sanitizeRichHtml', () => {
  it('strips script tags and event handlers', () => {
    expect(sanitizeRichHtml('<p>merhaba<script>alert(1)</script></p>')).toBe('<p>merhaba</p>')
    expect(sanitizeRichHtml('<p onclick="alert(1)">tıkla</p>')).toBe('<p>tıkla</p>')
    expect(sanitizeRichHtml('<img src="x" onerror="alert(1)">güneş')).toBe('güneş')
  })

  it('blocks javascript: links and forces rel on anchors', () => {
    expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a rel="noopener noreferrer">x</a>',
    )
    expect(sanitizeRichHtml('<a href="https://ornek.com" target="_blank">x</a>')).toBe(
      '<a href="https://ornek.com" target="_blank" rel="noopener noreferrer">x</a>',
    )
  })

  it('drops style properties outside the editor allowlist', () => {
    expect(sanitizeRichHtml('<p style="position:fixed;top:0">x</p>')).toBe('<p>x</p>')
    expect(sanitizeRichHtml('<span style="background:url(javascript:alert(1))">x</span>')).toBe(
      '<span>x</span>',
    )
  })

  it('preserves legitimate tiptap output untouched', () => {
    const samples = [
      '<h2>Başlık</h2><p>Paragraf <strong>kalın</strong> <em>eğik</em> <u>altçizgi</u> <s>üstü çizili</s></p>',
      '<p style="text-align:center">ortalı</p>',
      '<p><span style="color:#448834">yeşil</span> <span style="font-family:Georgia, serif">serif</span></p>',
      '<ul><li>bir</li><li>iki</li></ul><ol><li>üç</li></ol>',
      '<blockquote><p>alıntı</p></blockquote><pre><code>kod()</code></pre><hr />',
    ]
    for (const html of samples) {
      expect(sanitizeRichHtml(html)).toBe(html)
    }
  })
})

describe('stripHtml', () => {
  it('reduces markup to plain text', () => {
    expect(stripHtml('<p>özet <strong>metni</strong></p>')).toBe('özet metni')
    expect(stripHtml('<script>alert(1)</script>düz')).toBe('düz')
  })
})

describe('BlogService — yazma anında sanitize', () => {
  it('sanitizes content and excerpt on create', async () => {
    const { service } = makeService()

    const saved = await service.create({
      title: 'Test',
      slug: 'test',
      content: '<p>güvenli</p><script>alert(1)</script>',
      excerpt: '<b>özet</b>',
    })

    expect(saved.content).toBe('<p>güvenli</p>')
    expect(saved.excerpt).toBe('özet')
  })

  it('sanitizes incoming content on update while keeping stored data intact', async () => {
    const { service, repo } = makeService()
    ;(repo.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      title: 'Eski',
      slug: 'eski',
      content: '<p>eski içerik</p>',
      excerpt: 'eski özet',
      published: true,
      publishedAt: new Date(),
    })

    const saved = await service.update('1', {
      content: '<p style="text-align:right">yeni</p><iframe src="https://kotu.example"></iframe>',
    })

    expect(saved.content).toBe('<p style="text-align:right">yeni</p>')
    expect(saved.excerpt).toBe('eski özet')
  })
})

describe('BlogService — findBySlug cache (4.4)', () => {
  it('bulunan yazı 60sn cache\'lenir', async () => {
    const { service, repo } = makeService()
    ;(repo.findOne as jest.Mock).mockResolvedValue({ id: '1', slug: 'ges', published: true })
    await service.findBySlug('ges')
    await service.findBySlug('ges')
    expect(repo.findOne).toHaveBeenCalledTimes(1)
  })

  it('NotFound cache\'lenmez (rastgele slug\'la cache şişirilemez)', async () => {
    const { service, repo } = makeService()
    ;(repo.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValue({ id: '1', slug: 'yeni', published: true })
    await expect(service.findBySlug('yeni')).rejects.toThrow('Yazı bulunamadı')
    await expect(service.findBySlug('yeni')).resolves.toMatchObject({ slug: 'yeni' })
    expect(repo.findOne).toHaveBeenCalledTimes(2)
  })
})

describe('sanitizeAiHtml — generated article allowlist', () => {
  it('keeps the tags a generated article is allowed to use', () => {
    const html =
      '<h2>Bölüm</h2><h3>Alt başlık</h3><p>Metin <strong>kalın</strong> <em>eğik</em></p>' +
      '<ul><li>bir</li></ul><ol><li>iki</li></ol><blockquote>alıntı</blockquote>'
    expect(sanitizeAiHtml(html)).toBe(html)
  })

  it('strips everything the editor allows but a generated article must not emit', () => {
    expect(sanitizeAiHtml('<p style="text-align:center">x</p>')).toBe('<p>x</p>')
    expect(sanitizeAiHtml('<span style="color:#fff">x</span>')).toBe('x')
    expect(sanitizeAiHtml('<pre><code>rm -rf /</code></pre>')).toBe('rm -rf /')
    expect(sanitizeAiHtml('<img src="x.png">metin')).toBe('metin')
    expect(sanitizeAiHtml('<iframe src="https://kotu.example"></iframe>metin')).toBe('metin')
    expect(sanitizeAiHtml('<p onclick="alert(1)">x</p>')).toBe('<p>x</p>')
  })

  it('demotes a stray h1 rather than dropping its text', () => {
    expect(sanitizeAiHtml('<h1>Başlık</h1>')).toBe('<h2>Başlık</h2>')
    expect(sanitizeAiHtml('<h4>Derin</h4>')).toBe('<h3>Derin</h3>')
  })

  it('allows only https links and always forces rel', () => {
    expect(sanitizeAiHtml('<a href="https://ornek.com">x</a>')).toBe(
      '<a href="https://ornek.com" rel="noopener noreferrer">x</a>',
    )
    expect(sanitizeAiHtml('<a href="http://ornek.com">x</a>')).toBe('<a rel="noopener noreferrer">x</a>')
    expect(sanitizeAiHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a rel="noopener noreferrer">x</a>')
  })
})
