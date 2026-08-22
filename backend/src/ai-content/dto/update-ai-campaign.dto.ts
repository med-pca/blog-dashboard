import { PartialType } from '@nestjs/mapped-types'
import { CreateAiCampaignDto } from './create-ai-campaign.dto'

export class UpdateAiCampaignDto extends PartialType(CreateAiCampaignDto) {}
