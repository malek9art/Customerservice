import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { BreService } from '../../bre/bre.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AccountingPostingEngine {
  private readonly logger = new Logger(AccountingPostingEngine.name);

  constructor(
    private prisma: PrismaService,
    private bre: BreService,
  ) {}

  async postEvent(companyId: string, eventType: string, payload: any) {
    this.logger.log(
      `Processing Accounting Event: ${eventType} for Company: ${companyId}`,
    );

    // 1. Get posting rules from BRE
    const rules = await this.bre.evaluate(
      companyId,
      'ACCOUNTING_POSTING_RULES',
      { eventType, ...payload },
    );

    if (!rules || !rules.entries) {
      this.logger.warn(`No accounting rules found for event: ${eventType}`);
      return;
    }

    // 2. Create Journal and Entries in a single transaction
    const journalRef = `JRNL-${nanoid(10).toUpperCase()}`;

    // In a real implementation, we would use prisma.$transaction
    const journal = await (this.prisma as any).journal.create({
      data: {
        companyId,
        referenceNumber: journalRef,
        description: rules.description || `Auto-posted ${eventType}`,
        sourceType: eventType,
        sourceId: payload.id,
      },
    });

    for (const entry of rules.entries) {
      // Resolve account by code/name from BRE outcomes
      const account = await (this.prisma as any).account.findUnique({
        where: { companyId_code: { companyId, code: entry.accountCode } },
      });

      if (account) {
        await (this.prisma as any).journalEntry.create({
          data: {
            journalId: journal.id,
            accountId: account.id,
            debit: entry.type === 'DEBIT' ? payload.amount : 0,
            credit: entry.type === 'CREDIT' ? payload.amount : 0,
          },
        });

        // Update Account Balance
        await (this.prisma as any).account.update({
          where: { id: account.id },
          data: {
            balance: {
              increment:
                entry.type === 'DEBIT' ? payload.amount : -payload.amount,
            },
          },
        });
      }
    }

    return journal;
  }
}
