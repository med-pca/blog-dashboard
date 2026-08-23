import { Global, Module } from '@nestjs/common'
import { AiConfig } from './ai.config'
import { OpenAiClient } from './openai.client'
import { OpenAiProvider } from './providers/openai.provider'
import { GroqProvider } from './providers/groq.provider'
import { AI_PROVIDER } from './ai-provider.types'
import { AiCoverImageService } from './ai-cover-image.service'

// Shared model-vendor layer. Global so any feature module can inject
// AI_PROVIDER without re-importing, mirroring how GroqModule was wired.
//
// AI_PROVIDER=openai (default) → OpenAiProvider
// AI_PROVIDER=groq             → GroqProvider (temporary rollback path)
@Global()
@Module({
  providers: [
    AiConfig,
    OpenAiClient,
    AiCoverImageService,
    OpenAiProvider,
    GroqProvider,
    {
      provide: AI_PROVIDER,
      inject: [AiConfig, OpenAiProvider, GroqProvider],
      useFactory: (config: AiConfig, openai: OpenAiProvider, groq: GroqProvider) => {
        config.logStartupState()
        return config.provider === 'groq' ? groq : openai
      },
    },
  ],
  exports: [AI_PROVIDER, AiConfig, OpenAiClient, AiCoverImageService],
})
export class AiModule {}
