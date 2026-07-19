import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AutoReconciliationService } from './modules/accounting/auto-reconciliation.service';
import { PilgrimageService } from './modules/pilgrimage/pilgrimage.service';
import { AccountingPostingEngine } from './modules/accounting/engine/accounting-posting-engine.service';
import { AiMemoryService } from './modules/ai/memory/ai-memory.service';
import { PrismaService } from './prisma.service';

describe('Pilot Program Production Hardening & Edge Case Regression Suite', () => {
  let app: INestApplication;
  let autoReconciliationService: AutoReconciliationService;
  let pilgrimageService: PilgrimageService;
  let postingEngine: AccountingPostingEngine;
  let memoryService: AiMemoryService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    autoReconciliationService = moduleFixture.get<AutoReconciliationService>(
      AutoReconciliationService,
    );
    pilgrimageService = moduleFixture.get<PilgrimageService>(PilgrimageService);
    postingEngine = moduleFixture.get<AccountingPostingEngine>(
      AccountingPostingEngine,
    );
    memoryService = moduleFixture.get<AiMemoryService>(AiMemoryService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Regression 1: Auto-Reconciliation ignores case/spaces in references and filters zero amounts', async () => {
    const companyId = 'comp-id';

    // Create Invoice with uppercase number
    const inv = await (prisma as any).invoice.create({
      data: {
        companyId,
        number: 'INV-2026-SPACED',
        amount: 3500,
        customerId: 'cust-1',
      },
    });

    // Send statement with trailing spaces and lower-case ref + zero amount item
    const recon = await autoReconciliationService.processBankStatement(
      companyId,
      {
        bankName: 'SNB Al Ahli',
        accountNumber: 'SA987654321',
        transactions: [
          {
            bankReference: 'TX-SPACED-11',
            senderName: 'MALEK AHMED',
            amount: 0, // Should be safely ignored
            transactionDate: '2026-07-18',
            paymentReference: ' inv-2026-spaced ',
          },
          {
            bankReference: 'TX-SPACED-22',
            senderName: 'MALEK AHMED',
            amount: 3500,
            transactionDate: '2026-07-18',
            paymentReference: ' inv-2026-spaced ', // Should match cleanly
          },
        ],
      },
    );

    expect(recon.summary.totalProcessed).toBe(1);
    expect(recon.results[0].status).toBe('AUTOMATED_MATCH');
    expect(recon.results[0].matchedTarget.targetId).toBe(inv.id);
  });

  it('Regression 2: Room Allocation handles single pilgrim in QUAD room with SINGLE assignment fallback', async () => {
    const companyId = 'comp-id';
    const pkgId = 'pkg-single-room-test';

    await (prisma as any).package.create({
      data: {
        id: pkgId,
        companyId,
        name: 'Single Room Test Package',
        type: 'UMRAH',
        capacity: 4,
        remainingSlots: 3,
        basePrice: 1000,
      },
    });
    await (prisma as any).pilgrim.create({
      data: {
        id: 'pilgrim-lonely-1',
        bookingId: 'b-single-1',
        packageId: pkgId,
        customerId: 'cust-1',
        gender: 'MALE',
      },
    });

    const roomAllocation = await pilgrimageService.allocateRooms(
      companyId,
      pkgId,
      {
        maxRoomCapacity: 4,
      },
    );

    expect(roomAllocation.summary.totalPilgrims).toBe(1);
    expect(roomAllocation.rooms).toHaveLength(1);
    expect(roomAllocation.rooms[0].roomType).toBe('SINGLE');
  });

  it('Regression 3: Double-Entry Posting Engine safely skips posting when amount <= 0', async () => {
    const journal = await postingEngine.postEvent('comp-id', 'FLIGHT_BOOKING', {
      id: 'zero-booking',
      amount: 0,
    });

    expect(journal).toBeNull();
  });

  it('Regression 4: Semantic Prompt Cache hits with case/whitespace normalization', async () => {
    const companyId = 'comp-id';
    const prompt1 = 'Search Umrah Ramadan Packages ';
    const prompt2 = 'search umrah ramadan packages';

    memoryService.setCachedResponse(prompt1, companyId, {
      data: 'ramadan-offers',
    });
    const cached = memoryService.getCachedResponse(prompt2, companyId);

    expect(cached).toBeDefined();
    expect(cached.data).toBe('ramadan-offers');
  });
});
