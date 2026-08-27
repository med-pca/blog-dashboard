import { MigrationInterface, QueryRunner } from 'typeorm'

// Fiche recette (prep/cook/servings...). Hepsi nullable: mevcut yazılar
// dokunulmadan kalır ve kart yalnızca doldurulmuş alanlarla görünür.
export class AddRecipeCardMetadata1785600000000 implements MigrationInterface {
  name = 'AddRecipeCardMetadata1785600000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "prepMinutes" integer`)
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "cookMinutes" integer`)
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "totalMinutes" integer`)
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "servings" character varying(80)`)
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "course" character varying(80)`)
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "cuisine" character varying(120)`)
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "calories" integer`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "calories"`)
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "cuisine"`)
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "course"`)
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "servings"`)
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "totalMinutes"`)
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "cookMinutes"`)
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "prepMinutes"`)
  }
}
