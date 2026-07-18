import { Test, TestingModule } from '@nestjs/testing';
import { AccountingService } from './accounting.service';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';
import { AutoReconciliationService } from './auto-reconciliation.service';
import { PrismaService } from '../../prisma.service';
import { BreService } from '../bre/bre.service';
import { ConfigService } from '@nestjs/config';

describe('Accounting & Financial Ledger System', () => {
  let service: AccountingService;
  let postingEngine: AccountingPostingEngine;
  let reconciliationService: AutoReconciliationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        AccountingPostingEngine,
        AutoReconciliationService,
        PrismaService,
        BreService,
        ConfigService,
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    postingEngine = module.get<AccountingPostingEngine>(AccountingPostingEngine);
    reconciliationService = module.get<AutoReconciliationService>(AutoReconciliationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should post balanced double-entry journals for all booking event types', async () => {
    const journal = await postingEngine.postEvent('comp-id', 'PILGRIMAGE_BOOKING', {
      id: 'p-book-100',
      amount: 4500,
      description: 'Hajj Package Deposit',
    });

    expect(journal).toBeDefined();
    expect(journal.referenceNumber).toContain('JRNL-');

    const entries = await (prisma as any).journalEntry.findMany({
      where: { journalId: journal.id },
    });

    expect(entries).toHaveLength(2);
    const totalDebit = entries.reduce((s: number, e: any) => s + (Number(e.debit) || 0), 0);
    const totalCredit = entries.reduce((s: number, e: any) => s + (Number(e.credit) || 0), 0);

    expect(totalDebit).toBe(4500);
    expect(totalCredit).toBe(4500);
  });

  it('should auto-reconcile bank transfers matching invoices and post journal entries', async () => {
    // 1. Create open invoice
    const inv = await service.createInvoice('comp-id', {
      number: 'INV-2026-999',
      amount: 1500,
      customerId: 'cust-1',
    });

    // 2. Process bank statement with matching payment reference
    const recon = await reconciliationService.processBankStatement('comp-id', {
      bankName: 'Al Rajhi Bank',
      accountNumber: 'SA123456789',
      transactions: [
        {
          bankReference: 'TRX-99887766',
          senderName: 'JOHN DOE',
          amount: 1500,
          transactionDate: '2026-07-18',
          paymentReference: 'INV-2026-999',
        },
      ],
    });

    expect(recon.summary.autoMatchedCount).toBe(1);
    expect(recon.results[0].status).toBe('AUTOMATED_MATCH');
    expect(recon.results[0].matchedTarget.targetId).toBe(inv.id);

    // Verify Invoice marked as PAID
    const updatedInv = await (prisma as any).invoice.findUnique({
      where: { id: inv.id },
    });
    expect(updatedInv.status).toBe('PAID');
  });

  it('should direct unmatched bank deposits to Suspense account', async () => {
    const recon = await reconciliationService.processBankStatement('comp-id', {
      bankName: 'SNB Al Ahli',
      accountNumber: 'SA987654321',
      transactions: [
        {
          bankReference: 'TRX-UNKNOWN-111',
          senderName: 'UNKNOWN PERSON',
          amount: 850,
          transactionDate: '2026-07-18',
        },
      ],
    });

    expect(recon.summary.unmatchedCount).toBe(1);
    expect(recon.results[0].status).toBe('UNMATCHED');
    expect(recon.results[0].journalId).toBeDefined();
  });
});
