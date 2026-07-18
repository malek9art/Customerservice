import { Module } from '@nestjs/common';
import { SaasService } from './saas.service';
import { SaasController } from './saas.controller';

@Module({
  controllers: [SaasController],
  providers: [SaasService],
  exports: [SaasService],
})
export class SaasModule {}
