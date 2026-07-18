import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';
import { nanoid } from 'nanoid';

export class BankTransactionItem {
  id?: string;
  bankReference!: string;
  senderName!: string;
  senderIban?: string;
  amount!: number;
  currency?: string;
  transactionDate!: string;
  paymentReference?: string;
  notes?: string;
}

export class BankStatementPayload {
  statementId?: string;
  bankName!: string;
  accountNumber!: string;
  transactions!: BankTransactionItem[];
}

export interface MatchingCandidate {
  targetType: 'INVOICE' | 'PILGRIMAGE_BOOKING' | 'FLIGHT_BOOKING' | 'HOTEL_BOOKING';
  targetId: string;
  referenceNumber: string;
  amount: number;
  confidenceScore: number;
  matchReason: string;
}

export interface ReconciliationResult {
  bankReference: string;
  amount: number;
  senderName: string;
  status: 'AUTOMATED_MATCH' | 'NEEDS_REVIEW' | 'UNMATCHED';
  confidenceScore: number;
  matchedTarget?: MatchingCandidate;
  candidates?: MatchingCandidate[];
  paymentId?: string;
  journalId?: string;
}

@Injectable()
export class AutoReconciliationService {
  private readonly logger = new Logger(AutoReconciliationService.name);

  constructor(
    private prisma: PrismaService,
    private postingEngine: AccountingPostingEngine,
  ) {}

  async processBankStatement(
    companyId: string,
    payload: BankStatementPayload,
  ): Promise<{
    summary: {
      totalProcessed: number;
      autoMatchedCount: number;
      needsReviewCount: number;
      unmatchedCount: number;
      totalAmount: number;
    };
    results: ReconciliationResult[];
  }> {
    this.logger.log(
      `Processing bank statement for company ${companyId} with ${(payload.transactions || []).length} items`,
    );

    const invoices = await (this.prisma as any).invoice.findMany({
      where: { companyId },
    });

    const pilgrimageBookings = await (this.prisma as any).pilgrimageBooking.findMany({
      where: { companyId },
    });

    const flightBookings = await (this.prisma as any).flightBooking.findMany({
      where: { companyId },
    });

    const customers = await (this.prisma as any).customer.findMany({
      where: { companyId },
    });

    const results: ReconciliationResult[] = [];

    for (const tx of payload.transactions || []) {
      const candidates: MatchingCandidate[] = [];

      // 1. Check exact payment reference against Invoice numbers
      for (const inv of invoices) {
        const invAmount = Number(inv.amount) || 0;
        if (tx.paymentReference && inv.number && tx.paymentReference.trim().toUpperCase() === inv.number.trim().toUpperCase()) {
          candidates.push({
            targetType: 'INVOICE',
            targetId: inv.id,
            referenceNumber: inv.number,
            amount: invAmount,
            confidenceScore: 1.0,
            matchReason: 'Exact Invoice Reference Match',
          });
        } else if (Math.abs(invAmount - tx.amount) < 0.01) {
          // Fuzzy check by customer name
          const cust = customers.find((c) => c.id === inv.customerId);
          let score = 0.65;
          let reason = 'Exact Amount Match';

          if (cust && tx.senderName) {
            const cleanSender = tx.senderName.toLowerCase();
            const cleanCust = cust.fullName.toLowerCase();
            if (cleanSender.includes(cleanCust) || cleanCust.includes(cleanSender)) {
              score = 0.85;
              reason = 'Amount + Customer Name Match';
            }
          }
          candidates.push({
            targetType: 'INVOICE',
            targetId: inv.id,
            referenceNumber: inv.number || inv.id,
            amount: invAmount,
            confidenceScore: score,
            matchReason: reason,
          });
        }
      }

      // 2. Check against Flight Bookings
      for (const fb of flightBookings) {
        const fbAmount = Number(fb.totalAmount) || 0;
        if (
          tx.paymentReference &&
          (fb.pnr === tx.paymentReference || fb.referenceNumber === tx.paymentReference)
        ) {
          candidates.push({
            targetType: 'FLIGHT_BOOKING',
            targetId: fb.id,
            referenceNumber: fb.referenceNumber || fb.pnr,
            amount: fbAmount,
            confidenceScore: 1.0,
            matchReason: 'Exact Flight Reference/PNR Match',
          });
        }
      }

      // Sort candidates by confidence score
      candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

      const topMatch = candidates[0];

      if (topMatch && topMatch.confidenceScore >= 0.80) {
        // High confidence match -> Execute automated reconciliation
        const payment = await (this.prisma as any).payment.create({
          data: {
            companyId,
            invoiceId: topMatch.targetType === 'INVOICE' ? topMatch.targetId : null,
            amount: tx.amount,
            method: 'BANK_TRANSFER',
            gateway: payload.bankName,
            transactionId: tx.bankReference,
            status: 'COMPLETED',
          },
        });

        // Update Invoice status if applicable
        if (topMatch.targetType === 'INVOICE') {
          await (this.prisma as any).invoice.update({
            where: { id: topMatch.targetId },
            data: { status: 'PAID' },
          });
        }

        // Automatically Post Journal Entry
        const journal = await this.postingEngine.postEvent(
          companyId,
          'BANK_RECONCILIATION',
          {
            id: payment.id,
            amount: tx.amount,
            bankReference: tx.bankReference,
            referenceNumber: topMatch.referenceNumber,
            description: `Auto-reconciled bank transfer ${tx.bankReference} against ${topMatch.referenceNumber}`,
          },
        );

        results.push({
          bankReference: tx.bankReference,
          amount: tx.amount,
          senderName: tx.senderName,
          status: 'AUTOMATED_MATCH',
          confidenceScore: topMatch.confidenceScore,
          matchedTarget: topMatch,
          paymentId: payment.id,
          journalId: journal?.id,
        });
      } else if (topMatch && topMatch.confidenceScore >= 0.50) {
        results.push({
          bankReference: tx.bankReference,
          amount: tx.amount,
          senderName: tx.senderName,
          status: 'NEEDS_REVIEW',
          confidenceScore: topMatch.confidenceScore,
          candidates,
        });
      } else {
        // Unmatched -> Post to Unreconciled Bank Suspense account
        const journal = await this.postingEngine.postEvent(
          companyId,
          'UNMATCHED_BANK_DEPOSIT',
          {
            id: `suspense-${nanoid(8)}`,
            amount: tx.amount,
            bankReference: tx.bankReference,
            description: `Unmatched bank deposit ${tx.bankReference} from ${tx.senderName}`,
          },
        );

        results.push({
          bankReference: tx.bankReference,
          amount: tx.amount,
          senderName: tx.senderName,
          status: 'UNMATCHED',
          confidenceScore: 0,
          journalId: journal?.id,
        });
      }
    }

    const autoMatchedCount = results.filter((r) => r.status === 'AUTOMATED_MATCH').length;
    const needsReviewCount = results.filter((r) => r.status === 'NEEDS_REVIEW').length;
    const unmatchedCount = results.filter((r) => r.status === 'UNMATCHED').length;
    const totalAmount = results.reduce((sum, r) => sum + r.amount, 0);

    return {
      summary: {
        totalProcessed: results.length,
        autoMatchedCount,
        needsReviewCount,
        unmatchedCount,
        totalAmount,
      },
      results,
    };
  }

  async confirmManualMatch(
    companyId: string,
    bankReference: string,
    targetType: string,
    targetId: string,
    amount: number,
  ) {
    const payment = await (this.prisma as any).payment.create({
      data: {
        companyId,
        invoiceId: targetType === 'INVOICE' ? targetId : null,
        amount,
        method: 'BANK_TRANSFER',
        transactionId: bankReference,
        status: 'COMPLETED',
      },
    });

    if (targetType === 'INVOICE') {
      await (this.prisma as any).invoice.update({
        where: { id: targetId },
        data: { status: 'PAID' },
      });
    }

    const journal = await this.postingEngine.postEvent(
      companyId,
      'BANK_RECONCILIATION',
      {
        id: payment.id,
        amount,
        bankReference,
        description: `Manual confirmed bank transfer ${bankReference} match for ${targetType} ${targetId}`,
      },
    );

    return {
      success: true,
      bankReference,
      paymentId: payment.id,
      journalId: journal?.id,
      status: 'AUTOMATED_MATCH',
    };
  }
}
