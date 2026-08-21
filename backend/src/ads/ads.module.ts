import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppSetting } from '../instagram-token/app-setting.entity'
import { AdsController } from './ads.controller'
import { AdsTxtController } from './ads-txt.controller'
import { AdsService } from './ads.service'

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting])],
  controllers: [AdsController, AdsTxtController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
