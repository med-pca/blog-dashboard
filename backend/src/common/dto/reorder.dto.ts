import { IsArray, IsInt, IsOptional, IsUUID, ArrayMaxSize, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class ReorderDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(500)
  orderedIds: string[]

  // Sayfalanmış listelerde gönderilen sayfanın global başlangıç indeksi.
  // Verilmezse 0: sayfalamayan panellerde davranış değişmez.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number
}
