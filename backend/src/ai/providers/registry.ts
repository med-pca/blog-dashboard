// The catalogue of model vendors this backend can talk to. Everything that
// differs between vendors is data in this table — adding one means adding a row
// here plus its key in the environment, never touching the router, a controller
// or the frontend.
//
// Every value below was probed against the real APIs on 2026-09-12 rather than
// taken from documentation; the notes record what the probe actually returned.

export const AI_VENDOR_NAMES = ['openai', 'gemini', 'qwen', 'deepseek', 'groq'] as const

export type AiVendorName = (typeof AI_VENDOR_NAMES)[number]

// How the vendor is spoken to.
//   'responses' — OpenAI's Responses API (instructions + input + output_text).
//   'chat'      — the OpenAI-compatible /chat/completions shape everyone else
//                 implements. Same SDK, different baseURL.
//   'groq'      — the legacy in-house adapter kept for rollback.
export type AiVendorApi = 'responses' | 'chat' | 'groq'

// Whether the vendor honours `response_format: json_schema` with strict:true.
// When it does not, the router falls back to `json_object` and inlines the
// schema into the instructions so the model still knows the expected shape.
export type AiJsonMode = 'schema' | 'object'

export interface AiVendor {
  readonly name: AiVendorName
  readonly label: string
  // null means "the SDK's own default host" (api.openai.com).
  readonly baseUrl: string | null
  readonly defaultModel: string
  readonly api: AiVendorApi
  readonly jsonMode: AiJsonMode
  // Environment variable holding this vendor's credential.
  readonly apiKeyEnv: string
  // Optional overrides so a moved endpoint or a new model needs no redeploy.
  readonly baseUrlEnv: string
  readonly modelEnv: string
  // Shown in the admin panel under the vendor name.
  readonly note: string
}

export const AI_VENDORS: Record<AiVendorName, AiVendor> = {
  openai: {
    name: 'openai',
    label: 'OpenAI',
    baseUrl: null,
    defaultModel: 'gpt-5-nano',
    api: 'responses',
    jsonMode: 'schema',
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrlEnv: 'OPENAI_BASE_URL',
    modelEnv: 'OPENAI_MODEL',
    note: 'The original path. Only vendor reached through the Responses API, and the only one that generates cover images today.',
  },

  gemini: {
    name: 'gemini',
    label: 'Google Gemini',
    // Probed: this path answers, and it requires a Bearer header — the usual
    // Google `?key=` and `x-goog-api-key` transports both return 400 here.
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    // Probed: gemini-2.5-* is closed to new accounts and answers 404 with the
    // body "no longer available to new users". The /models listing still
    // advertises those models, so it cannot be trusted as an availability list.
    // gemini-3.6-flash and gemini-3.1-flash-lite both answered; 3.5 and 3.8
    // timed out at 60s and are deliberately not the default.
    defaultModel: 'gemini-3.6-flash',
    api: 'chat',
    jsonMode: 'schema',
    apiKeyEnv: 'GEMINI_API_KEY',
    baseUrlEnv: 'GEMINI_BASE_URL',
    modelEnv: 'GEMINI_MODEL',
    note: 'Fast and supports strict JSON schemas. Model ids move quickly — check the panel if calls start returning 404.',
  },

  qwen: {
    name: 'qwen',
    label: 'Qwen — Alibaba Model Studio',
    // Probed: this is the INTERNATIONAL endpoint. The mainland host
    // (dashscope.aliyuncs.com) rejects an international key with 401
    // invalid_api_key, so the two are not interchangeable.
    //
    // ⚠️ Requires NODE_OPTIONS=--dns-result-order=ipv4first. Alibaba publishes
    // AAAA records that hang on connect from some networks; Node then waits for
    // the full timeout with no useful error. See .env.example.
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3.8-flash',
    api: 'chat',
    jsonMode: 'schema',
    apiKeyEnv: 'QWEN_API_KEY',
    baseUrlEnv: 'QWEN_BASE_URL',
    modelEnv: 'QWEN_MODEL',
    note: 'Hosts 165 models on one key, including DeepSeek (deepseek-v4-flash-0731, deepseek-v4-pro-0813), Kimi and GLM — a DeepSeek model can be run from here without a separate DeepSeek balance.',
  },

  deepseek: {
    name: 'deepseek',
    label: 'DeepSeek (direct)',
    baseUrl: 'https://api.deepseek.com/v1',
    // Probed: /models returns exactly these two ids — not the widely documented
    // "deepseek-chat", which does not exist on this account.
    defaultModel: 'deepseek-flash',
    api: 'chat',
    // Left at 'object' on purpose: the account had a zero balance, so every
    // generation call answered 402 and strict-schema support could never be
    // confirmed. 'object' works on every OpenAI-compatible vendor, so it is the
    // safe assumption; raise it to 'schema' once a real call has succeeded.
    jsonMode: 'object',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseUrlEnv: 'DEEPSEEK_BASE_URL',
    modelEnv: 'DEEPSEEK_MODEL',
    note: 'Prepaid: a zero balance answers 402 on every call while the key itself still looks valid. Reaching DeepSeek through Qwen avoids topping up twice.',
  },

  groq: {
    name: 'groq',
    label: 'Groq (legacy)',
    baseUrl: null,
    defaultModel: '',
    api: 'groq',
    jsonMode: 'object',
    apiKeyEnv: 'GROQ_API_KEY',
    baseUrlEnv: 'GROQ_BASE_URL',
    modelEnv: 'GROQ_MODEL',
    note: 'Pre-migration adapter, kept only as a rollback path. Its model and keys are managed by GroqService, not by this table.',
  },
}

export function isAiVendorName(value: unknown): value is AiVendorName {
  return typeof value === 'string' && (AI_VENDOR_NAMES as readonly string[]).includes(value)
}

export function vendor(name: AiVendorName): AiVendor {
  return AI_VENDORS[name]
}

// The vendor used when nothing has been chosen yet and when the selected one
// turns out to have no key. OpenAI is the path that has been in production
// longest, so a misconfiguration degrades to the known-good route.
export const FALLBACK_VENDOR: AiVendorName = 'openai'
