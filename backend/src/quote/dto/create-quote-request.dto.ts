import { Equals, IsEmpty, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import type { QuoteServiceType } from '../entities/quote-request.entity'

const SERVICE_TYPES: QuoteServiceType[] = ['cati-ges', 'tarimsal-sulama', 'ev-sarj', 'diger']

export class CreateQuoteRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string

  // International numbers: strip spaces, dashes, dots and parentheses, keep an
  // optional leading "+" so a country code is preserved. "+1 706 575 8955",
  // "706-575-8955" and "0554 379 60 04" all normalise to a clean digit string.
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    const hasPlus = trimmed.startsWith('+')
    const digits = trimmed.replace(/\D/g, '')
    return hasPlus ? `+${digits}` : digits
  })
  // E.164 allows up to 15 digits; 7 is a safe lower bound for any real number.
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Please enter a valid phone number' })
  phone: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string

  @IsIn(SERVICE_TYPES, { message: 'Invalid topic selection' })
  serviceType: QuoteServiceType

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  monthlyBill?: number

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string

  @Equals(true, { message: 'You must accept the Privacy Policy' })
  kvkkConsent: boolean

  // Honeypot: gerçek kullanıcılar bu alanı görmez/doldurmaz. forbidNonWhitelisted
  // açık olduğu için DTO'da tanımlı olmalı; dolu gelirse validasyon 400 döner.
  @IsOptional()
  @IsEmpty()
  website?: string
}
