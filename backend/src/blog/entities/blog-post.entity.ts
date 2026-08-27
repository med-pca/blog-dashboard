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

@Entity('blog_posts')
@Index(['published', 'sortOrder'])
// Koleksiyon sayfası "bu koleksiyondaki yazılar" listesini bu indeksle çeker
@Index(['collectionId', 'published'])
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ unique: true })
  slug: string

  @Column({ nullable: true })
  excerpt: string

  @Column({ nullable: true })
  metaDescription: string

  // Optional manual score assigned during editorial review. Null means the
  // article has not been scored yet and keeps the public badge hidden.
  @Column({ type: 'real', nullable: true })
  editorialRating: number | null

  @Column({ type: 'text', default: '' })
  content: string

  @Column({ type: 'text', default: '' })
  ingredients: string

  @Column({ type: 'text', default: '' })
  method: string

  @Column({ default: 'Pulse Recipe Editorial Team' })
  authorName: string

  @Column({ type: 'text', default: '' })
  authorBio: string

  // Recipe card metadata. Every field is nullable: older posts and non-recipe
  // articles simply render no card rather than an empty one. Times are stored
  // as whole minutes so the page can format them and emit ISO 8601 durations
  // for schema.org, instead of parsing free text like "about 1 hr".
  @Column({ type: 'int', nullable: true })
  prepMinutes: number | null

  @Column({ type: 'int', nullable: true })
  cookMinutes: number | null

  // Explicit override for recipes with resting/marinating time. Left null the
  // page shows prep + cook, so the total can never contradict its parts.
  @Column({ type: 'int', nullable: true })
  totalMinutes: number | null

  // Free text on purpose: "8 crescents", "4-6 people", "1 loaf".
  @Column({ type: 'varchar', length: 80, nullable: true })
  servings: string | null

  @Column({ type: 'varchar', length: 80, nullable: true })
  course: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  cuisine: string | null

  @Column({ type: 'int', nullable: true })
  calories: number | null

  @Column({ nullable: true })
  coverImage: string

  @Column({ default: false })
  published: boolean

  // Written only by the AI content pipeline; drives the "AI Draft" badge in the
  // admin list. Not part of CreateBlogPostDto, so it cannot be set over the API.
  @Column({ default: false })
  aiGenerated: boolean

  // Internal description retained until an admin validates the AI draft. It is
  // never selected by public list endpoints and never accepted from public DTOs.
  @Column({ type: 'text', nullable: true })
  aiImagePrompt: string | null

  // Yazının bağlı olduğu koleksiyon (Project). Boş olabilir: koleksiyona
  // atanmamış yazılar blog listesinde görünmeye devam eder. Koleksiyon
  // silinirse FK ON DELETE SET NULL ile yazı korunur, yalnızca bağı kopar.
  @Column({ type: 'uuid', nullable: true })
  collectionId: string | null

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collectionId' })
  collection: Project | null

  @Column({ nullable: true })
  publishedAt: Date

  @Column({ default: 0 })
  sortOrder: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
