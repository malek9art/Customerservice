import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: {
    companyId: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
  }) {
    this.logger.log(
      `${data.action} ${data.entityType}:${data.entityId} company:${data.companyId}`,
    );
  }
}
