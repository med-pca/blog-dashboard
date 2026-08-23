import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAiCampaignCollection1785000000000 implements MigrationInterface {
  name = 'AddAiCampaignCollection1785000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ai_content_campaigns" ADD COLUMN IF NOT EXISTS "collectionId" uuid`)
    await queryRunner.query(`
      ALTER TABLE "ai_content_campaigns"
      ADD CONSTRAINT "FK_ai_campaigns_collection"
      FOREIGN KEY ("collectionId") REFERENCES "projects"("id") ON DELETE SET NULL
    `)
    // Old campaigns have no deterministic collection. Pause them rather than
    // generating orphaned drafts; the admin can select a collection and resume.
    await queryRunner.query(`
      UPDATE "ai_content_campaigns"
      SET "enabled" = false, "status" = 'paused', "nextGenerationAt" = NULL
      WHERE "collectionId" IS NULL
    `)
    await queryRunner.query(`CREATE INDEX "IDX_ai_campaigns_collection" ON "ai_content_campaigns" ("collectionId")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_campaigns_collection"`)
    await queryRunner.query(`ALTER TABLE "ai_content_campaigns" DROP CONSTRAINT IF EXISTS "FK_ai_campaigns_collection"`)
    await queryRunner.query(`ALTER TABLE "ai_content_campaigns" DROP COLUMN IF EXISTS "collectionId"`)
  }
}
