import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { BreService } from '../../bre/bre.service';
import { nanoid } from 'nanoid';

export interface AccountingRuleEntry {
  accountCode: string;
  type: 'DEBIT' | 'CREDIT';
}

@Injectable()
export class AccountingPostingEngine {
  private readonly logger = new Logger(AccountingPostingEngine.name);

  constructor(
    private prisma: PrismaService,
    private bre: BreService,
  ) {}

  private getDefaultPostingRules(eventType: string): {
    description: string;
    entries: AccountingRuleEntry[];
  } {
    switch (eventType) {
      case 'FLIGHT_BOOKING':
        return {
          description:
            'Flight Booking Created - Revenue & Receivable Recognition',
          entries: [
            { accountCode: '1200', type: 'DEBIT' }, // Accounts Receivable
            { accountCode: '4010', type: 'CREDIT' }, // Flight Revenue
          ],
        };
      case 'HOTEL_BOOKING':
        return {
          description:
            'Hotel Reservation Created - Revenue & Receivable Recognition',
          entries: [
            { accountCode: '1200', type: 'DEBIT' }, // Accounts Receivable
            { accountCode: '4020', type: 'CREDIT' }, // Hotel Revenue
          ],
        };
      case 'PILGRIMAGE_BOOKING':
        return {
          description: 'Hajj & Umrah Package Booking Created',
          entries: [
            { accountCode: '1200', type: 'DEBIT' }, // Accounts Receivable
            { accountCode: '4030', type: 'CREDIT' }, // Pilgrimage Revenue
          ],
        };
      case 'VISA_APPLICATION':
        return {
          description: 'Visa Application Processing Fee Recognition',
          entries: [
            { accountCode: '1200', type: 'DEBIT' }, // Accounts Receivable
            { accountCode: '4040', type: 'CREDIT' }, // Visa Revenue
          ],
        };
      case 'PAYMENT_RECEIVED':
        return {
          description: 'Customer Payment Received',
          entries: [
            { accountCode: '1010', type: 'DEBIT' }, // Cash and Bank
            { accountCode: '1200', type: 'CREDIT' }, // Accounts Receivable
          ],
        };
      case 'BANK_RECONCILIATION':
        return {
          description: 'Bank Transfer Auto-Reconciled Payment Settlement',
          entries: [
            { accountCode: '1010', type: 'DEBIT' }, // Cash and Bank
            { accountCode: '1200', type: 'CREDIT' }, // Accounts Receivable
          ],
        };
      case 'UNMATCHED_BANK_DEPOSIT':
        return {
          description: 'Unreconciled Bank Transfer Deposit to Suspense Account',
          entries: [
            { accountCode: '1010', type: 'DEBIT' }, // Cash and Bank
            { accountCode: '2090', type: 'CREDIT' }, // Unreconciled Bank Suspense
          ],
        };
      case 'REFUND_PROCESSED':
        return {
          description: 'Customer Refund Processed',
          entries: [
            { accountCode: '4090', type: 'DEBIT' }, // Revenue Adjustment / Refund
            { accountCode: '1010', type: 'CREDIT' }, // Cash and Bank
          ],
        };
      default:
        return {
          description: `Standard Journal Posting - ${eventType}`,
          entries: [
            { accountCode: '1010', type: 'DEBIT' },
            { accountCode: '1200', type: 'CREDIT' },
          ],
        };
    }
  }

  async postEvent(companyId: string, eventType: string, payload: any) {
    this.logger.log(
      `Processing Accounting Event: ${eventType} for Company: ${companyId}, Amount: ${payload.amount}`,
    );

    const amount = Number(payload.amount) || 0;
    if (amount <= 0) {
      this.logger.warn(`Skipping event ${eventType} - zero or missing amount`);
      return null;
    }

    // 1. Check dynamic rules from BRE
    let rules = await this.bre.evaluate(companyId, 'ACCOUNTING_POSTING_RULES', {
      eventType,
      ...payload,
    });

    if (!rules || !rules.entries) {
      rules = this.getDefaultPostingRules(eventType);
    }

    // 2. Create Journal Header
    const journalRef = `JRNL-${nanoid(10).toUpperCase()}`;

    const journal = await (this.prisma as any).journal.create({
      data: {
        companyId,
        referenceNumber: journalRef,
        description:
          payload.description ||
          rules.description ||
          `Auto-posted ${eventType}`,
        sourceType: eventType,
        sourceId: payload.id || payload.bookingId || payload.pnr,
      },
    });

    // 3. Post Journal Entries (Double Entry: Debit == Credit)
    for (const entry of rules.entries) {
      // Find or create account by code
      let account = await (this.prisma as any).account.findUnique({
        where: { companyId_code: { companyId, code: entry.accountCode } },
      });

      if (!account) {
        // Fall back to system default account
        account = await (this.prisma as any).account.create({
          data: {
            companyId,
            code: entry.accountCode,
            name: `Account ${entry.accountCode}`,
            type: entry.type === 'DEBIT' ? 'ASSET' : 'REVENUE',
            balance: 0,
          },
        });
      }

      await (this.prisma as any).journalEntry.create({
        data: {
          journalId: journal.id,
          accountId: account.id,
          debit: entry.type === 'DEBIT' ? amount : 0,
          credit: entry.type === 'CREDIT' ? amount : 0,
        },
      });

      // Update Account Balance
      await (this.prisma as any).account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: entry.type === 'DEBIT' ? amount : -amount,
          },
        },
      });
    }

    return journal;
  }
}
