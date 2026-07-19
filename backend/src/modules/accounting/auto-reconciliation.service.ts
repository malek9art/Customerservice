import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
  targetType:
    'INVOICE' | 'PILGRIMAGE_BOOKING' | 'FLIGHT_BOOKING' | 'HOTEL_BOOKING';
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
    const transactions = payload?.transactions || [];
    this.logger.log(
      `Processing bank statement for company ${companyId} with ${transactions.length} items`,
    );

    const invoices = await (this.prisma as any).invoice.findMany({
      where: { companyId },
    });

    const flightBookings = await (this.prisma as any).flightBooking.findMany({
      where: { companyId },
    });

    const customers = await (this.prisma as any).customer.findMany({
      where: { companyId },
    });

    const results: ReconciliationResult[] = [];

    for (const tx of transactions) {
      const txAmount = Number(tx.amount) || 0;
      if (txAmount <= 0) {
        this.logger.warn(
          `Skipping invalid bank transaction amount: ${tx.amount}`,
        );
        continue;
      }

      const candidates: MatchingCandidate[] = [];
      const cleanPaymentRef = String(tx.paymentReference || '')
        .trim()
        .toUpperCase();

      // 1. Check exact payment reference against Invoice numbers (case/space insensitive)
      for (const inv of invoices) {
        const invAmount = Number(inv.amount) || 0;
        const cleanInvNum = String(inv.number || '')
          .trim()
          .toUpperCase();

        if (cleanPaymentRef && cleanInvNum && cleanPaymentRef === cleanInvNum) {
          candidates.push({
            targetType: 'INVOICE',
            targetId: inv.id,
            referenceNumber: inv.number,
            amount: invAmount,
            confidenceScore: 1.0,
            matchReason: 'Exact Invoice Reference Match',
          });
        } else if (Math.abs(invAmount - txAmount) < 0.01) {
          const cust = customers.find((c) => c.id === inv.customerId);
          let score = 0.65;
          let reason = 'Exact Amount Match';

          if (cust && tx.senderName) {
            const cleanSender = String(tx.senderName).toLowerCase().trim();
            const cleanCust = String(cust.fullName).toLowerCase().trim();
            if (
              cleanSender.includes(cleanCust) ||
              cleanCust.includes(cleanSender)
            ) {
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
        const cleanPnr = String(fb.pnr || '')
          .trim()
          .toUpperCase();
        const cleanFbRef = String(fb.referenceNumber || '')
          .trim()
          .toUpperCase();

        if (
          cleanPaymentRef &&
          (cleanPnr === cleanPaymentRef || cleanFbRef === cleanPaymentRef)
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

      candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
      const topMatch = candidates[0];

      if (topMatch && topMatch.confidenceScore >= 0.8) {
        const invoicePayment =
          topMatch.targetType === 'INVOICE'
            ? await this.prepareInvoicePayment(
                companyId,
                topMatch.targetId,
                txAmount,
              )
            : null;
        const payment = await (this.prisma as any).payment.create({
          data: {
            companyId,
            invoiceId:
              topMatch.targetType === 'INVOICE' ? topMatch.targetId : null,
            customerId: invoicePayment?.customerId,
            amount: txAmount,
            method: 'BANK_TRANSFER',
            gateway: payload.bankName || 'BANK',
            transactionId: tx.bankReference,
            status: 'COMPLETED',
          },
        });

        if (invoicePayment) {
          await (this.prisma as any).invoice.update({
            where: { id: topMatch.targetId },
            data: invoicePayment.update,
          });
        }

        const journal = await this.postingEngine.postEvent(
          companyId,
          'BANK_RECONCILIATION',
          {
            id: payment.id,
            amount: txAmount,
            bankReference: tx.bankReference,
            referenceNumber: topMatch.referenceNumber,
            description: `Auto-reconciled bank transfer ${tx.bankReference} against ${topMatch.referenceNumber}`,
          },
        );

        results.push({
          bankReference: tx.bankReference,
          amount: txAmount,
          senderName: tx.senderName,
          status: 'AUTOMATED_MATCH',
          confidenceScore: topMatch.confidenceScore,
          matchedTarget: topMatch,
          paymentId: payment.id,
          journalId: journal?.id,
        });
      } else if (topMatch && topMatch.confidenceScore >= 0.5) {
        results.push({
          bankReference: tx.bankReference,
          amount: txAmount,
          senderName: tx.senderName,
          status: 'NEEDS_REVIEW',
          confidenceScore: topMatch.confidenceScore,
          candidates,
        });
      } else {
        const journal = await this.postingEngine.postEvent(
          companyId,
          'UNMATCHED_BANK_DEPOSIT',
          {
            id: `suspense-${nanoid(8)}`,
            amount: txAmount,
            bankReference: tx.bankReference,
            description: `Unmatched bank deposit ${tx.bankReference} from ${tx.senderName}`,
          },
        );

        results.push({
          bankReference: tx.bankReference,
          amount: txAmount,
          senderName: tx.senderName,
          status: 'UNMATCHED',
          confidenceScore: 0,
          journalId: journal?.id,
        });
      }
    }

    const autoMatchedCount = results.filter(
      (r) => r.status === 'AUTOMATED_MATCH',
    ).length;
    const needsReviewCount = results.filter(
      (r) => r.status === 'NEEDS_REVIEW',
    ).length;
    const unmatchedCount = results.filter(
      (r) => r.status === 'UNMATCHED',
    ).length;
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
    const invoicePayment =
      targetType === 'INVOICE'
        ? await this.prepareInvoicePayment(companyId, targetId, amount)
        : null;
    const payment = await (this.prisma as any).payment.create({
      data: {
        companyId,
        invoiceId: targetType === 'INVOICE' ? targetId : null,
        customerId: invoicePayment?.customerId,
        amount,
        method: 'BANK_TRANSFER',
        transactionId: bankReference,
        status: 'COMPLETED',
      },
    });

    if (invoicePayment) {
      await (this.prisma as any).invoice.update({
        where: { id: targetId },
        data: invoicePayment.update,
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

  private async prepareInvoicePayment(
    companyId: string,
    invoiceId: string,
    amount: number,
  ) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice || invoice.companyId !== companyId) {
      throw new NotFoundException('Invoice not found');
    }
    const paidAmount = Number(invoice.paidAmount || 0);
    const balance = Number(
      invoice.balance ?? Number(invoice.amount) - paidAmount,
    );
    if (amount > balance) {
      throw new BadRequestException('Payment cannot exceed invoice balance');
    }
    const nextPaidAmount = paidAmount + amount;
    const nextBalance = Number(invoice.amount) - nextPaidAmount;
    return {
      customerId: invoice.customerId,
      update: {
        paidAmount: nextPaidAmount,
        balance: nextBalance,
        status: nextBalance === 0 ? 'PAID' : 'PARTIAL',
      },
    };
  }
}
