import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBlogAiImagePrompt1785100000000 implements MigrationInterface {
  name = 'AddBlogAiImagePrompt1785100000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "blog_posts" ADD "aiImagePrompt" text')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "blog_posts" DROP COLUMN "aiImagePrompt"')
  }
}
