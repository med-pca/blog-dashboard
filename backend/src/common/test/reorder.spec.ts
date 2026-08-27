import { Repository, ObjectLiteral } from 'typeorm'
import { reorderByCase } from '../reorder'

function makeRepo(overrides: { sortColumn?: string | null } = {}) {
  const query = jest.fn().mockResolvedValue(undefined)
  const column = (databaseName: string) => ({ databaseName })
  const repo = {
    manager: { query },
    metadata: {
      name: 'BlogPost',
      tableName: 'blog_posts',
      findColumnWithPropertyName: (prop: string) => {
        if (prop === 'id') return column('id')
        if (prop === 'sortOrder') {
          return overrides.sortColumn === null ? undefined : column(overrides.sortColumn ?? 'sortOrder')
        }
        return undefined
      },
    },
  }
  return { repo: repo as unknown as Repository<ObjectLiteral>, query }
}

describe('reorderByCase', () => {
  it('writes the whole ordering with a single CASE update', async () => {
    const { repo, query } = makeRepo()
    await reorderByCase(repo, ['a', 'b', 'c'])

    expect(query).toHaveBeenCalledTimes(1)
    const [sql, params] = query.mock.calls[0]
    expect(sql).toBe(
      'UPDATE "blog_posts" SET "sortOrder" = ' +
        'CASE "id"::text WHEN $2 THEN 0 WHEN $3 THEN 1 WHEN $4 THEN 2 END ' +
        'WHERE "id"::text = ANY($1)',
    )
    expect(params).toEqual([['a', 'b', 'c'], 'a', 'b', 'c'])
  })

  it('uses the column name from metadata, never the property name', async () => {
    // projects reorder'ı elle yazılmış `sort_order` yüzünden gerçek şemada
    // patlıyordu; helper adı metadata'dan almak zorunda
    const { repo, query } = makeRepo({ sortColumn: 'sort_order_custom' })
    await reorderByCase(repo, ['a'])
    expect(query.mock.calls[0][0]).toContain('SET "sort_order_custom" =')
  })

  it('offsets the written positions by the page start index', async () => {
    // 2. sayfa 0'dan başlasaydı 1. sayfanın sortOrder'larıyla çakışırdı
    const { repo, query } = makeRepo()
    await reorderByCase(repo, ['a', 'b'], 20)

    expect(query.mock.calls[0][0]).toContain('WHEN $2 THEN 20 WHEN $3 THEN 21')
  })

  it('starts at 0 when no offset is given', async () => {
    const { repo, query } = makeRepo()
    await reorderByCase(repo, ['a', 'b'])
    expect(query.mock.calls[0][0]).toContain('WHEN $2 THEN 0 WHEN $3 THEN 1')
  })

  it('is a no-op for an empty list', async () => {
    const { repo, query } = makeRepo()
    await reorderByCase(repo, [])
    expect(query).not.toHaveBeenCalled()
  })

  it('throws a clear error when the entity has no sortOrder column', async () => {
    const { repo } = makeRepo({ sortColumn: null })
    await expect(reorderByCase(repo, ['a'])).rejects.toThrow('sortOrder kolonu bulunamadı')
  })
})
