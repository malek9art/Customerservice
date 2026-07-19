import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StorageService } from '../storage/storage.service';
import { OcrService, OcrType } from '../ocr/ocr.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { WorkflowService } from '../workflows/workflows.service';
import { BreService } from '../bre/bre.service';

@Injectable()
export class DocumentIntelligenceService {
  private readonly logger = new Logger(DocumentIntelligenceService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private ocr: OcrService,
    private ai: AiOrchestrator,
    private workflow: WorkflowService,
    private bre: BreService,
  ) {}

  async processAndVault(
    companyId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    metadata: { customerId?: string; type: string; tags?: string[] },
  ) {
    // 1. Upload to secure vault
    const uploaded = await this.storage.uploadFile(
      companyId,
      file,
      fileName,
      mimeType,
      true,
    );

    // 2. Initial OCR & Classification
    const ocrResult = await this.ocr.processDocument(
      uploaded.url,
      metadata.type as OcrType,
      companyId,
    );

    // 3. AI Data Extraction & MRZ Reading
    const extractionPrompt = `Extract all fields from this ${metadata.type} document text: ${JSON.stringify(ocrResult.data)}. 
    Check for fraud, expiry dates, and specific identifiers (MRZ for passports).`;

    const intelligence = await this.ai.process(extractionPrompt, {
      companyId,
      task: 'DOC_INTELLIGENCE',
    });
    const aiData = intelligence.response as any;

    // 4. Evaluate Business Rules (e.g., expiry check, validity rules)
    const validationRules = await this.bre.evaluate(
      companyId,
      'DOC_VALIDATION',
      { type: metadata.type, data: aiData },
    );

    // 5. Create Document Record
    const doc = await (this.prisma as any).document.create({
      data: {
        companyId,
        customerId: metadata.customerId,
        type: metadata.type,
        status: 'PROCESSING',
        fileName,
        fileUrl: uploaded.url,
        mimeType,
        size: file.length,
        ocrData: ocrResult.data,
        confidenceScore: ocrResult.confidenceScore,
        extractedData: aiData,
        expiryDate: aiData.expiryDate ? new Date(aiData.expiryDate) : null,
        issueDate: aiData.issueDate ? new Date(aiData.issueDate) : null,
        tags: metadata.tags || [],
        metadata: { validationRules },
      },
    });

    // 6. Trigger Workflows
    await this.workflow.trigger('document.processed', {
      documentId: doc.id,
      status: doc.status,
      expiryDate: doc.expiryDate,
    });

    return doc;
  }

  async getDocumentTimeline(documentId: string) {
    // Retrieve version history and activity logs for this document
    return (this.prisma as any).document.findUnique({
      where: { id: documentId },
      include: { versions: true },
    });
  }

  async searchInsideDocuments(companyId: string, query: string) {
    // Semantic/Full-text search logic
    return (this.prisma as any).document.findMany({
      where: {
        companyId,
        extractedData: {
          path: ['$.content'],
          operator: 'contains',
          value: query,
        },
      },
    });
  }
}
