import { ObjectLiteral, Repository } from 'typeorm'

// Sıralamayı N ayrı UPDATE yerine tek CASE'li UPDATE ile yazar.
// Tablo ve kolon adları entity metadata'sından alınır; elle yazılmış kolon adı
// (projects'teki eski `sort_order` literal'i şema ile ayrışıp runtime'da
// patlıyordu) bir daha oluşamaz. id metin olarak karşılaştırılır ki helper
// uuid/text id'li her tabloda çalışsın.
// startIndex, sayfalanmış listelerde gerekir: 2. sayfada sürüklenen satırlar
// yine 0..n-1 alsaydı 1. sayfanın sortOrder'larıyla çakışırdı. Çağıran, sayfanın
// global başlangıç indeksini verir; satırlar startIndex+i ile damgalanır.
export async function reorderByCase<T extends ObjectLiteral>(
  repo: Repository<T>,
  orderedIds: string[],
  startIndex = 0,
): Promise<void> {
  if (!orderedIds.length) return
  const meta = repo.metadata
  const idCol = meta.findColumnWithPropertyName('id')
  const sortCol = meta.findColumnWithPropertyName('sortOrder')
  if (!idCol || !sortCol) {
    throw new Error(`${meta.name} entity'sinde id/sortOrder kolonu bulunamadı`)
  }
  const cases = orderedIds.map((_, i) => `WHEN $${i + 2} THEN ${startIndex + i}`).join(' ')
  await repo.manager.query(
    `UPDATE "${meta.tableName}" SET "${sortCol.databaseName}" = ` +
      `CASE "${idCol.databaseName}"::text ${cases} END ` +
      `WHERE "${idCol.databaseName}"::text = ANY($1)`,
    [orderedIds, ...orderedIds],
  )
}
