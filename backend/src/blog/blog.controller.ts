import { Body, Controller, Delete, Get, Header, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { BlogService } from './blog.service'
import { CreateBlogPostDto } from './dto/create-blog-post.dto'
import { UpdateBlogPostDto } from './dto/update-blog-post.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ReorderDto } from '../common/dto/reorder.dto'

@Controller('blog')
export class BlogController {
  constructor(private readonly service: BlogService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  findAll() {
    return this.service.findAllPublic()
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

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllAdmin() {
    return this.service.findAll()
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBlogPostDto) {
    return this.service.create(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.orderedIds)
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
