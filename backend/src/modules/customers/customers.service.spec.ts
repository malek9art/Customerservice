import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma.service';
import { StorageService } from '../storage/storage.service';
import { OcrService } from '../ocr/ocr.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { AiToolRegistry } from '../ai/tools/ai-tool-registry.service';
import { AiMemoryService } from '../ai/memory/ai-memory.service';
import { BreService } from '../bre/bre.service';
import { AuditService } from '../audit/audit.service';
import { WorkflowService } from '../workflows/workflows.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
        AiToolRegistry,
        AiMemoryService,
        BreService,
        AuditService,
        WorkflowService,
        ConfigService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
