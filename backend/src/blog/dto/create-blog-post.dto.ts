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
  @IsString()
  @MaxLength(100000)
  content?: string

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
