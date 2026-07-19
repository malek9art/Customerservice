import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BreService } from '../bre/bre.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { WorkflowService } from '../workflows/workflows.service';
import { AuditService } from '../audit/audit.service';
import { nanoid } from 'nanoid';
import { CreateVisaApplicationDto } from './dto/create-visa-application.dto';

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

  async createApplication(companyId: string, data: CreateVisaApplicationDto) {
    const customer = await (this.prisma as any).customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer || customer.companyId !== companyId) {
      throw new NotFoundException('Customer not found');
    }

    const referenceNumber = `VISA-${nanoid(8).toUpperCase()}`;
    const requirements = await this.bre.evaluate(
      companyId,
      'VISA_REQUIREMENTS',
      data,
    );
    const aiCheck = await this.ai.process('Assess visa eligibility', {
      companyId,
      customerId: data.customerId,
      country: data.country,
      visaType: data.visaType,
    });

    const application = await (this.prisma as any).visaRecord.create({
      data: {
        customerId: data.customerId,
        country: data.country,
        visaType: data.visaType,
        status: 'DRAFT',
        referenceNumber,
        requirements,
        eligibilityData: aiCheck.response,
      },
    });

    await this.workflow.trigger('visa.application_created', {
      id: application.id,
      customerId: data.customerId,
      companyId,
      amount: data.fee ?? 100,
      currency: 'USD',
    });
    await this.audit.log({
      companyId,
      action: 'VISA_APPLICATION_CREATED',
      entityType: 'VISA',
      entityId: application.id,
      newValues: application,
    });

    return application;
  }

  async getDashboard(companyId: string) {
    const customers = await (this.prisma as any).customer.findMany({
      where: { companyId },
    });
    const customerIds = new Set(customers.map((customer: any) => customer.id));
    const allApplications = await (this.prisma as any).visaRecord.findMany({});
    const applications = allApplications.filter((application: any) =>
      customerIds.has(application.customerId),
    );
    const kanban = applications.reduce(
      (groups: Record<string, any[]>, application: any) => {
        const status = application.status || 'DRAFT';
        (groups[status] ||= []).push(application);
        return groups;
      },
      {},
    );

    return {
      stats: {
        total: applications.length,
        pending: applications.filter(
          (application: any) =>
            !['APPROVED', 'REJECTED', 'CANCELLED'].includes(application.status),
        ).length,
      },
      kanban,
    };
  }

  async updateStatus(
    companyId: string,
    id: string,
    status: string,
    actorId: string,
    notes?: string,
  ) {
    const application = await (this.prisma as any).visaRecord.findUnique({
      where: { id },
    });
    const customer = application
      ? await (this.prisma as any).customer.findUnique({
          where: { id: application.customerId },
        })
      : null;
    if (!application || !customer || customer.companyId !== companyId) {
      throw new NotFoundException('Visa application not found');
    }

    const updated = await (this.prisma as any).visaRecord.update({
      where: { id },
      data: { status },
    });
    await this.workflow.trigger('visa.status_updated', {
      id,
      status,
      actorId,
      notes,
    });
    return updated;
  }
}
