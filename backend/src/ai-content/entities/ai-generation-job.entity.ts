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
import { AiContentCampaign } from './ai-content-campaign.entity'

export type AiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

// `test` is not in the scheduler's rotation: it produces a draft on demand and
// deliberately does not move the daily counter.
export type AiJobTrigger = 'scheduled' | 'manual' | 'retry' | 'test'

// Numeric columns come back as strings from pg; keep the API returning numbers.
const numericTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
}

@Entity('ai_generation_jobs')
@Index('IDX_ai_jobs_campaign_status', ['campaignId', 'status'])
@Index('IDX_ai_jobs_createdAt', ['createdAt'])
@Index('IDX_ai_jobs_status_plannedFor', ['status', 'plannedFor'])
export class AiGenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  campaignId: string

  @ManyToOne(() => AiContentCampaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign?: AiContentCampaign

  // Deterministic BullMQ id. Unique so two schedulers racing on the same slot
  // resolve to a single row at the database level, restart or not.
  @Column({ type: 'varchar', length: 120, unique: true })
  queueJobId: string

  @Column({ type: 'timestamp' })
  plannedFor: Date

  @Column({ type: 'varchar', length: 300, nullable: true })
  topic: string | null

  @Column({ type: 'varchar', length: 300, nullable: true })
  normalizedTopic: string | null

  @Column({ type: 'varchar', length: 20, default: 'queued' })
  status: AiJobStatus

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  triggerType: AiJobTrigger

  @Column({ type: 'int', default: 0 })
  attempt: number

  @Column({ type: 'int', default: 3 })
  maxAttempts: number

  // Draft this run produced; null until the post exists.
  @Column({ type: 'uuid', nullable: true })
  blogPostId: string | null

  @Column({ type: 'varchar', length: 60 })
  model: string

  @Column({ type: 'int', nullable: true })
  inputTokens: number | null

  @Column({ type: 'int', nullable: true })
  outputTokens: number | null

  @Column({ type: 'numeric', precision: 12, scale: 6, nullable: true, transformer: numericTransformer })
  estimatedCost: number | null

  @Column({ type: 'varchar', length: 60, nullable: true })
  errorCode: string | null

  // Always passed through redactSecrets() before it is written.
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
