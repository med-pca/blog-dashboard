import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateBlogCommentDto } from '../dto/create-blog-comment.dto'
import { ModerateBlogCommentDto } from '../dto/moderate-blog-comment.dto'

describe('blog comment DTOs', () => {
  it('accepts a valid public comment', async () => {
    const dto = plainToInstance(CreateBlogCommentDto, {
      authorName: 'Sarah Cook',
      authorEmail: 'sarah@example.com',
      content: 'This recipe worked well for my family.',
    })
    expect(await validate(dto)).toHaveLength(0)
  })

  it('rejects invalid email and empty content', async () => {
    const dto = plainToInstance(CreateBlogCommentDto, {
      authorName: 'Sarah',
      authorEmail: 'not-an-email',
      content: '',
    })
    expect((await validate(dto)).length).toBeGreaterThanOrEqual(2)
  })

  it('only accepts known moderation statuses', async () => {
    const dto = plainToInstance(ModerateBlogCommentDto, { status: 'visible' })
    expect(await validate(dto)).not.toHaveLength(0)
  })
})
