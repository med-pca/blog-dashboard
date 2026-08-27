import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BlogPost } from './entities/blog-post.entity'
import { BlogController } from './blog.controller'
import { BlogService } from './blog.service'
import { BlogComment } from './entities/blog-comment.entity'
import { BlogCommentService } from './blog-comment.service'

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, BlogComment])],
  controllers: [BlogController],
  providers: [BlogService, BlogCommentService],
  exports: [BlogService],
})
export class BlogModule {}
