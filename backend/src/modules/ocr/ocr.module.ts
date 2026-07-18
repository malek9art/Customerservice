import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { DocumentIntelligenceService } from './document-intelligence.service';
import { DocumentIntelligenceController } from './document-intelligence.controller';

@Module({
  controllers: [DocumentIntelligenceController],
  providers: [OcrService, DocumentIntelligenceService],
  exports: [OcrService, DocumentIntelligenceService],
})
export class OcrModule {}
