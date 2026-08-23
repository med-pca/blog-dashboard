import { Equals, IsEmail, IsEmpty, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateQuoteRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string

  // The only channel we publish is email, so it is the only one we collect —
  // asking for a phone number on a recipe blog fails data minimisation and
  // reads as lead capture rather than contact.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(180)
  email: string

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
