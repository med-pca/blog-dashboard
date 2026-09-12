import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AiSettingsService } from './ai-settings.service'
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto'

// Admin-only throughout: which model vendor the site runs on is operational
// detail, and the payload names the environment variables a vendor needs. No
// endpoint here ever returns a key — only whether one is present.
@UseGuards(JwtAuthGuard)
@Controller('ai/settings')
export class AiSettingsController {
  constructor(private readonly settings: AiSettingsService) {}

  @Get()
  view() {
    return this.settings.view()
  }

  // PATCH, not PUT: every field of the DTO is optional and the service merges
  // into the stored settings. It also keeps the route inside the CORS method
  // allow-list in main.ts, which does not include PUT.
  @Patch()
  update(@Body() dto: UpdateAiSettingsDto) {
    return this.settings.update(dto)
  }
}
