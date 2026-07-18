import { Module } from '@nestjs/common';
import { PassportProcessingService } from './passport-processing.service';
import { PassportProcessingController } from './passport-processing.controller';

@Module({
  controllers: [PassportProcessingController],
  providers: [PassportProcessingService],
  exports: [PassportProcessingService],
})
export class PassportProcessingModule {}
