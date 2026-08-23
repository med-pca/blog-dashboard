import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Project } from '../../projects/entities/project.entity'

export type AiCampaignStatus = 'active' | 'paused' | 'completed'

// One editorial brief that the scheduler turns into spaced-out draft
// generations. Everything the operator can tune lives on this row; nothing
// about the cadence is hard-coded in the scheduler.
@Entity('ai_content_campaigns')
@Index('IDX_ai_campaigns_enabled_status', ['enabled', 'status'])
export class AiContentCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 120 })
  name: string

  // The operator's standing instruction ("family-friendly US recipes, ...").
  @Column({ type: 'text' })
  masterPrompt: string

  // Every campaign owns one editorial lane. Existing campaigns are paused by
  // the migration until an administrator selects their collection.
  @Column({ type: 'uuid', nullable: true })
  collectionId: string | null

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collectionId' })
  collection: Project | null

  @Column({ type: 'varchar', length: 40, default: 'English' })
  language: string

  @Column({ type: 'varchar', length: 40, default: 'friendly and practical' })
  tone: string

  @Column({ type: 'int', default: 1200 })
  targetWords: number

  @Column('text', { array: true, default: '{}' })
  keywords: string[]

  // Articles to produce per local day. Capped at AI_DAILY_MAX_PER_CAMPAIGN.
  @Column({ type: 'int', default: 2 })
  dailyTarget: number

  @Column({ type: 'int', default: 20 })
  intervalMinutes: number

  // Local-clock window; end hour 24 means "until midnight".
  @Column({ type: 'int', default: 8 })
  generationStartHour: number

  @Column({ type: 'int', default: 22 })
  generationEndHour: number

  // IANA zone driving both the window and the daily counter reset.
  @Column({ type: 'varchar', length: 64, default: 'UTC' })
  timezone: string

  @Column({ default: false })
  enabled: boolean

  @Column({ type: 'varchar', length: 20, default: 'paused' })
  status: AiCampaignStatus

  // Successful drafts on `generatedTodayDate`. Test drafts are excluded.
  @Column({ type: 'int', default: 0 })
  generatedToday: number

  // Local date (YYYY-MM-DD) the counter belongs to; a mismatch resets it.
  @Column({ type: 'date', nullable: true })
  generatedTodayDate: string | null

  @Column({ type: 'timestamp', nullable: true })
  lastGenerationAt: Date | null

  @Column({ type: 'timestamp', nullable: true })
  nextGenerationAt: Date | null

  // Last time the scheduler looked at this campaign, successful or not.
  @Column({ type: 'timestamp', nullable: true })
  lastRunAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
