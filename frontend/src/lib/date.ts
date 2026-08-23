// <input type="date"> yerel (TR) gün verir, backend UTC ISO bekler. Yerel gün
// sınırlarını (00:00 - 23:59:59.999) ISO'ya çevirir; boş/geçersiz girdi atlanır.
export function dayRangeToIso(fromDay?: string, toDay?: string): { from?: string; to?: string } {
  const result: { from?: string; to?: string } = {}
  if (fromDay) {
    const start = new Date(`${fromDay}T00:00:00`)
    if (!isNaN(start.getTime())) result.from = start.toISOString()
  }
  if (toDay) {
    const end = new Date(`${toDay}T23:59:59.999`)
    if (!isNaN(end.getTime())) result.to = end.toISOString()
  }
  return result
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Admin listelerinde kayıt zaman damgası göstermek için: formatDate'ten
// farklı olarak saat/dakika içerir ve ayı kısaltır.
export function formatDateTime(value: string): string {
  // Admin timestamps keep the existing Turkish back-office convention. Public
  // recipe dates use formatDate() above and are rendered in English.
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
