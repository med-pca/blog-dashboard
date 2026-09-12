import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'
import { AI_VENDOR_NAMES, type AiVendorName } from '../providers/registry'

export class UpdateAiSettingsDto {
  // Constrained to the registry so an unknown vendor is rejected at the edge
  // rather than silently normalised away inside the service.
  @IsOptional()
  @IsIn(AI_VENDOR_NAMES as unknown as string[], { message: `provider must be one of: ${AI_VENDOR_NAMES.join(', ')}` })
  provider?: AiVendorName

  // Free text on purpose: vendors publish new model ids far more often than we
  // redeploy, and an id the registry has never heard of must still be usable.
  // An empty string is a valid value meaning "use the vendor default".
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  model?: string
}
