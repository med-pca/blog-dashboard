import { IsIn } from 'class-validator'
import type { QuoteStatus } from '../entities/quote-request.entity'

const STATUSES: QuoteStatus[] = ['new', 'contacted', 'won', 'lost']

export class UpdateQuoteStatusDto {
  @IsIn(STATUSES, { message: 'Invalid status' })
  status: QuoteStatus
}
