import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditService {
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
    // This assumes the AuditLog model exists in prisma/schema.prisma
    // For now, using a safe check or console log if model not synced
    console.log('Audit Log:', data);
    // In a real slice, we'd have the AuditLog model in schema.
  }
}
