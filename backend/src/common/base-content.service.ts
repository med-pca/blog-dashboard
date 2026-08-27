import { ConflictException, NotFoundException } from '@nestjs/common'
import {
  DeepPartial,
  EntityTarget,
  FindManyOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm'
import { deleteUploadedFile } from '../upload/uploaded-files'
import { PublicCacheService } from './public-cache.service'
import { reorderByCase } from './reorder'
import { isUniqueViolation } from './errors'

// blog/faq/references servislerinin ortak sözleşmesi
export interface ContentEntity extends ObjectLiteral {
  id: string
  published: boolean
  sortOrder: number
  createdAt: Date
}

// Sıralanabilir, yayınla/gizle mantıklı içerik CRUD'u tek yerde.
// Tür-özel davranışlar override noktalarıyla verilir:
//  - defaultOrder / publicFindOptions: liste sıralaması ve public alan seçimi
//  - fileField: coverImage/logo gibi diskte dosyası olan alan; update'te eski
//    dosya, remove'da mevcut dosya silinir
//  - uniqueConflictMessage: tanımlıysa 23505 bu mesajla 409'a çevrilir (slug)
//  - onCreate / onUpdate: kaydetmeden önce entity'ye dokunma fırsatı
export abstract class BaseContentService<T extends ContentEntity> {
  protected abstract readonly entityClass: EntityTarget<T>
  protected abstract readonly notFoundMessage: string
  protected readonly fileField?: keyof T & string
  protected readonly uniqueConflictMessage?: string

  constructor(
    protected readonly repo: Repository<T>,
    protected readonly cache: PublicCacheService,
  ) {}

  // Cache anahtarları tablo adıyla öneklenir; yazan her metod öneki bust'lar
  protected cacheKey(suffix: string): string {
    return `${this.repo.metadata.tableName}:${suffix}`
  }

  protected bustCache(): void {
    this.cache.bust(this.repo.metadata.tableName)
  }

  protected defaultOrder(): FindManyOptions<T>['order'] {
    return { sortOrder: 'ASC', createdAt: 'DESC' } as FindManyOptions<T>['order']
  }

  protected publicFindOptions(): FindManyOptions<T> {
    return {
      where: { published: true } as unknown as FindOptionsWhere<T>,
      order: this.defaultOrder(),
    }
  }

  protected onCreate(_entity: T, _dto: DeepPartial<T>): void {}

  // update akışında Object.assign'dan ÖNCE çağrılır; eski/yeni durum birlikte görülür
  protected onUpdate(_entity: T, _dto: DeepPartial<T>): void {}

  findAllPublic(): Promise<T[]> {
    return this.cache.wrap(this.cacheKey('list'), () => this.repo.find(this.publicFindOptions()))
  }

  findAll(): Promise<T[]> {
    return this.repo.find({ order: this.defaultOrder() })
  }

  async findById(id: string): Promise<T> {
    const entity = await this.repo.findOne({ where: { id } as FindOptionsWhere<T> })
    if (!entity) throw new NotFoundException(this.notFoundMessage)
    return entity
  }

  protected async save(entity: T): Promise<T> {
    try {
      return await this.repo.save(entity)
    } catch (err) {
      if (isUniqueViolation(err) && this.uniqueConflictMessage) {
        throw new ConflictException(this.uniqueConflictMessage)
      }
      throw err
    }
  }

  async create(dto: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(dto)
    this.onCreate(entity, dto)
    const saved = await this.save(entity)
    this.bustCache()
    return saved
  }

  async update(id: string, dto: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id)
    this.onUpdate(entity, dto)
    const oldFile = this.fileField ? (entity[this.fileField] as string | null) : null
    Object.assign(entity, dto)
    const saved = await this.save(entity)
    // Dosya alanı değiştiyse eski dosyayı diskte bırakma
    if (
      this.fileField &&
      (dto as Record<string, unknown>)[this.fileField] !== undefined &&
      oldFile &&
      oldFile !== saved[this.fileField]
    ) {
      await deleteUploadedFile(oldFile)
    }
    this.bustCache()
    return saved
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findById(id)
    await this.repo.remove(entity)
    if (this.fileField) await deleteUploadedFile(entity[this.fileField] as string | null)
    this.bustCache()
  }

  // offset: sayfalanmış listede sürüklenen satırların global başlangıç indeksi
  async reorder(orderedIds: string[], offset = 0): Promise<void> {
    await reorderByCase(this.repo, orderedIds, offset)
    this.bustCache()
  }
}
