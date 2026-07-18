import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { WorkflowService } from '../workflows/workflows.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PassportProcessingService {
  private readonly logger = new Logger(PassportProcessingService.name);

  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
    private audit: AuditService,
  ) {}

  async receivePassport(companyId: string, data: any) {
    const passport = await (this.prisma as any).passportInventory.create({
      data: {
        ...data,
        companyId,
        status: 'RECEIVED_BY_AGENCY',
      },
    });

    await this.logStatusChange(
      passport.id,
      null,
      'RECEIVED_BY_AGENCY',
      data.receivedById,
      'Passport received from customer',
    );
    await this.workflow.trigger('passport.received', {
      passportId: passport.id,
    });

    return passport;
  }

  async updateLocation(
    passportId: string,
    location: string,
    status: any,
    actorId: string,
    notes?: string,
  ) {
    const passport = await (this.prisma as any).passportInventory.findUnique({
      where: { id: passportId },
    });
    if (!passport)
      throw new NotFoundException('Passport not found in inventory');

    const updated = await (this.prisma as any).passportInventory.update({
      where: { id: passportId },
      data: { location, status },
    });

    await this.logStatusChange(
      passportId,
      passport.status,
      status,
      actorId,
      notes,
      location,
    );

    return updated;
  }

  private async logStatusChange(
    passportId: string,
    fromStatus: any,
    toStatus: any,
    actorId: string,
    notes?: string,
    location?: string,
  ) {
    await (this.prisma as any).passportLog.create({
      data: {
        passportId,
        fromStatus,
        toStatus,
        actorId,
        notes,
        location,
      },
    });
  }

  async getInventory(companyId: string) {
    return (this.prisma as any).passportInventory.findMany({
      where: { companyId },
      include: { customer: true },
    });
  }
}
