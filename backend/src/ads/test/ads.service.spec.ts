import { Repository } from 'typeorm'
import { AdsService } from '../ads.service'
import { AppSetting } from '../../instagram-token/app-setting.entity'

function makeService(stored?: string): { service: AdsService; save: jest.Mock } {
  const save = jest.fn().mockImplementation((row: AppSetting) => Promise.resolve(row))
  const repo = {
    findOne: jest.fn().mockResolvedValue(stored === undefined ? null : { key: 'adsense_settings', value: stored }),
    save,
  }
  return { service: new AdsService(repo as unknown as Repository<AppSetting>), save }
}

const FULL = JSON.stringify({
  enabled: true,
  clientId: 'ca-pub-1234567890123456',
  slots: {
    blogList: '1111111111',
    blogArticleTop: '2222222222',
    blogArticleBottom: '',
    recipeDetail: '',
  },
})

describe('AdsService', () => {
  it('returns disabled defaults when nothing is stored', async () => {
    const { service } = makeService()
    await expect(service.get()).resolves.toEqual({
      enabled: false,
      clientId: '',
      slots: { blogList: '', blogArticleTop: '', blogArticleBottom: '', recipeDetail: '' },
    })
  })

  it('falls back to defaults instead of throwing on corrupted JSON', async () => {
    const { service } = makeService('{not json')
    await expect(service.get()).resolves.toMatchObject({ enabled: false, clientId: '' })
  })

  it('fills in placements missing from the stored blob', async () => {
    const { service } = makeService(JSON.stringify({ enabled: true, clientId: 'ca-pub-1234567890123456' }))
    const settings = await service.get()
    expect(settings.slots).toEqual({ blogList: '', blogArticleTop: '', blogArticleBottom: '', recipeDetail: '' })
  })

  it('exposes the full config publicly once enabled and configured', async () => {
    const { service } = makeService(FULL)
    const pub = await service.getPublic()
    expect(pub.enabled).toBe(true)
    expect(pub.clientId).toBe('ca-pub-1234567890123456')
    expect(pub.slots.blogList).toBe('1111111111')
  })

  it('hides the client id publicly when ads are disabled', async () => {
    const { service } = makeService(JSON.stringify({ ...JSON.parse(FULL), enabled: false }))
    await expect(service.getPublic()).resolves.toEqual({
      enabled: false,
      clientId: '',
      slots: { blogList: '', blogArticleTop: '', blogArticleBottom: '', recipeDetail: '' },
    })
  })

  it('hides the config publicly when enabled but no client id is set', async () => {
    const { service } = makeService(JSON.stringify({ enabled: true, clientId: '', slots: { blogList: '1111111111' } }))
    await expect(service.getPublic()).resolves.toMatchObject({ enabled: false, slots: { blogList: '' } })
  })

  it('merges a partial update onto the stored settings', async () => {
    const { service, save } = makeService(FULL)
    const next = await service.update({ slots: { blogArticleBottom: '3333333333' } })

    expect(next.enabled).toBe(true)
    expect(next.clientId).toBe('ca-pub-1234567890123456')
    expect(next.slots.blogList).toBe('1111111111')
    expect(next.slots.blogArticleBottom).toBe('3333333333')
    expect(JSON.parse(save.mock.calls[0][0].value)).toEqual(next)
  })

  it('trims whitespace pasted from the AdSense dashboard', async () => {
    const { service } = makeService()
    const next = await service.update({
      enabled: true,
      clientId: '  ca-pub-1234567890123456  ',
      slots: { blogList: ' 1111111111 ' },
    })
    expect(next.clientId).toBe('ca-pub-1234567890123456')
    expect(next.slots.blogList).toBe('1111111111')
  })

  it('can turn ads off without losing the configured slots', async () => {
    const { service } = makeService(FULL)
    const next = await service.update({ enabled: false })
    expect(next.enabled).toBe(false)
    expect(next.slots.blogList).toBe('1111111111')
  })

  it('builds the ads.txt line from the publisher id', async () => {
    const { service } = makeService(FULL)
    await expect(service.adsTxt()).resolves.toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    )
  })

  it('still serves ads.txt while ads are switched off, so Google can verify', async () => {
    const { service } = makeService(JSON.stringify({ ...JSON.parse(FULL), enabled: false }))
    await expect(service.adsTxt()).resolves.toContain('pub-1234567890123456')
  })

  it('returns no ads.txt line when no publisher id is configured', async () => {
    const { service } = makeService()
    await expect(service.adsTxt()).resolves.toBe('')
  })
})
