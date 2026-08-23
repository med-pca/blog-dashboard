import { MigrationInterface, QueryRunner } from 'typeorm'

// The quote form inherited from the solar site collected a required phone
// number, a city, a service type and a monthly bill. On a recipe blog none of
// those have a purpose, and collecting them fails data minimisation — the form
// is now name + email + message, so the unused columns go.
export class QuoteRequestsToContactMessages1784900000000 implements MigrationInterface {
  name = 'QuoteRequestsToContactMessages1784900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quote_requests" ADD COLUMN "email" character varying(180)`)
    await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "phone"`)
    await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "city"`)
    await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "serviceType"`)
    await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "monthlyBill"`)

    // A contact inbox has no sales pipeline: contacted -> replied, won/lost -> closed.
    await queryRunner.query(`UPDATE "quote_requests" SET "status" = 'replied' WHERE "status" = 'contacted'`)
    await queryRunner.query(`UPDATE "quote_requests" SET "status" = 'closed' WHERE "status" IN ('won', 'lost')`)
  }

  // The dropped values cannot be recovered — down() restores the shape only, so
  // rolling back leaves existing rows with NULL phone/city/monthlyBill and the
  // 'diger' ("other") service type the old form used as its catch-all.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quote_requests" ADD COLUMN "phone" character varying(20)`)
    await queryRunner.query(`ALTER TABLE "quote_requests" ADD COLUMN "city" character varying(120)`)
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ADD COLUMN "serviceType" character varying(40) NOT NULL DEFAULT 'diger'`,
    )
    await queryRunner.query(`ALTER TABLE "quote_requests" ADD COLUMN "monthlyBill" integer`)
    await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "email"`)

    // 'closed' collapsed won and lost together, so the rollback cannot tell them
    // apart — everything closed comes back as 'lost'.
    await queryRunner.query(`UPDATE "quote_requests" SET "status" = 'contacted' WHERE "status" = 'replied'`)
    await queryRunner.query(`UPDATE "quote_requests" SET "status" = 'lost' WHERE "status" = 'closed'`)
  }
}
