import { IsIn } from 'class-validator'
import type { QuoteStatus } from '../entities/quote-request.entity'

const STATUSES: QuoteStatus[] = ['new', 'replied', 'closed']

export class UpdateQuoteStatusDto {
  @IsIn(STATUSES, { message: 'Invalid status' })
  status: QuoteStatus
}
