import { IsBoolean, IsObject, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator'
import { Transform, Type } from 'class-transformer'

// AdSense publisher id, e.g. ca-pub-1234567890123456. Empty means "not configured".
const CLIENT_ID = /^(ca-pub-\d{16})?$/
// Ad unit slot id: AdSense issues 10-digit numeric ids. Empty means "no ad here".
const SLOT_ID = /^(\d{6,20})?$/

export class AdSlotsDto {
  @IsOptional() @IsString() @Matches(SLOT_ID, { message: 'blogList must be a numeric AdSense slot id' })
  blogList?: string

  @IsOptional() @IsString() @Matches(SLOT_ID, { message: 'blogArticleTop must be a numeric AdSense slot id' })
  blogArticleTop?: string

  @IsOptional() @IsString() @Matches(SLOT_ID, { message: 'blogArticleBottom must be a numeric AdSense slot id' })
  blogArticleBottom?: string

  @IsOptional() @IsString() @Matches(SLOT_ID, { message: 'recipeDetail must be a numeric AdSense slot id' })
  recipeDetail?: string
}

export class UpdateAdsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  enabled?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(CLIENT_ID, { message: 'clientId must look like ca-pub-1234567890123456' })
  clientId?: string

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AdSlotsDto)
  slots?: AdSlotsDto
}
