import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
  HttpCode,
} from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { MediaService } from './media.service'
import { InstagramParseService } from './instagram-parse.service'
import { InstagramImportService } from './instagram-import.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ParseInstagramDto } from './dto/parse-instagram.dto'
import { ReorderDto } from './dto/reorder.dto'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name)

  constructor(
    private readonly service: ProjectsService,
    private readonly mediaService: MediaService,
    private readonly parseService: InstagramParseService,
    private readonly importService: InstagramImportService,
  ) {}

  // Public endpoints — sunucu 60sn cache'ler (4.4), tarayıcıya da aynı süre verilir
  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  findAll() {
    return this.service.findAllPublic()
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllAdmin() {
    return this.service.findAll()
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/instagram-sync')
  @HttpCode(202)
  syncInstagram() {
    return this.importService.startSyncInstagram()
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/instagram-sync/status')
  getSyncStatus() {
    return this.importService.getSyncStatus()
  }

  // Tighter than the global 60/min: every call spends money at the model
  // vendor, and one admin never needs more than a handful of auto-fills a minute.
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('admin/parse-instagram')
  @HttpCode(200)
  parseInstagram(@Body() dto: ParseInstagramDto) {
    return this.parseService.parseInstagram(dto.text, dto.instruction)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  reorderProjects(@Body() dto: ReorderDto) {
    return this.service.reorderProjects(dto.orderedIds)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':projectId/media/:mediaId')
  @HttpCode(204)
  removeMedia(
    @Param('projectId') projectId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.mediaService.removeMedia(projectId, mediaId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/media/reorder')
  reorderMedia(@Param('id') id: string, @Body() dto: ReorderDto) {
    return this.mediaService.reorderMedia(id, dto.orderedIds)
  }
}
