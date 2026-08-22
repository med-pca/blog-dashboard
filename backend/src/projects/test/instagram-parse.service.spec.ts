import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common'
import {
  AI_INVALID_RESPONSE_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  InstagramParseService,
} from '../instagram-parse.service'
import { AiPermanentError, AiTransientError } from '../../ai/errors'
import type { AiProvider } from '../../ai/ai-provider.types'

// B.1 regresyonu: parseInstagram `JSON.parse(...) as ParsedProject` ile bitiyordu.
// `as` bir İDDİA olduğundan model ne döndürürse döndürsün doğrudan DB'ye gidiyordu
// ve bu yol CreateProjectDto'nun ValidationPipe'ını BYPASS ediyor (manager.save).
//
// Sağlayıcı OpenAI'ye taşındıktan sonra da geçerli: Structured Outputs şemayı
// vendor tarafında zorlar ama DB kısıtlarını (255 sınırı, numeric(10,2), text[])
// bilmez, dolayısıyla bu DTO doğrulaması hâlâ tek güvencemiz.
//
// Politika: geçersiz alan DÜŞÜRÜLÜR, gönderi kurtarılır. Testlerin üç görevi var:
//   1) bozuk alanın DB'ye ulaşmadığını kilitlemek
//   2) aynı gönderideki SAĞLAM alanların korunduğunu kilitlemek (kurtarmanın özü)
//   3) MEŞRU çıktının hâlâ geçtiğini kilitlemek — prompt modele "emin
//      olamadığın alanlar için boş string/boş dizi kullan" diyor, yani "" ve []
//      beklenen yanıttır. DTO fazla katı olursa alanlar boşuna düşer.

// Sağlayıcı sahtesi: generateJson gövdeyi olduğu gibi döndürür.
function makeService(value: unknown): { service: InstagramParseService; generateJson: jest.Mock } {
  const generateJson = jest.fn().mockResolvedValue({ value, usage: { inputTokens: 0, outputTokens: 0 } })
  const ai = { name: 'openai', generateJson, generateText: jest.fn() }
  return { service: new InstagramParseService(ai as unknown as AiProvider), generateJson }
}

// Sağlayıcının hata attığı yol.
function makeFailingService(err: unknown): InstagramParseService {
  const ai = { name: 'openai', generateJson: jest.fn().mockRejectedValue(err), generateText: jest.fn() }
  return new InstagramParseService(ai as unknown as AiProvider)
}

// Şemaya uyan tam gövde; testler bunun üzerine tek alan ezerek çalışır
const gecerli = {
  name: '10,2 kW Hibrit GES Sistemi',
  location: 'Manisa',
  kw: 10.2,
  date: '2025',
  description: '16 panel ve hibrit invertör ile kesintisiz enerji.',
  about: 'Bağ evi şebekeden bağımsız hale geldi.',
  specs: ['28 Adet 600W Kalyon Güneş Paneli'],
  highlights: ['Şebekeden tamamen bağımsız çalışma'],
  statBoxes: [{ value: '11,25 kWp', label: 'Kurulu Güç' }],
}

const parse = (govde: Record<string, unknown>) => makeService(govde).service.parseInstagram('caption')

describe('InstagramParseService.parseInstagram — LLM çıktısı şema doğrulaması (B.1)', () => {
  describe('geçersiz alanlar düşürülür, sağlam alanlar korunur', () => {
    it('specs dizi yerine string gelirse düşürür (text[] kolonuna string gidiyordu)', async () => {
      const sonuc = await parse({ ...gecerli, specs: '28 Adet 600W Panel' })
      expect(sonuc.specs).toBeUndefined()
      expect(sonuc.name).toBe(gecerli.name)
      expect(sonuc.highlights).toEqual(gecerli.highlights)
    })

    it('kw sayı yerine Türkçe ondalıklı string gelirse düşürür (numeric kolon)', async () => {
      const sonuc = await parse({ ...gecerli, kw: '11,25' })
      expect(sonuc.kw).toBeUndefined()
      expect(sonuc.name).toBe(gecerli.name)
    })

    it('kw negatifse düşürür', async () => {
      await expect(parse({ ...gecerli, kw: -5 })).resolves.not.toHaveProperty('kw')
    })

    it('kw decimal(10,2) sınırını aşarsa düşürür', async () => {
      await expect(parse({ ...gecerli, kw: 100000000 })).resolves.not.toHaveProperty('kw')
    })

    // En sinsi vaka: jsonb her şeyi kabul eder, satır sorunsuz yazılır ve
    // hata ancak ProjeDetay.jsx {box.value} render ederken patlar.
    it('statBoxes elemanı nesne değilse düşürür', async () => {
      const sonuc = await parse({ ...gecerli, statBoxes: ['11,25 kWp'] })
      expect(sonuc.statBoxes).toBeUndefined()
      expect(sonuc.description).toBe(gecerli.description)
    })

    it('statBoxes elemanında label eksikse düşürür', async () => {
      await expect(parse({ ...gecerli, statBoxes: [{ value: '5 kW' }] }))
        .resolves.not.toHaveProperty('statBoxes')
    })

    // 255'ten uzun açıklama yazılırsa o satır admin panelinden bir daha
    // kaydedilemez (edit CreateProjectDto'nun 255 sınırına çarpar).
    it('description 255 karakteri aşarsa düşürür', async () => {
      const sonuc = await parse({ ...gecerli, description: 'a'.repeat(300) })
      expect(sonuc.description).toBeUndefined()
      expect(sonuc.about).toBe(gecerli.about)
    })

    it('date 4 haneli yıl değilse düşürür', async () => {
      await expect(parse({ ...gecerli, date: 'Ağustos 2025' })).resolves.not.toHaveProperty('date')
    })

    // Dizinin KENDİSİ doğru ama ELEMANI bozuk: @IsArray() bunu yakalamaz,
    // yakalayan @IsString({ each: true }). text[] kolonuna sayı gitmemeli.
    it('specs dizisinde string olmayan eleman varsa düşürür', async () => {
      const sonuc = await parse({ ...gecerli, specs: ['28 Adet Panel', 123] })
      expect(sonuc.specs).toBeUndefined()
      expect(sonuc.name).toBe(gecerli.name)
    })

    it('highlights dizisinde nesne eleman varsa düşürür', async () => {
      await expect(parse({ ...gecerli, highlights: [{ metin: 'x' }] }))
        .resolves.not.toHaveProperty('highlights')
    })

    it('specs elemanı 500 karakteri aşarsa düşürür', async () => {
      await expect(parse({ ...gecerli, specs: ['a'.repeat(600)] }))
        .resolves.not.toHaveProperty('specs')
    })

    it('specs dizisi ArrayMaxSize sınırını aşarsa düşürür', async () => {
      await expect(parse({ ...gecerli, specs: Array(25).fill('panel') }))
        .resolves.not.toHaveProperty('specs')
    })

    it('statBoxes dizisi ArrayMaxSize sınırını aşarsa düşürür', async () => {
      const cok = Array(12).fill({ value: '1', label: 'x' })
      await expect(parse({ ...gecerli, statBoxes: cok })).resolves.not.toHaveProperty('statBoxes')
    })

    it('birden fazla bozuk alanı aynı anda düşürür, gerisini bırakır', async () => {
      const sonuc = await parse({ ...gecerli, kw: '11,25', specs: 'tek string', date: 'yakında' })
      expect(sonuc.kw).toBeUndefined()
      expect(sonuc.specs).toBeUndefined()
      expect(sonuc.date).toBeUndefined()
      expect(sonuc.name).toBe(gecerli.name)
      expect(sonuc.location).toBe(gecerli.location)
      expect(sonuc.statBoxes).toEqual(gecerli.statBoxes)
    })
  })

  // Tek istisna: slug name'den türüyor, name yoksa 'proje', 'proje-1'... çöp doğar
  describe("name kurtarılamıyorsa gönderi atlanır", () => {
    it('name hiç yoksa hata atar', async () => {
      const { name: _atilan, ...nameSiz } = gecerli
      await expect(parse(nameSiz)).rejects.toThrow(UnprocessableEntityException)
    })

    it('name geçersiz olduğu için düşerse hata atar', async () => {
      await expect(parse({ ...gecerli, name: 'a'.repeat(300) })).rejects.toThrow(UnprocessableEntityException)
    })

    it('gövde tamamen alakasızsa hata atar (çöp taslak üretmez)', async () => {
      await expect(parse({ foo: 'bar' })).rejects.toThrow(AI_INVALID_RESPONSE_MESSAGE)
    })
  })

  describe('meşru çıktı bozulmadan geçer', () => {
    it('tam geçerli gövdeyi olduğu gibi döndürür', async () => {
      const sonuc = await parse(gecerli)
      expect(sonuc).toMatchObject(gecerli)
      expect(typeof sonuc.kw).toBe('number')
    })

    // PARSE_PROMPT: "Emin olamadığın alanlar için boş string ("") ya da boş dizi ([]) kullan"
    it('boş string ve boş dizileri korur (prompt bunu emrediyor)', async () => {
      const sonuc = await parse({ ...gecerli, description: '', about: '', date: '', specs: [], statBoxes: [] })
      expect(sonuc.description).toBe('')
      expect(sonuc.date).toBe('')
      expect(sonuc.specs).toEqual([])
    })

    it('name dışındaki alanlar eksikse kabul eder', async () => {
      await expect(parse({ name: 'Sadece isim' })).resolves.toEqual({ name: 'Sadece isim' })
    })

    // Import servisi `parsed.kw || 0` ile default'luyor; null bu sözleşmeyi bozmamalı
    it('null alanları kabul eder', async () => {
      await expect(parse({ ...gecerli, location: null, kw: null })).resolves.toBeDefined()
    })

    it('modelin uydurduğu fazladan anahtarı sessizce düşürür', async () => {
      const sonuc = await parse({ ...gecerli, guc: 5, uydurma: 'x' })
      expect(sonuc).not.toHaveProperty('guc')
      expect(sonuc).not.toHaveProperty('uydurma')
      expect(sonuc.name).toBe(gecerli.name)
    })
  })

  // Yeni sözleşme: kullanıcıya giden metin sağlayıcı adı ya da HTTP kodu içermez.
  describe('hata yolları nötr mesaj döndürür', () => {
    it('anahtar yapılandırılmamışsa geçici kullanılamazlık bildirir', async () => {
      const service = makeFailingService(new AiPermanentError('MISSING_API_KEY', 'OPENAI_API_KEY is not configured'))
      await expect(service.parseInstagram('x')).rejects.toThrow(ServiceUnavailableException)
      await expect(service.parseInstagram('x')).rejects.toThrow(AI_UNAVAILABLE_MESSAGE)
    })

    it('rate limit gibi geçici hatalarda nötr mesaj döndürür', async () => {
      const service = makeFailingService(new AiTransientError('RATE_LIMITED', 'Too many requests'))
      await expect(service.parseInstagram('x')).rejects.toThrow(AI_UNAVAILABLE_MESSAGE)
    })

    it('geçersiz JSON gelirse doğrulama mesajı döndürür', async () => {
      const service = makeFailingService(new AiPermanentError('INVALID_JSON', 'Model response was not valid JSON'))
      await expect(service.parseInstagram('x')).rejects.toThrow(UnprocessableEntityException)
      await expect(service.parseInstagram('x')).rejects.toThrow(AI_INVALID_RESPONSE_MESSAGE)
    })

    it('hiçbir hata mesajı sağlayıcı adını ya da HTTP kodunu sızdırmaz', async () => {
      const cases = [
        new AiPermanentError('AUTH_REJECTED', 'Incorrect API key provided: sk-abc123'),
        new AiTransientError('UPSTREAM_500', 'Groq API hatası: 401'),
        new Error('connect ECONNREFUSED 1.2.3.4:443'),
      ]
      for (const err of cases) {
        await expect(makeFailingService(err).parseInstagram('x')).rejects.toThrow(
          new RegExp(`^(${AI_UNAVAILABLE_MESSAGE}|${AI_INVALID_RESPONSE_MESSAGE})$`),
        )
      }
    })
  })

  describe('istek sözleşmesi', () => {
    it('katı JSON şeması ister ve kullanıcı metnini veri olarak işaretler', async () => {
      const { service, generateJson } = makeService(gecerli)
      await service.parseInstagram('bir gönderi metni', 'batarya vurgusu')

      const [request] = generateJson.mock.calls[0]
      expect(request.schemaName).toBe('project_autofill')
      expect(request.schema.additionalProperties).toBe(false)
      // Şema alan adları formun beklediği DTO ile birebir aynı kalmalı
      expect(request.schema.required).toEqual([
        'name', 'location', 'kw', 'date', 'description', 'about', 'specs', 'highlights', 'statBoxes',
      ])
      // Yönetici metni yalnızca input'ta; sistem talimatlarına karışmaz
      expect(request.input).toContain('bir gönderi metni')
      expect(request.input).toContain('batarya vurgusu')
      expect(request.instructions).not.toContain('bir gönderi metni')
    })

    // pulserecipe.com is English: the model must be told to write English
    // recipe-collection content, never Turkish solar content.
    it('instructs the model to write English content for pulserecipe.com', async () => {
      const { service, generateJson } = makeService(gecerli)
      await service.parseInstagram('Weeknight Dinners')

      const { instructions } = generateJson.mock.calls[0][0]
      expect(instructions).toContain('pulserecipe.com')
      expect(instructions).toMatch(/write in natural,? fluent english/i)
      // No leftover Turkish-solar vocabulary from the previous project.
      expect(instructions.toLowerCase()).not.toContain('renel')
      expect(instructions.toLowerCase()).not.toContain('ges')
    })

    it('instruction verilmezse istek yine geçerlidir (geriye dönük uyumluluk)', async () => {
      const { service, generateJson } = makeService(gecerli)
      await expect(service.parseInstagram('sadece metin')).resolves.toMatchObject({ name: gecerli.name })
      expect(generateJson.mock.calls[0][0].input).toContain('sadece metin')
    })
  })
})
