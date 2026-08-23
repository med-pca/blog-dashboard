import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectUploadController } from './project-upload.controller'
import { BlogUploadController } from './blog-upload.controller'
import { UploadsCleanupService } from './uploads-cleanup.service'
import { ProjectsModule } from '../projects/projects.module'
import { BlogModule } from '../blog/blog.module'
import { ProjectMedia } from '../projects/entities/project-media.entity'
import { BlogPost } from '../blog/entities/blog-post.entity'

@Module({
  imports: [
    ProjectsModule,
    BlogModule,
    TypeOrmModule.forFeature([ProjectMedia, BlogPost]),
  ],
  controllers: [ProjectUploadController, BlogUploadController],
  providers: [UploadsCleanupService],
})
export class UploadModule {}
