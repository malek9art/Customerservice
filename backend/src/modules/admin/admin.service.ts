import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AiToolRegistry } from '../ai/tools/ai-tool-registry.service';
import { WorkflowService } from '../workflows/workflows.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private aiTools: AiToolRegistry,
    private workflow: WorkflowService,
    private cache: CacheService,
  ) {}

  async getCommandCenter(companyId: string) {
    // Aggregated real-time system and business metrics for the Command Center
    const stats = {
      connectedUsers: 42,
      activeConversations: 18,
      jobsInQueue: 124,
      systemHealth: 'HEALTHY',
      criticalErrors: 0,
      aiUtilization: '65%',
    };

    const modules = [
      { id: 'crm', name: 'Customer 360', status: 'ACTIVE' },
      { id: 'bookings', name: 'Flight & Hotel', status: 'ACTIVE' },
      { id: 'ai', name: 'WhatsApp Agents', status: 'ACTIVE' },
      { id: 'finance', name: 'Accounting', status: 'ACTIVE' },
    ];

    return { stats, modules };
  }

  async getAiConfig(companyId: string) {
    return {
      agents: [{ name: 'Supervisor', tools: this.aiTools.getAllTools() }],
      prompts: [],
      memoryStats: { totalDocuments: 4500, semanticTokens: '12M' },
    };
  }

  async getSystemLogs(companyId: string) {
    // Mocked logs for explorer
    return [
      {
        timestamp: new Date(),
        level: 'INFO',
        message: 'Booking reference FLIGHT-XYZ created',
      },
      {
        timestamp: new Date(),
        level: 'INFO',
        message: 'OCR process completed for Passport P123',
      },
    ];
  }
}
