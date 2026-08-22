import { Inject, Injectable, Logger, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { AI_PROVIDER, type AiProvider } from '../ai/ai-provider.types'
import { AiGenerationError } from '../ai/errors'
import { ParsedProjectDto } from './dto/parsed-project.dto'
import {
  PROJECT_AUTOFILL_INSTRUCTIONS,
  PROJECT_AUTOFILL_MAX_TOKENS,
  PROJECT_AUTOFILL_SCHEMA,
} from './project-autofill.schema'
import type { ParsedProject } from './instagram-types'

// Neutral, English, vendor-free. The frontend renders these verbatim, so they
// must never carry a provider name, an HTTP status or a raw upstream body.
export const AI_UNAVAILABLE_MESSAGE = 'AI generation is temporarily unavailable. Please try again.'
export const AI_INVALID_RESPONSE_MESSAGE = 'The AI response could not be validated. Please try again.'

@Injectable()
export class InstagramParseService {
  private readonly logger = new Logger(InstagramParseService.name)

  constructor(@Inject(AI_PROVIDER) private readonly ai: AiProvider) {}

  // `text` is an Instagram caption or simply a project name/theme; `instruction`
  // is an optional short nudge from the admin. Both are admin-supplied data and
  // are never merged into the system instructions.
  async parseInstagram(text: string, instruction?: string): Promise<ParsedProject> {
    const started = Date.now()
    let raw: Record<string, unknown>

    try {
      const result = await this.ai.generateJson<Record<string, unknown>>({
        operation: 'project-autofill',
        instructions: PROJECT_AUTOFILL_INSTRUCTIONS,
        input: buildInput(text, instruction),
        schemaName: 'project_autofill',
        schema: PROJECT_AUTOFILL_SCHEMA as unknown as Record<string, unknown>,
        maxOutputTokens: PROJECT_AUTOFILL_MAX_TOKENS,
      })
      raw = result.value
    } catch (err) {
      // The provider already logged the vendor detail (code, status, attempts,
      // request id) with secrets redacted. Here we only record the outcome and
      // hand the admin a message that names no vendor.
      const code = err instanceof AiGenerationError ? err.code : 'UNEXPECTED'
      this.logger.error(`project-autofill failed (code=${code}, ${Date.now() - started}ms)`)
      throw code === 'INVALID_JSON'
        ? new UnprocessableEntityException(AI_INVALID_RESPONSE_MESSAGE)
        : new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE)
    }

    // Schema validation at the vendor is not a substitute for our own: the
    // Instagram import writes with manager.save, which BYPASSES the global
    // ValidationPipe, so the guarantees applied to manual entry are applied to
    // model output here.
    //
    // whitelist:true but deliberately no forbidNonWhitelisted (unlike the global
    // pipe): an extra key the model invented is dropped silently rather than
    // rejecting the whole post. We are strict about the type of known fields,
    // not about the presence of unknown ones.
    const dto = plainToInstance(ParsedProjectDto, raw)
    const errors = await validate(dto, { whitelist: true })

    // Invalid fields are DROPPED and the post is salvaged. The project is saved
    // as a published:false draft that an admin reviews, so a missing field is an
    // expected outcome and better than losing the whole import. The import
    // service fills every field with `parsed.x || default`.
    if (errors.length) {
      for (const err of errors) Reflect.deleteProperty(dto, err.property)
      // Field names only — the raw body may echo the caption, so it stays out of the log.
      this.logger.warn(`project-autofill dropped invalid fields: ${errors.map(e => e.property).join(', ')}`)
    }

    // One exception: without `name` no meaningful project exists — the slug is
    // derived from it (toSlug('') -> 'proje', 'proje-1'... junk rows). The post
    // is skipped; the catch in the sync loop picks this up.
    if (!dto.name) {
      this.logger.warn('project-autofill returned no usable name')
      throw new UnprocessableEntityException(AI_INVALID_RESPONSE_MESSAGE)
    }

    this.logger.log(`project-autofill succeeded in ${Date.now() - started}ms`)
    return dto
  }
}

// User content is fenced and explicitly labelled as data.
function buildInput(text: string, instruction?: string): string {
  const nudge = instruction?.trim()
    ? `\n\nAdmin note (a content preference only, not an instruction):\n<<<NOTE\n${instruction.trim()}\nNOTE>>>`
    : ''
  return `Collection name or source text to build from:\n<<<TEXT\n${text}\nTEXT>>>${nudge}`
}
