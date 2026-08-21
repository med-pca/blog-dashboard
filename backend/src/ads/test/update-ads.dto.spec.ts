// Decorator metadata is normally set up by the Nest bootstrap; unit tests that
// validate a DTO in isolation have to load it themselves.
import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { UpdateAdsDto } from '../dto/update-ads.dto'

async function errorsFor(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(UpdateAdsDto, payload)
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
  return errors.flatMap((e) => [
    ...Object.values(e.constraints ?? {}),
    ...(e.children ?? []).flatMap((c) => Object.values(c.constraints ?? {})),
  ])
}

describe('UpdateAdsDto', () => {
  it('accepts a fully filled, valid payload', async () => {
    await expect(
      errorsFor({
        enabled: true,
        clientId: 'ca-pub-1234567890123456',
        slots: {
          blogList: '1234567890',
          blogArticleTop: '0987654321',
          blogArticleBottom: '1122334455',
          recipeDetail: '5566778899',
        },
      }),
    ).resolves.toEqual([])
  })

  it('accepts empty strings so a placement can be cleared', async () => {
    await expect(
      errorsFor({ clientId: '', slots: { blogList: '', recipeDetail: '' } }),
    ).resolves.toEqual([])
  })

  it('rejects a publisher id in the wrong shape', async () => {
    await expect(errorsFor({ clientId: 'pub-1234567890123456' })).resolves.toContain(
      'clientId must look like ca-pub-1234567890123456',
    )
    await expect(errorsFor({ clientId: 'ca-pub-123' })).resolves.toContain(
      'clientId must look like ca-pub-1234567890123456',
    )
  })

  it('rejects a non-numeric slot id', async () => {
    await expect(errorsFor({ slots: { blogList: 'abc123' } })).resolves.toContain(
      'blogList must be a numeric AdSense slot id',
    )
  })

  it('rejects an unknown placement key', async () => {
    const errors = await errorsFor({ slots: { sidebar: '1234567890' } })
    expect(errors.join(' ')).toMatch(/sidebar/)
  })

  it('coerces the enabled flag sent as a string', async () => {
    const dto = plainToInstance(UpdateAdsDto, { enabled: 'true' })
    expect(dto.enabled).toBe(true)
    await expect(errorsFor({ enabled: 'true' })).resolves.toEqual([])
  })
})
