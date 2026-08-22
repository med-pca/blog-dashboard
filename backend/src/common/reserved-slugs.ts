// GET :slug rotalarıyla aynı controller'daki sabit path'ler (admin/*) çakışmasın:
// slug'ı "admin" olan içerik, /api/projects/admin gibi bir URL'de içerik servis
// ederdi. DTO validasyonu (IsNotIn) ve otomatik slug üretimi (uniqueSlug) bu
// listeyi birlikte kullanır.
// 'collection-counts' blog controller'ında ':slug'dan önce tanımlı sabit bir
// path; slug olarak kullanılırsa yazı hiçbir zaman servis edilemezdi.
export const RESERVED_SLUGS = ['admin', 'collection', 'collection-counts']
