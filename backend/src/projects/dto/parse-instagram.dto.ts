import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator'

export class ParseInstagramDto {
  // An Instagram caption, or simply the project name/theme to build from.
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string

  // Optional short steer from the admin ("hibrit sistem, batarya vurgusu").
  // Added as an optional field so every existing caller stays valid.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instruction?: string
}
