import { MigrationInterface, QueryRunner } from 'typeorm'

export class ArchiveAiCampaigns1785200000000 implements MigrationInterface {
  name = 'ArchiveAiCampaigns1785200000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_content_campaigns" ADD COLUMN IF NOT EXISTS "archivedAt" timestamp NULL`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_campaigns_archivedAt" ON "ai_content_campaigns" ("archivedAt")`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_campaigns_archivedAt"`)
    await queryRunner.query(`ALTER TABLE "ai_content_campaigns" DROP COLUMN IF EXISTS "archivedAt"`)
  }
}
