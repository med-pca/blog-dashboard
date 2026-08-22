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

  @Column({ type: 'text', default: '' })
  content: string

  @Column({ nullable: true })
  coverImage: string

  @Column({ default: false })
  published: boolean

  // Written only by the AI content pipeline; drives the "AI Draft" badge in the
  // admin list. Not part of CreateBlogPostDto, so it cannot be set over the API.
  @Column({ default: false })
  aiGenerated: boolean

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
