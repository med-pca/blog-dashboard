import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type QuoteStatus = 'new' | 'replied' | 'closed'

@Entity('quote_requests')
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // KVKK temizliğinde null'lanır; NOT NULL kolon değil
  @Column({ type: 'varchar', length: 120, nullable: true })
  name: string | null

  // KVKK temizliğinde null'lanır; NOT NULL kolon değil
  @Column({ type: 'varchar', length: 180, nullable: true })
  email: string | null

  @Column({ type: 'text', nullable: true })
  message: string | null

  @Column({ default: false })
  kvkkConsent: boolean

  @Column({ type: 'timestamp' })
  consentAt: Date

  // 'new' = okunmadı, 'replied' = yanıtlandı, 'closed' = kapatıldı
  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: QuoteStatus

  @Index()
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
