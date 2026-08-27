import { IsEnum } from 'class-validator'
import { BlogCommentStatus } from '../entities/blog-comment.entity'

export class ModerateBlogCommentDto {
  @IsEnum(BlogCommentStatus)
  status: BlogCommentStatus
}
