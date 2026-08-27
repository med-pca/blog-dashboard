import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BlogPost } from './entities/blog-post.entity'
import { BlogComment, BlogCommentStatus } from './entities/blog-comment.entity'
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto'
import { stripHtml } from '../common/html-sanitize'

@Injectable()
export class BlogCommentService {
  constructor(
    @InjectRepository(BlogComment) private readonly comments: Repository<BlogComment>,
    @InjectRepository(BlogPost) private readonly posts: Repository<BlogPost>,
  ) {}

  async create(slug: string, dto: CreateBlogCommentDto) {
    const post = await this.posts.findOne({ where: { slug, published: true }, select: ['id'] })
    if (!post) throw new NotFoundException('Yazı bulunamadı')
    const comment = this.comments.create({
      postId: post.id,
      authorName: stripHtml(dto.authorName).trim(),
      authorEmail: dto.authorEmail.trim().toLowerCase(),
      content: stripHtml(dto.content).trim(),
      status: BlogCommentStatus.PENDING,
    })
    const saved = await this.comments.save(comment)
    return { id: saved.id, status: saved.status, message: 'Comment submitted for review.' }
  }

  async findApproved(slug: string) {
    const post = await this.posts.findOne({ where: { slug, published: true }, select: ['id'] })
    if (!post) throw new NotFoundException('Yazı bulunamadı')
    return this.comments.find({
      where: { postId: post.id, status: BlogCommentStatus.APPROVED },
      select: ['id', 'authorName', 'content', 'createdAt'],
      order: { createdAt: 'DESC' },
    })
  }

  findAllAdmin() {
    return this.comments.find({ relations: { post: true }, order: { createdAt: 'DESC' } })
  }

  async moderate(id: string, status: BlogCommentStatus) {
    const comment = await this.comments.findOne({ where: { id } })
    if (!comment) throw new NotFoundException('Comment not found')
    comment.status = status
    return this.comments.save(comment)
  }

  async remove(id: string): Promise<void> {
    const result = await this.comments.delete(id)
    if (!result.affected) throw new NotFoundException('Comment not found')
  }
}
