import { Injectable, Logger } from '@nestjs/common';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';

export enum OcrType {
  PASSPORT = 'PASSPORT',
  NATIONAL_ID = 'NATIONAL_ID',
  RECEIPT = 'RECEIPT',
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private ai: AiOrchestrator) {}

  async processDocument(fileUrl: string, type: OcrType, companyId: string) {
    this.logger.log(`Starting OCR Pipeline for ${type} on ${fileUrl}`);

    // 1. Image Preprocessing (Sharp would be used here)
    // 2. Vision API / OCR extraction
    const rawText = `MOCK OCR DATA FROM ${type}`;

    // 3. AI Structuring (Calling AI Orchestrator with tool-calling)
    const prompt = `Extract structured data from this ${type} OCR text: ${rawText}`;
    const structuredData = await this.ai.process(prompt, {
      companyId,
      task: 'OCR_EXTRACTION',
    });

    return {
      type,
      data: structuredData,
      confidenceScore: 0.98,
      needsManualReview: false,
      processedAt: new Date().toISOString(),
    };
  }
}
