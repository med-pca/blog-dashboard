import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateBlogPostDto } from '../dto/create-blog-post.dto'

async function validateRating(value: unknown) {
  const dto = plainToInstance(CreateBlogPostDto, {
    title: 'Test recipe',
    slug: 'test-recipe',
    editorialRating: value,
  })
  return validate(dto)
}

describe('CreateBlogPostDto editorialRating', () => {
  it.each([0, 8.5, 10, '9.2'])('accepts a score inside the 0–10 range (%p)', async (value) => {
    await expect(validateRating(value)).resolves.toEqual([])
  })

  it.each([-0.1, 10.1, 8.55])('rejects an invalid score (%p)', async (value) => {
    await expect(validateRating(value)).resolves.not.toEqual([])
  })

  it('allows the score to be omitted or cleared', async () => {
    await expect(validateRating(undefined)).resolves.toEqual([])
    await expect(validateRating('')).resolves.toEqual([])
  })
})
