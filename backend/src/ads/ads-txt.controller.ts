import { Controller, Get, Header, NotFoundException } from '@nestjs/common'
import { AdsService } from './ads.service'

// Served at the domain root (nginx proxies /ads.txt here, same pattern as
// /sitemap.xml) so the publisher id only ever has to be typed once, in the
// admin panel.
@Controller('ads.txt')
export class AdsTxtController {
  constructor(private readonly service: AdsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async getAdsTxt(): Promise<string> {
    const line = await this.service.adsTxt()
    // An ads.txt that exists but names no seller tells Google that nobody is
    // authorised, which blocks ads outright — strictly worse than serving no
    // file at all. So 404 until a publisher id is configured.
    if (!line) throw new NotFoundException()
    return line
  }
}
