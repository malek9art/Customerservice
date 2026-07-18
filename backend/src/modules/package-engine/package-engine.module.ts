import { Module } from '@nestjs/common';
import { PackageEngineService } from './package-engine.service';
import { PackageEngineController } from './package-engine.controller';

@Module({
  controllers: [PackageEngineController],
  providers: [PackageEngineService],
  exports: [PackageEngineService],
})
export class PackageEngineModule {}
