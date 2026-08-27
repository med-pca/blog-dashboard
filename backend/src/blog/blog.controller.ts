import { Body, Controller, Delete, Get, Header, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ADMIN_BLOG_FILTERS, AdminBlogFilter, BlogService } from './blog.service'
import { CreateBlogPostDto } from './dto/create-blog-post.dto'
import { UpdateBlogPostDto } from './dto/update-blog-post.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ReorderDto } from '../common/dto/reorder.dto'
import { parsePage } from '../common/pagination'
import { BlogCommentService } from './blog-comment.service'
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto'
import { ModerateBlogCommentDto } from './dto/moderate-blog-comment.dto'

@Controller('blog')
export class BlogController {
  constructor(
    private readonly service: BlogService,
    private readonly comments: BlogCommentService,
  ) {}

  // Sayfa sayfa döner: { posts, page, pageCount, total }. Geçersiz ?page= 1'e
  // düşer; aralık dışı sayfada boş liste + gerçek pageCount gelir, böylece
  // /recipes?page=99 pager'ı kaybetmeden son sayfaya dönebilir.
  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  findAll(@Query('page') page?: string) {
    return this.service.findPublicPage(parsePage(page))
  }

  // Bu iki uç ':slug'dan ÖNCE tanımlı olmalı: aksi halde tek segmentli
  // 'collection-counts' slug sanılıp 404 döner (Nest sırayla eşleştirir).
  @Get('collection-counts')
  @Header('Cache-Control', 'public, max-age=60')
  collectionCounts() {
    return this.service.countsByCollection()
  }

  @Get('collection/:collectionId')
  @Header('Cache-Control', 'public, max-age=60')
  findByCollection(@Param('collectionId', ParseUUIDPipe) collectionId: string) {
    return this.service.findByCollection(collectionId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/comments')
  findAllComments() {
    return this.comments.findAllAdmin()
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/comments/:id')
  moderateComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateBlogCommentDto,
  ) {
    return this.comments.moderate(id, dto.status)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/comments/:id')
  @HttpCode(204)
  removeComment(@Param('id', ParseUUIDPipe) id: string) {
    return this.comments.remove(id)
  }

  @Get(':slug/comments')
  @Header('Cache-Control', 'no-store')
  findApprovedComments(@Param('slug') slug: string) {
    return this.comments.findApproved(slug)
  }

  @Post(':slug/comments')
  createComment(@Param('slug') slug: string, @Body() dto: CreateBlogCommentDto) {
    return this.comments.create(slug, dto)
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllAdmin(@Query('page') page?: string, @Query('filter') filter?: string) {
    const narrowed: AdminBlogFilter = ADMIN_BLOG_FILTERS.find(f => f === filter) ?? 'all'
    return this.service.findAdminPage(parsePage(page), narrowed)
  }

  // Liste artık content/ingredients/method taşımadığı için düzenleme formu
  // tek yazıyı buradan tam haliyle çeker. ':slug' tek segmentli olduğundan
  // bu üç segmentli yol onunla çakışmaz.
  @UseGuards(JwtAuthGuard)
  @Get('admin/post/:id')
  findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBlogPostDto) {
    return this.service.create(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.orderedIds, dto.offset ?? 0)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.service.update(id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
