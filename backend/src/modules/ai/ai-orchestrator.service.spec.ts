import { Test, TestingModule } from '@nestjs/testing';
import { AiOrchestrator } from './ai-orchestrator.service';
import { AiToolRegistry } from './tools/ai-tool-registry.service';
import { AiMemoryService } from './memory/ai-memory.service';
import { PrismaService } from '../../prisma.service';
import { WorkflowService } from '../workflows/workflows.service';
import { BreService } from '../bre/bre.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AiOrchestrator (Stateful Multi-Agent Chains)', () => {
  let service: AiOrchestrator;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiOrchestrator,
        AiToolRegistry,
        AiMemoryService,
        PrismaService,
        WorkflowService,
        BreService,
        ConfigService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<AiOrchestrator>(AiOrchestrator);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should plan, execute, and verify a stateful multi-agent chain for Umrah booking request', async () => {
    const session = await (prisma as any).chatSession.create({
      data: {
        companyId: 'comp-id',
        customerId: 'cust-1',
        whatsappNumber: '+966501234567',
        status: 'ACTIVE',
      },
    });

    const chainResult = await service.executeStatefulChain(
      'comp-id',
      'I want to book a Ramadan Umrah package for 2 adults',
      { sessionId: session.id, whatsappNumber: '+966501234567' },
    );

    expect(chainResult.chainId).toBeDefined();
    expect(chainResult.plan.length).toBeGreaterThanOrEqual(3);
    expect(chainResult.status).toBe('VERIFIED_SUCCESS');
    expect(chainResult.verification.isValid).toBe(true);

    // Verify step execution logs recorded in database
    const logs = await (prisma as any).aiActionLog.findMany({
      where: { sessionId: session.id },
    });

    expect(logs.length).toBeGreaterThan(0);
  });
});
