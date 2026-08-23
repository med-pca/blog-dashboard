import { Injectable } from '@nestjs/common'
import { AiContentConfig } from '../ai-content.config'
import { OpenAiClient } from '../../ai/openai.client'
import type {
  AiContentProvider,
  ArticleRequest,
  ArticleResult,
  GeneratedArticle,
  TopicRequest,
  TopicResult,
} from '../types/ai-content.types'

// Strict Structured Outputs schema: every property is required and no extra
// keys are accepted, so a well-formed reply cannot smuggle `published: true`.
const ARTICLE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'slug', 'excerpt', 'metaDescription', 'content', 'suggestedKeywords'],
  properties: {
    title: { type: 'string', description: 'Article title, at most 255 characters.' },
    slug: {
      type: 'string',
      description: 'URL slug: lowercase ASCII letters, digits and hyphens only, at most 200 characters.',
    },
    excerpt: { type: 'string', description: 'Plain-text summary, at most 500 characters.' },
    metaDescription: { type: 'string', description: 'Search-result description, at most 160 characters.' },
    content: {
      type: 'string',
      description:
        'Article body as HTML using only p, h2, h3, ul, ol, li, strong, em and blockquote tags. No images, no scripts, no inline styles.',
    },
    suggestedKeywords: { type: 'array', items: { type: 'string' }, description: 'Three to eight keywords.' },
  },
} as const

const TOPIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['topics'],
  properties: {
    topics: { type: 'array', items: { type: 'string' }, description: 'Distinct article titles.' },
  },
} as const

// Editorial guardrails sent on every article call. Kept next to the schema so
// the contract with the model is readable in one place.
const EDITORIAL_RULES = [
  'Write original, evergreen content that stays useful without live web data.',
  'Never invent statistics, studies, quotes, sources, prices or testimonials.',
  'Never claim personal experience and never claim a recipe or method was tested.',
  'Never invent an author biography, culinary qualification, reader feedback, rating or review.',
  'For recipes, make quantities, serving yield, pan size, cooking sequence, liquid ratios and total timing internally consistent.',
  'For recipes containing meat, give conservative doneness guidance and a safe internal-temperature check; never rely on color alone.',
  'Do not invent exact prices, nutrition values or health benefits. Use cautious storage guidance and tell readers to refrigerate perishable food promptly.',
  'Avoid generic SEO templates. Vary the recipe format and vocabulary only where that improves clarity.',
  'Never mention that the text was produced by an AI, a model or an assistant.',
  'Do not pad: no filler paragraphs, no repeated sentences, no restated headings.',
  'Stay strictly on the given topic.',
  'Give no medical, legal or financial advice that could be unsafe; add no health claims.',
  'Do not reference images; the article carries no illustrations.',
  'Use only these HTML tags: p, h2, h3, ul, ol, li, strong, em, blockquote.',
  'Do not emit script, style, iframe, img, form or any on* attribute.',
  'Only add a link when it is genuinely necessary, and only to a well-known https site.',
].join('\n- ')

@Injectable()
export class OpenAiContentProvider implements AiContentProvider {
  constructor(
    private readonly config: AiContentConfig,
    private readonly client: OpenAiClient,
  ) {}

  async suggestTopics(request: TopicRequest): Promise<TopicResult> {
    const avoid = request.avoidTitles.length
      ? `\n\nAlready published or already planned — propose nothing similar to these:\n- ${request.avoidTitles.join('\n- ')}`
      : ''
    const rejected = request.rejectedTopics.length
      ? `\n\nThese candidates were just rejected as too close to existing articles, go further afield:\n- ${request.rejectedTopics.join('\n- ')}`
      : ''
    const keywords = request.keywords.length ? `\nPreferred keywords: ${request.keywords.join(', ')}.` : ''

    const parsed = await this.respond<{ topics: string[] }>({
      model: request.model,
      timeoutMs: request.timeoutMs,
      maxOutputTokens: 2000,
      schemaName: 'topic_ideas',
      schema: TOPIC_SCHEMA,
      instructions:
        'You plan an editorial calendar. Return distinct, specific, self-contained article titles. ' +
        'No numbering, no quotes around titles, no duplicates, no near-duplicates of each other. ' +
        'Diversify primary ingredient, cooking method, cuisine direction, meal type and reader intent; do not return a list of cosmetic variations on one base recipe.',
      input:
        `Editorial brief:\n${request.masterPrompt}\n\n` +
        `Language: ${request.language}.${keywords}\n` +
        `Propose exactly ${request.count} candidate titles.${avoid}${rejected}`,
    })

    const topics = Array.isArray(parsed.value.topics)
      ? parsed.value.topics.filter((topic): topic is string => typeof topic === 'string' && topic.trim() !== '')
      : []
    return { topics: topics.map(topic => topic.trim()), usage: parsed.usage }
  }

  async writeArticle(request: ArticleRequest): Promise<ArticleResult> {
    const avoid = request.avoidTitles.length
      ? `\n\nDo not overlap with these existing articles:\n- ${request.avoidTitles.join('\n- ')}`
      : ''
    const keywords = request.keywords.length ? `\nWork these keywords in naturally: ${request.keywords.join(', ')}.` : ''

    // Reasoning tokens count against max_output_tokens, so leave generous head
    // room above the prose budget or the reply comes back `incomplete`.
    const maxOutputTokens = Math.min(32_000, Math.round(request.targetWords * 3) + 4000)

    const parsed = await this.respond<GeneratedArticle>({
      model: request.model,
      timeoutMs: request.timeoutMs,
      maxOutputTokens,
      schemaName: 'blog_article',
      schema: ARTICLE_SCHEMA,
      instructions:
        `You are a careful staff writer. Write in ${request.language}. Tone: ${request.tone}.\n` +
        `Rules:\n- ${EDITORIAL_RULES}`,
      input:
        `Editorial brief:\n${request.masterPrompt}\n\n` +
        `Write the full article for this exact topic: ${request.topic}\n` +
        `Target length: about ${request.targetWords} words.${keywords}\n` +
        'Structure the body with h2 sections and, where useful, h3 subsections and lists.' +
        avoid,
    })

    return { article: parsed.value, usage: parsed.usage }
  }

  // Vendor access goes through the shared OpenAI client, which owns timeouts,
  // error classification and log redaction for every AI feature in the app.
  private async respond<T>(options: {
    model: string
    timeoutMs: number
    maxOutputTokens: number
    schemaName: string
    schema: unknown
    instructions: string
    input: string
  }): Promise<{ value: T; usage: { inputTokens: number; outputTokens: number } }> {
    return this.client.respondJson<T>({
      operation: `ai-content:${options.schemaName}`,
      model: options.model,
      timeoutMs: options.timeoutMs,
      maxOutputTokens: options.maxOutputTokens,
      instructions: options.instructions,
      input: options.input,
      schemaName: options.schemaName,
      schema: options.schema as Record<string, unknown>,
      // Retries stay with BullMQ so that every attempt is visible in the job log.
      retries: 0,
    })
  }
}

// Moved next to the SDK call site; re-exported so existing importers of this
// module keep resolving it.
export { isReasoningModel } from '../../ai/openai.client'
