import { MigrationInterface, QueryRunner } from 'typeorm'

// The "Community" section (client/reference logos) was inherited from the solar
// site and has no place on a recipe blog. The whole feature is gone — page,
// admin screens, API module — so the table goes with it.
//
// DESTRUCTIVE: the rows are not recoverable from this migration. Any logo files
// under /uploads become orphans and the weekly uploads-cleanup job will remove
// them on its next run.
export class DropReferences1784900000001 implements MigrationInterface {
  name = 'DropReferences1784900000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_references_published_sortOrder"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "references"`)
  }

  // Restores the empty table so a rollback leaves a working schema; the data
  // itself is gone for good.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "references" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "logo" character varying,
        "published" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_references_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_references_published_sortOrder" ON "references" ("published", "sortOrder")`,
    )
  }
}
