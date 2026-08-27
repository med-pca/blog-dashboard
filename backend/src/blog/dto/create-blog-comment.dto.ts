import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateBlogCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  authorName: string

  @IsEmail()
  @MaxLength(254)
  authorEmail: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  content: string
}
