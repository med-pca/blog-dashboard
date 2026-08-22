import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { IsTimezone } from './is-timezone.validator'

// Absolute ceiling; the effective per-campaign cap is the smaller of this and
// AI_DAILY_MAX_PER_CAMPAIGN, enforced in AiCampaignService.
export const DAILY_TARGET_HARD_MAX = 500
export const MASTER_PROMPT_MAX = 4000

export class CreateAiCampaignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string

  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'masterPrompt must describe the brief in at least 20 characters' })
  @MaxLength(MASTER_PROMPT_MAX)
  masterPrompt: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tone?: string

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(3000)
  @Type(() => Number)
  targetWords?: number

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((k: unknown) => String(k).trim()).filter(Boolean) : value,
  )
  keywords?: string[]

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(DAILY_TARGET_HARD_MAX)
  @Type(() => Number)
  dailyTarget?: number

  @IsOptional()
  @IsInt()
  @Min(5, { message: 'intervalMinutes must be at least 5' })
  @Max(1440)
  @Type(() => Number)
  intervalMinutes?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  generationStartHour?: number

  // 24 means "until local midnight".
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  generationEndHour?: number

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsTimezone()
  timezone?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  enabled?: boolean
}
