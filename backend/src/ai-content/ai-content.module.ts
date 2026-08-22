import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BlogModule } from '../blog/blog.module'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { AiContentConfig } from './ai-content.config'
import { AiContentController } from './ai-content.controller'
import { AiContentService } from './ai-content.service'
import { AiCampaignService } from './ai-campaign.service'
import { AiJobsService } from './ai-jobs.service'
import { AiQueueService } from './ai-queue.service'
import { AiSchedulerService } from './ai-scheduler.service'
import { AiTopicService } from './ai-topic.service'
import { AiGenerationProcessor } from './ai-generation.processor'
import { OpenAiContentProvider } from './providers/openai.provider'
import { AiContentCampaign } from './entities/ai-content-campaign.entity'
import { AiGenerationJob } from './entities/ai-generation-job.entity'
import { AI_CONTENT_PROVIDER } from './types/ai-content.types'

// Autonomous blog-draft generation. Deliberately independent from the Groq
// chatbot: separate provider, separate keys, separate queue. The module always
// loads (so the admin can manage campaigns while generation is off); the
// scheduler and the BullMQ worker are the parts gated on AI_CONTENT_ENABLED.
@Module({
  imports: [TypeOrmModule.forFeature([AiContentCampaign, AiGenerationJob, BlogPost]), BlogModule],
  controllers: [AiContentController],
  providers: [
    AiContentConfig,
    AiCampaignService,
    AiContentService,
    AiJobsService,
    AiQueueService,
    AiSchedulerService,
    AiTopicService,
    AiGenerationProcessor,
    // Single seam for the model vendor: swapping providers means providing a
    // different class under this token.
    { provide: AI_CONTENT_PROVIDER, useClass: OpenAiContentProvider },
  ],
  exports: [AiCampaignService, AiContentService],
})
export class AiContentModule {}
