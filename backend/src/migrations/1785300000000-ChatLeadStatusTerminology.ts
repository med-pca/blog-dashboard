import { MigrationInterface, QueryRunner } from 'typeorm'

// Chatbot artık WhatsApp'a devretmiyor; lead statüleri de konuşmanın kendi
// sonucunu anlatıyor. Şema DEĞİŞMİYOR: "status" varchar(20) olarak kalır
// ('contact_requested' 17 karakter, sığar). Yalnızca eski satırların değeri
// yeni sözlüğe taşınır.
//
// Eşleme: eski 'whatsapp' = ziyaretçi konuşmayı o günün akışında sonuna kadar
// götürmüştü, yani chatbot işini yapmıştı -> 'assisted'. Yeni 'contact_requested'
// geçmişe dönük olarak hiçbir satıra uygulanmaz (o olay o dönemde yoktu).
export class ChatLeadStatusTerminology1785300000000 implements MigrationInterface {
  name = 'ChatLeadStatusTerminology1785300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "chat_leads" SET "status" = 'assisted' WHERE "status" = 'whatsapp'`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "chat_leads" SET "status" = 'whatsapp' WHERE "status" = 'assisted'`)
  }
}
