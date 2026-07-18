import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma.service';
import { StorageService } from '../storage/storage.service';
import { OcrService } from '../ocr/ocr.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { AuditService } from '../audit/audit.service';
import { WorkflowService } from '../workflows/workflows.service';

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        PrismaService,
        StorageService,
        OcrService,
        AiOrchestrator,
        AuditService,
        WorkflowService,
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
