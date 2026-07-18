import { Injectable } from '@nestjs/common';
import * as jsonLogic from 'json-logic-js';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class BreService {
  constructor(private prisma: PrismaService) {}

  async evaluate(companyId: string, ruleType: string, data: any) {
    const rules = await this.prisma.businessRule.findMany({
      where: { companyId, ruleType, isActive: true },
      orderBy: { priority: 'desc' },
    });

    for (const rule of rules) {
      const r = rule as any;
      if (jsonLogic.apply(r.conditions, data)) {
        return r.outcomes;
      }
    }
    return null;
  }
}
