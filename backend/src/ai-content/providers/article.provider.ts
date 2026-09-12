import { Inject, Injectable } from '@nestjs/common'
import { AiContentConfig } from '../ai-content.config'
import { AI_PROVIDER, type AiProvider } from '../../ai/ai-provider.types'
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
  required: [
    'title', 'slug', 'excerpt', 'metaDescription', 'content', 'imagePrompt', 'suggestedKeywords',
    'ingredients', 'method',
    'prepMinutes', 'cookMinutes', 'totalMinutes', 'servings', 'course', 'cuisine', 'calories',
    'socialPost',
  ],
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
    imagePrompt: {
      type: 'string',
      description: 'Concise visual description of the finished dish, using only ingredients and garnishes present in the recipe.',
    },
    suggestedKeywords: { type: 'array', items: { type: 'string' }, description: 'Three to eight keywords.' },

    // ── Structured recipe sections ──
    // Separate columns rather than part of `content`: the public page renders
    // them as their own blocks and emits schema.org Recipe markup from them.
    ingredients: {
      type: 'string',
      description:
        'Ingredient list as a single HTML <ul> of <li> items, each one quantity + ingredient (e.g. "<li>2 tbsp olive oil</li>"). No headings, no prose, no nested lists.',
    },
    method: {
      type: 'string',
      description:
        'Cooking steps as a single HTML <ol> of <li> items, in order, one action per step. No headings, no step numbers inside the text, no prose outside the list.',
    },

    // ── Recipe card ──
    // Whole minutes so the page can format them and emit ISO 8601 durations;
    // null where the value does not apply (a no-cook recipe has no cookMinutes).
    prepMinutes: { type: ['integer', 'null'], description: 'Hands-on preparation time in whole minutes.' },
    cookMinutes: { type: ['integer', 'null'], description: 'Active cooking time in whole minutes, or null if nothing is cooked.' },
    totalMinutes: {
      type: ['integer', 'null'],
      description:
        'Total time in whole minutes. Give a value ONLY when it exceeds prep + cook because of resting, marinating or chilling; otherwise null so the page adds the parts itself.',
    },
    servings: { type: 'string', description: 'Yield in natural words, e.g. "4 servings", "8 crescents", "1 loaf".' },
    course: { type: 'string', description: 'Course, e.g. "Dinner", "Dessert", "Breakfast".' },
    cuisine: { type: 'string', description: 'Cuisine, e.g. "American", "Italian". Use "International" when it fits no single tradition.' },
    calories: {
      type: ['integer', 'null'],
      description:
        'Approximate calories PER SERVING, derived by adding up the listed ingredient quantities and dividing by the yield. Null when the ingredients are too variable to estimate honestly.',
    },

    // ── Facebook post ──
    // Strict mode applies at every level, so the nested objects repeat
    // additionalProperties:false and list every property as required.
    socialPost: {
      type: 'object',
      additionalProperties: false,
      required: ['captions', 'hashtags', 'imagePrompt'],
      description: 'Ready-to-publish Facebook copy whose job is to send the reader to the article.',
      properties: {
        captions: {
          type: 'array',
          description:
            'Exactly four captions for the SAME article, each taking a genuinely different angle — for example a problem the reader recognises, a curiosity hook, a practical constraint like time or budget, and a seasonal or occasion angle. Name the angle in the angle field. Plain text only: no HTML, no markdown, no "link in bio", no hashtags inside the text. 2 to 4 sentences each, ending on a reason to open the recipe.',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['angle', 'text'],
            properties: {
              angle: { type: 'string', description: 'One or two words naming this variant\'s angle.' },
              text: { type: 'string', description: 'The caption itself, plain text, at most 500 characters.' },
            },
          },
        },
        hashtags: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Five to eight hashtags, WITHOUT the leading # and without spaces. Describe the dish, the method and the occasion. No branded or unrelated tags.',
        },
        imagePrompt: {
          type: 'string',
          description:
            'Brief for the social image. This is NOT the article cover: it has to stop a thumb mid-scroll, so favour a tight, appetising close-up with strong texture and contrast, shot for a square or portrait crop. Describe only food actually in this recipe. No text, no logo, no watermark, no people.',
        },
      },
    },
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
  'For recipes, make quantities, serving yield, pan size, equipment capacity, cooking sequence, liquid ratios and total timing internally consistent. Never call a recipe one-pan when another cooking vessel is required.',
  'Use conservative US food-safety guidance: whole beef/pork/lamb/veal cuts 145°F plus a 3-minute rest; fish 145°F; ground meat and egg dishes 160°F; poultry, casseroles and reheated leftovers 165°F. Never suggest a lower value as safe and never rely on color alone.',
  'Do not create instructions for home fermentation, canning, vacuum preservation or other pathogen-sensitive preservation processes. Choose a lower-risk topic instead.',
  'Do not recommend storing raw shell eggs mixed with other ingredients for later meal prep. Cook egg dishes fully before storage.',
  'Do not invent exact prices or health benefits. Use cautious storage guidance and tell readers to refrigerate perishable food promptly.',
  'The calories field is the ONE permitted nutrition estimate, and only as a per-serving figure computed from the ingredient quantities you listed divided by the yield. Return null rather than guessing when quantities are open-ended ("salt to taste", "oil for frying") or the yield is vague. Never state a calorie figure anywhere in the article body, and never give any other nutrition value.',
  'Do not call a dish healthy, balanced, high-protein, protein-packed, low-carb or suitable for a medical diet unless verified nutrition data was explicitly supplied.',
  'Avoid generic SEO templates. Vary the recipe format and vocabulary only where that improves clarity.',
  'Never mention that the text was produced by an AI, a model or an assistant.',
  'Do not pad: no filler paragraphs, no repeated sentences, no restated headings.',
  'Stay strictly on the given topic.',
  'Give no medical, legal or financial advice that could be unsafe; add no health claims.',
  'Do not reference images inside the article body.',
  'The imagePrompt must describe the exact finished dish from this recipe, including its visible ingredients, texture, cooking method and plating. Never add a garnish or ingredient absent from the recipe.',
  'The content field is reader-facing article HTML only. Never put imagePrompt, suggestedKeywords, SEO keywords, collection alignment, editorial notes, review notes, campaign instructions or JSON field labels inside content.',
  'Do not repeat the exact article title as an h2. Do not add generic Overview, Key Benefits, Conclusion or Final Note sections merely to reach the target length.',
  'Use campaign keywords sparingly and naturally. Never repeat an awkward exact-match phrase for SEO.',
  'Use only these HTML tags: p, h2, h3, ul, ol, li, strong, em, blockquote.',
  'Do not emit script, style, iframe, img, form or any on* attribute.',
  'Only add a link when it is genuinely necessary, and only to a well-known https site.',
  'The ingredients and method fields must describe exactly the same recipe as the article body: same quantities, same steps, same yield, same cookware. They are the version readers actually cook from, so they must be complete on their own — never "see above" and never a subset.',
  'Do not repeat the full ingredient list or the numbered steps inside content. The body explains and contextualises; ingredients and method carry the recipe itself.',
  'prepMinutes, cookMinutes, servings, course and cuisine must match what the method actually describes. Set totalMinutes only when resting, marinating or chilling makes the real total exceed prep + cook.',
  'The socialPost captions promote THIS article and must stay inside what it actually delivers: every time, yield or claim in a caption has to appear in the recipe. No invented reader reactions, no "everyone loved it", no ratings, no scarcity or urgency invented for effect, no health claims, no emoji spam, and never a hint that the text was produced by an AI.',
  'Make the four captions genuinely different in angle and in opening sentence. Four rewordings of the same hook are a failure, not four variants.',
  'The socialPost imagePrompt describes a different shot from the article cover — closer, more tactile, framed for a feed — but of the same finished dish, with no ingredient or garnish the recipe does not contain.',
].join('\n- ')

// The model does this review inside the same call and returns only the corrected
// article. It is deliberately explicit: "write like a human" is too vague to
// catch arithmetic, recipe-safety and near-duplicate failures consistently.
const SILENT_REVIEW_CHECKLIST = [
  'Originality: compare the proposed article with every title in the avoid-list. Reject cosmetic variations that keep the same main ingredient, starch, cooking vessel, sauce and reader promise.',
  'Editorial value: make sure the article gives topic-specific help rather than generic filler or a reusable SEO template.',
  'Recipe arithmetic: recalculate ingredient totals, serving yield and every per-serving statement; remove any number that cannot be supported.',
  'Method consistency: simulate the recipe from start to finish. Confirm that every ingredient is used, every step is physically workable in the named cookware, the pan is not overcrowded, vessel size is plausible, liquid ratios are coherent and prep plus cook time equals total time.',
  'Food safety: check conservative internal temperatures, refrigeration, cooling, reheating and allergen wording where relevant.',
  'Language quality: remove awkward phrases, mistranslations, contradictions, repeated conclusions and robotic transitions.',
  'Trust: remove personal anecdotes, testing claims, ratings, prices, nutrition figures, credentials or reader feedback that were not supplied as verified facts.',
  'Clean output: ensure content contains no image prompt, keywords list, collection alignment, campaign instruction, internal note, duplicated title, repeated variations section or editorial checklist.',
  'Structured fields: confirm ingredients is a plain <ul> and method a plain <ol>, that every ingredient listed is used by a step, that every step\'s ingredients appear in the list, and that the card timings, yield and calories follow from them.',
  'Social copy: confirm each caption stands on a different angle, states nothing the recipe does not support, carries no hashtags inside its text, and would make a scrolling reader want to open the article.',
].join('\n- ')

// Owns the editorial contract — prompts, schemas, review checklist — and nothing
// about any particular vendor. It asks the shared AI_PROVIDER seam for
// structured generation, so whichever vendor the admin selected serves the call.
@Injectable()
export class ArticleContentProvider implements AiContentProvider {
  constructor(
    private readonly config: AiContentConfig,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
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
        'Diversify primary ingredient, cooking method, cuisine direction, meal type and reader intent; do not return a list of cosmetic variations on one base recipe. ' +
        'Treat two recipes as overlapping when a reader would consider them substantially the same meal even if adjectives, vegetables, sauce or SEO keywords differ.',
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
    const keywords = request.keywords.length
      ? `\nThese are topic hints, not mandatory exact-match phrases: ${request.keywords.join(', ')}. Use only those that read naturally and never print a keyword list.`
      : ''

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
        'Choose only sections that genuinely help this specific recipe. Use h2 and, where useful, h3 and lists; vary the structure naturally between articles.\n' +
        'Keep the title concise and specific, preferably 50–70 characters. Put imagePrompt and suggestedKeywords only in their dedicated JSON fields, never in content.\n' +
        'Fill ingredients and method as the cookable recipe itself, and the card fields (times, servings, course, cuisine, calories) so they agree with it.\n' +
        'Then write socialPost: four differently-angled Facebook captions for this article, hashtags, and a brief for a scroll-stopping image.\n\n' +
        'Before returning the JSON, silently act as a senior human editor and correct the draft using this checklist. ' +
        'Return only the final corrected article; do not output the checklist or review notes.\n- ' +
        SILENT_REVIEW_CHECKLIST +
        avoid,
    })

    return { article: parsed.value, usage: parsed.usage }
  }

  // Vendor access goes through the shared provider seam, which owns routing,
  // timeouts, error classification and log redaction for every AI feature.
  private async respond<T>(options: {
    model: string
    timeoutMs: number
    maxOutputTokens: number
    schemaName: string
    schema: unknown
    instructions: string
    input: string
  }): Promise<{ value: T; usage: { inputTokens: number; outputTokens: number } }> {
    return this.ai.generateJson<T>({
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

// Lives next to the OpenAI SDK call site; re-exported so existing importers of
// this module keep resolving it.
export { isReasoningModel } from '../../ai/openai.client'
