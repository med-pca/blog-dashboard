import { IsArray, IsNumber, IsOptional, IsString, ArrayMaxSize, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { StatBoxDto } from './create-project.dto'
import type { ParsedProject } from '../instagram-types'

// Auto-fill çıktısının şeması. Instagram importu projeyi manager.save ile
// yazdığından CreateProjectDto'nun ValidationPipe'ı bu yolda HİÇ çalışmıyor;
// manuel girişe uygulanan garantilerin LLM girişine de uygulanması için
// instagram-parse.service bu DTO'yu elle validate eder.
//
// İki bilinçli fark var (CreateProjectDto'dan kopyalanmamalı):
//  1. @IsNotEmpty YOK — prompt modele "emin olamadığın alanlar için boş
//     string ya da boş dizi kullan" diyor, yani "" MEŞRU bir yanıt. Import
//     servisi zaten `parsed.x || default` ile dolduruyor.
//  2. Hepsi @IsOptional — model alan atlayabilir (ParsedProject de öyle tanımlı).
export class ParsedProjectDto implements ParsedProject {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string

  // @Type(() => Number) BİLİNÇLİ olarak yok: prompt kw'yi JS sayısı olarak
  // istiyor (diğer alanlarda Türkçe ondalık virgül kuralı var). Coercion
  // olsaydı "11.25" sessizce geçer, "11,25" ise NaN'a düşerdi; string kw
  // model hatasıdır ve reddedilmeli — numeric(10,2) kolonuna gidiyor.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99999999.99)
  kw?: number

  // Boş stringe izin verir ("emin değilsen boş bırak"), "Ağustos 2025" reddedilir.
  @IsOptional()
  @IsString()
  @Matches(/^(\d{4})?$/, { message: 'Tarih 4 haneli yıl olmalı veya boş bırakılmalı' })
  date?: string

  // 255 sınırı şart: daha uzun bir açıklama DB'ye girerse o satır admin
  // panelinden bir daha kaydedilemez (edit CreateProjectDto'nun 255'ine çarpar).
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  specs?: string[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  highlights?: string[]

  // jsonb kolonu ve frontend bunu doğrudan render ediyor (ProjeDetay.jsx) —
  // nesne olmayan eleman render'da patlar, bu yüzden ValidateNested şart.
  // Grid 2 veya 3 sütun varsayıyor; 10 üstü zaten anlamsız.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => StatBoxDto)
  statBoxes?: StatBoxDto[]

  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string | null
}
