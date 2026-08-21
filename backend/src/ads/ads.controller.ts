import { Body, Controller, Get, Header, Put, UseGuards } from '@nestjs/common'
import { AdsService } from './ads.service'
import { UpdateAdsDto } from './dto/update-ads.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('ads')
export class AdsController {
  constructor(private readonly service: AdsService) {}

  // Public: read by every visitor on first page load, so it is cached briefly.
  @Get('config')
  @Header('Cache-Control', 'public, max-age=60')
  config() {
    return this.service.getPublic()
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  findAdmin() {
    return this.service.get()
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin')
  update(@Body() dto: UpdateAdsDto) {
    return this.service.update(dto)
  }
}
