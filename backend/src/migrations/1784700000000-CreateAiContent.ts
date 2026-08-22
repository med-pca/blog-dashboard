import { MigrationInterface, QueryRunner } from 'typeorm'

// Autonomous blog generation: campaigns (the editorial brief plus its cadence)
// and one row per generation attempt. blog_posts gains a flag so the admin list
// can mark a draft that came from a campaign.
export class CreateAiContent1784700000000 implements MigrationInterface {
  name = 'CreateAiContent1784700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    await queryRunner.query(`
      CREATE TABLE "ai_content_campaigns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120) NOT NULL,
        "masterPrompt" text NOT NULL,
        "language" character varying(40) NOT NULL DEFAULT 'English',
        "tone" character varying(40) NOT NULL DEFAULT 'friendly and practical',
        "targetWords" integer NOT NULL DEFAULT 1200,
        "keywords" text array NOT NULL DEFAULT '{}',
        "dailyTarget" integer NOT NULL DEFAULT 2,
        "intervalMinutes" integer NOT NULL DEFAULT 20,
        "generationStartHour" integer NOT NULL DEFAULT 8,
        "generationEndHour" integer NOT NULL DEFAULT 22,
        "timezone" character varying(64) NOT NULL DEFAULT 'UTC',
        "enabled" boolean NOT NULL DEFAULT false,
        "status" character varying(20) NOT NULL DEFAULT 'paused',
        "generatedToday" integer NOT NULL DEFAULT 0,
        "generatedTodayDate" date,
        "lastGenerationAt" TIMESTAMP,
        "nextGenerationAt" TIMESTAMP,
        "lastRunAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_content_campaigns_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_ai_campaigns_window" CHECK ("generationStartHour" >= 0 AND "generationEndHour" <= 24 AND "generationStartHour" < "generationEndHour"),
        CONSTRAINT "CHK_ai_campaigns_interval" CHECK ("intervalMinutes" >= 5),
        CONSTRAINT "CHK_ai_campaigns_target" CHECK ("dailyTarget" >= 1)
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_campaigns_enabled_status" ON "ai_content_campaigns" ("enabled", "status")`,
    )

    await queryRunner.query(`
      CREATE TABLE "ai_generation_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId" uuid NOT NULL,
        "queueJobId" character varying(120) NOT NULL,
        "plannedFor" TIMESTAMP NOT NULL,
        "topic" character varying(300),
        "normalizedTopic" character varying(300),
        "status" character varying(20) NOT NULL DEFAULT 'queued',
        "triggerType" character varying(20) NOT NULL DEFAULT 'scheduled',
        "attempt" integer NOT NULL DEFAULT 0,
        "maxAttempts" integer NOT NULL DEFAULT 3,
        "blogPostId" uuid,
        "model" character varying(60) NOT NULL,
        "inputTokens" integer,
        "outputTokens" integer,
        "estimatedCost" numeric(12,6),
        "errorCode" character varying(60),
        "errorMessage" text,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_generation_jobs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ai_generation_jobs_queueJobId" UNIQUE ("queueJobId"),
        CONSTRAINT "FK_ai_generation_jobs_campaign" FOREIGN KEY ("campaignId")
          REFERENCES "ai_content_campaigns"("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_jobs_campaign_status" ON "ai_generation_jobs" ("campaignId", "status")`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_ai_jobs_createdAt" ON "ai_generation_jobs" ("createdAt")`)
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_jobs_status_plannedFor" ON "ai_generation_jobs" ("status", "plannedFor")`,
    )

    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "aiGenerated" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "aiGenerated"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_jobs_status_plannedFor"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_jobs_createdAt"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_jobs_campaign_status"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_generation_jobs"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_campaigns_enabled_status"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_content_campaigns"`)
  }
}
