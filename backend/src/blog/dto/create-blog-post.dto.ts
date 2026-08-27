import { IsBoolean, IsNotEmpty, IsNotIn, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { RESERVED_SLUGS } from '../../common/reserved-slugs'

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug yalnızca küçük harf, rakam ve tire içerebilir' })
  @IsNotIn(RESERVED_SLUGS, { message: 'Bu slug rezerve edilmiş, başka bir slug seçin' })
  slug: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === '' || value === null ? null : Number(value)))
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  editorialRating?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  ingredients?: string

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  method?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authorBio?: string

  // Fiche recette. Formdan boş gelen alan '' olur; null'a çevrilmezse
  // Number('') === 0 olup "0 dakika hazırlık" gibi yanlış veri kaydedilirdi.
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(10080)
  prepMinutes?: number | null

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(10080)
  cookMinutes?: number | null

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(10080)
  totalMinutes?: number | null

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  @MaxLength(80)
  servings?: string | null

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  @MaxLength(80)
  course?: string | null

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  @MaxLength(120)
  cuisine?: string | null

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(100000)
  calories?: number | null

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, { message: 'Geçerli URL veya /uploads/ yolu olmalı' })
  coverImage?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  published?: boolean

  // Yazının bağlandığı koleksiyon. Formdaki "koleksiyon yok" seçeneği boş
  // string gönderir; null'a çevrilir ve IsOptional null'ı geçirir.
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsUUID()
  collectionId?: string | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2147483647)
  @Type(() => Number)
  sortOrder?: number
}
