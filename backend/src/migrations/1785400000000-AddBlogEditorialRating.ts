import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBlogEditorialRating1785400000000 implements MigrationInterface {
  name = 'AddBlogEditorialRating1785400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "editorialRating" real`)
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD CONSTRAINT "CHK_blog_posts_editorial_rating" CHECK ("editorialRating" IS NULL OR ("editorialRating" >= 0 AND "editorialRating" <= 10))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP CONSTRAINT "CHK_blog_posts_editorial_rating"`)
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "editorialRating"`)
  }
}
