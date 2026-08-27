import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { BlogPost } from './blog-post.entity'

export enum BlogCommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('blog_comments')
@Index(['postId', 'status', 'createdAt'])
export class BlogComment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  postId: string

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: BlogPost

  @Column({ length: 120 })
  authorName: string

  @Column({ length: 254 })
  authorEmail: string

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'enum', enum: BlogCommentStatus, default: BlogCommentStatus.PENDING })
  status: BlogCommentStatus

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
