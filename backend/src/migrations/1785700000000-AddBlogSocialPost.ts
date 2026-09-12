import { MigrationInterface, QueryRunner } from 'typeorm'

// Makaleyle birlikte üretilen, yayına hazır sosyal medya metni (birden çok
// açıklama varyantı, hashtag'ler ve bir görsel brief'i). Tek jsonb sütun:
// varyant listesi değişken uzunlukta ve hiçbir alan üzerinde filtre/sıralama
// yapılmıyor. Nullable — mevcut yazılar dokunulmadan kalır.
export class AddBlogSocialPost1785700000000 implements MigrationInterface {
  name = 'AddBlogSocialPost1785700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "socialPost" jsonb`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "socialPost"`)
  }
}
