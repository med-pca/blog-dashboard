import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('blog_posts')
@Index(['published', 'sortOrder'])
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

  @Column({ nullable: true })
  publishedAt: Date

  @Column({ default: 0 })
  sortOrder: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
