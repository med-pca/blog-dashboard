import { IsString, IsUUID, MaxLength } from 'class-validator'

// Geçmiş sunucuda (Redis) tutulur: istemci yalnızca yeni kullanıcı mesajını
// yollar. sessionId konuşma başına frontend'de üretilen UUID'dir ve geçmişin
// anahtarıdır — artık zorunlu.
export class ChatBodyDto {
  @IsUUID('4')
  sessionId: string

  @IsString()
  @MaxLength(1000)
  message: string
}
