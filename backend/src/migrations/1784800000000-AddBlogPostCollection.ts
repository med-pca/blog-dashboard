import { MigrationInterface, QueryRunner } from 'typeorm'

// Blog yazılarını koleksiyonlara (projects) bağlar: koleksiyon detay sayfası
// "bu koleksiyondaki tarifler" listesini bu kolondan üretir.
export class AddBlogPostCollection1784800000000 implements MigrationInterface {
  name = 'AddBlogPostCollection1784800000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "collectionId" uuid`)
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD CONSTRAINT "FK_blog_posts_collectionId"
      FOREIGN KEY ("collectionId") REFERENCES "projects"("id") ON DELETE SET NULL
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_blog_posts_collectionId_published" ON "blog_posts" ("collectionId", "published")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blog_posts_collectionId_published"`)
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "FK_blog_posts_collectionId"`,
    )
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "collectionId"`)
  }
}
