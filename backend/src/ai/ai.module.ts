import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppSetting } from '../instagram-token/app-setting.entity'
import { AiConfig } from './ai.config'
import { OpenAiClient } from './openai.client'
import { ChatCompletionsClient } from './chat-completions.client'
import { AiSettingsService } from './ai-settings.service'
import { AiSettingsController } from './ai-settings.controller'
import { OpenAiProvider } from './providers/openai.provider'
import { GroqProvider } from './providers/groq.provider'
import { AiRoutingProvider } from './providers/routing.provider'
import { AI_PROVIDER } from './ai-provider.types'
import { AiCoverImageService } from './ai-cover-image.service'

// Shared model-vendor layer. Global so any feature module can inject
// AI_PROVIDER without re-importing.
//
// AI_PROVIDER now resolves to AiRoutingProvider, which picks the vendor per
// call from the admin setting in app_settings. The previous useFactory chose
// once at boot, which cannot work for a value the operator can change at
// runtime. AI_PROVIDER in the environment survives as the seed used until
// someone saves a choice in the panel.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AppSetting])],
  controllers: [AiSettingsController],
  providers: [
    AiConfig,
    OpenAiClient,
    ChatCompletionsClient,
    AiSettingsService,
    AiCoverImageService,
    OpenAiProvider,
    GroqProvider,
    AiRoutingProvider,
    {
      provide: AI_PROVIDER,
      inject: [AiConfig, AiRoutingProvider],
      useFactory: (config: AiConfig, router: AiRoutingProvider) => {
        config.logStartupState()
        return router
      },
    },
  ],
  exports: [AI_PROVIDER, AiConfig, OpenAiClient, ChatCompletionsClient, AiSettingsService, AiCoverImageService],
})
export class AiModule {}
