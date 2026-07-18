import { Module } from '@nestjs/common';
import { PilgrimageService } from './pilgrimage.service';
import { PilgrimageController } from './pilgrimage.controller';
import { PackageEngineModule } from '../package-engine/package-engine.module';

@Module({
  imports: [PackageEngineModule],
  controllers: [PilgrimageController],
  providers: [PilgrimageService],
  exports: [PilgrimageService],
})
export class PilgrimageModule {}
