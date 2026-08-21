// GES tasarruf hesaplayıcı sabitleri — tümü yaklaşık değerlerdir ve tek yerden güncellenir.
// Birim fiyatlar vergiler dahil ortalama satış fiyatıdır (TL/kWh); EPDK tarifeleri
// üç ayda bir (Ocak/Nisan/Temmuz/Ekim) değişir, bu tabloyu o dönemlerde güncelleyin.
// Son güncelleme: Temmuz 2026.
export interface TariffTier {
  // Bu kademenin kapsadığı aylık tüketim üst sınırı (kWh); son kademede tanımsız (sınırsız)
  uptoKwh?: number;
  price: number;
}

export interface Tariff {
  id: string;
  label: string;
  tiers: TariffTier[];
}

export const TARIFFS: Tariff[] = [
  // Mesken kademeli: günlük 8 kWh (aylık ~240 kWh) eşiği (Haziran 2026, vergiler dahil)
  {
    id: "mesken",
    label: "Home Cooking",
    tiers: [{ uptoKwh: 240, price: 3.24 }, { price: 4.86 }],
  },
  // Ticarethane kademeli: günlük 30 kWh (aylık ~900 kWh) eşiği
  // (Nisan 2026 vergi hariç tarifeye BTV %5 + KDV %20 eklenmiş yaklaşık değerler)
  {
    id: "ticarethane",
    label: "Small Cafe",
    tiers: [{ uptoKwh: 900, price: 6.75 }, { price: 7.45 }],
  },
  // Sanayi AG tek terimli, tek kademe (Nisan 2026 vergi hariç tarifeye BTV %1 + KDV %20 eklenmiş)
  { id: "sanayi", label: "Batch Kitchen", tiers: [{ price: 5.85 }] },
];

// Ege bölgesi ortalama özgül üretim (kWh/kWp/yıl)
const SPECIFIC_YIELD = 1450;
// Panel başına güç (kWp) — 550W panel varsayımı
const PANEL_KWP = 0.55;
// kWp başına gereken yaklaşık çatı alanı (m²)
const AREA_M2_PER_KWP = 5;

const MAX_BILL = 10000000;

export interface GesResult {
  monthlyKwh: number;
  annualKwh: number;
  systemKwp: number;
  panelCount: number;
  roofArea: number;
  annualProduction: number;
  annualSavings: number;
}

// Kullanıcı yazarken binlik ayraçlarla girilen değeri ham rakamlara indirger (üst sınırla kırpar).
export function parseBillInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";
  return String(Math.min(Number(digits), MAX_BILL));
}

// Aylık tüketimin (kWh) kademeli tarifedeki fatura tutarını verir (TL).
export function monthlyKwhToBill(monthlyKwh: number, tariff: Tariff): number {
  let bill = 0;
  let prevLimit = 0;
  for (const tier of tariff.tiers) {
    const upper = tier.uptoKwh ?? Infinity;
    const kwhInTier = Math.min(monthlyKwh, upper) - prevLimit;
    if (kwhInTier <= 0) break;
    bill += kwhInTier * tier.price;
    prevLimit = upper;
  }
  return bill;
}

// Fatura tutarından (TL) aylık tüketimi (kWh) bulur: kademeler ucuzdan pahalıya
// sırayla doldurulur, tutarın kalanı içinde bulunduğu kademenin fiyatına bölünür.
export function billToMonthlyKwh(monthlyBill: number, tariff: Tariff): number {
  let remaining = monthlyBill;
  let kwh = 0;
  for (const tier of tariff.tiers) {
    const upper = tier.uptoKwh ?? Infinity;
    const tierCost = (upper - kwh) * tier.price;
    if (remaining <= tierCost) return kwh + remaining / tier.price;
    remaining -= tierCost;
    kwh = upper;
  }
  return kwh;
}

export function calculateGes(
  monthlyBill: number,
  tariffId: string,
): GesResult | null {
  const tariff = TARIFFS.find((t) => t.id === tariffId) ?? TARIFFS[0];
  if (!monthlyBill || monthlyBill <= 0) return null;

  const monthlyKwh = billToMonthlyKwh(monthlyBill, tariff);
  const annualKwh = monthlyKwh * 12;

  // Temel birim panel adedidir: yıllık tüketimi karşılayan en küçük tam panel sayısı
  // seçilir, kurulu güç / üretim / çatı alanı hep bu adetten türetilir.
  const panelCount = Math.max(
    1,
    Math.ceil(annualKwh / SPECIFIC_YIELD / PANEL_KWP),
  );
  const systemKwp = Math.round(panelCount * PANEL_KWP * 10) / 10;
  const annualProduction = Math.round(systemKwp * SPECIFIC_YIELD);

  // Üretim mahsuplaşmada önce pahalı kademedeki tüketimi düşürür; tasarruf, mevcut
  // fatura ile kalan tüketimin faturası arasındaki farktır. Üretim tüketimi aşarsa
  // tasarruf faturanın tamamıyla sınırlı kalır (fazla üretim tam fiyattan dönmez).
  const remainingMonthlyKwh = Math.max(0, monthlyKwh - annualProduction / 12);
  const annualSavings = Math.round(
    (monthlyBill - monthlyKwhToBill(remainingMonthlyKwh, tariff)) * 12,
  );

  return {
    monthlyKwh: Math.round(monthlyKwh),
    annualKwh: Math.round(annualKwh),
    systemKwp,
    panelCount,
    roofArea: Math.round(systemKwp * AREA_M2_PER_KWP),
    annualProduction,
    annualSavings,
  };
}
