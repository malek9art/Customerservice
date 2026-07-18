import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BreService } from '../bre/bre.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { WorkflowService } from '../workflows/workflows.service';
import { AuditService } from '../audit/audit.service';
import { nanoid } from 'nanoid';

@Injectable()
export class VisaService {
  private readonly logger = new Logger(VisaService.name);

  constructor(
    private prisma: PrismaService,
    private bre: BreService,
    private ai: AiOrchestrator,
    private workflow: WorkflowService,
    private audit: AuditService,
  ) {}

  async createApplication(companyId: string, data: any) {
    const referenceNumber = `VISA-${nanoid(8).toUpperCase()}`;
    const requirements = await this.bre.evaluate(
      companyId,
      'VISA_REQUIREMENTS',
      data,
    );
    const aiCheck = await this.ai.process(`Assess visa eligibility`, {
      companyId,
    });

    return {
      id: 'mock-visa-id',
      referenceNumber,
      requirements,
      eligibilityData: aiCheck.response,
    };
  }

  async getDashboard(companyId: string) {
    return { stats: { total: 0, pending: 0 }, kanban: {} };
  }

  async updateStatus(
    id: string,
    status: string,
    actorId: string,
    notes?: string,
  ) {
    return { id, status };
  }
}
