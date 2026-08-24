import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type ChatLeadStatus = 'active' | 'assisted' | 'contact_requested'

@Entity('chat_leads')
export class ChatLead {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Frontend'in konuşma başına ürettiği UUID; aynı konuşma tek lead olarak upsert edilir
  @Column({ type: 'uuid', unique: true })
  sessionId: string

  @Column({ type: 'jsonb', nullable: true })
  conversation: { role: string; content: string }[] | null

  @Column({ default: 0 })
  messageCount: number

  // 'active'            = konuşma başladı ama işe yarar bir sonuca ulaşmadı
  // 'assisted'          = chatbot gerçek bir cevap verdi (yalnızca soru sormadı)
  // 'contact_requested' = ziyaretçi sitenin iletişim formunu seçti
  //
  // 'contact_requested' şu an hiçbir yerden yazılmıyor: chatbot'ta iletişim
  // formuna geçişi bildiren bir olay yok. Statü, o olay eklendiğinde şema
  // değişmeden kullanılabilsin diye baştan tanımlı.
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ChatLeadStatus

  @Column({ type: 'smallint', nullable: true })
  rating: number | null

  @Index()
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
