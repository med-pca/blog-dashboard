import { Injectable, Logger } from '@nestjs/common'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { UPLOADS_DIR } from '../upload/uploaded-files'
import { AiConfig } from './ai.config'
import { OpenAiClient } from './openai.client'

@Injectable()
export class AiCoverImageService {
  private readonly logger = new Logger(AiCoverImageService.name)
  constructor(private readonly client: OpenAiClient, private readonly config: AiConfig) {}

  async generate(slug: string, title: string, dishDescription: string): Promise<string | null> {
    if (!this.config.imageEnabled) return null
    const prompt = [
      `Create one realistic editorial food photograph for the recipe “${title}”.`,
      `Exact dish: ${dishDescription}`,
      'Match the Pulse Recipe visual identity: warm natural window light, realistic colors, muted cream and soft green accents, simple ceramic tableware, natural linen, uncluttered composition, landscape 3:2 framing, three-quarter overhead camera angle.',
      'Show only ingredients and garnishes explicitly present in the exact dish description. Do not substitute ingredients or add decorative herbs, sauces, side dishes or drinks.',
      'No people, hands, faces, packaging, text, typography, logo or watermark. Avoid artificial gloss, impossible textures, duplicated food and malformed tableware.',
    ].join('\n')
    try {
      const png = await this.client.generateImage({ operation: 'blog:cover-image', model: this.config.imageModel, prompt, size: this.config.imageSize, quality: this.config.imageQuality, timeoutMs: this.config.timeoutMs })
      await mkdir(UPLOADS_DIR, { recursive: true })
      const filename = `${slug}-ai-cover-${Date.now()}.webp`
      await sharp(png).rotate().webp({ quality: 84 }).toFile(join(UPLOADS_DIR, filename))
      return `/uploads/${filename}`
    } catch (err) {
      this.logger.warn(`Cover image skipped for ${slug}: ${err instanceof Error ? err.message : 'unknown error'}`)
      return null
    }
  }
}
