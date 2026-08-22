// Moved to src/ai/errors.ts when the OpenAI call layer was shared between the
// blog-campaign module and the project auto-fill. Re-exported here so every
// existing `./lib/errors` import inside ai-content keeps working unchanged.
export * from '../../ai/errors'
