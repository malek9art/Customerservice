import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AiAgentService } from './modules/ai/ai-agent.service';
import { PilgrimageService } from './modules/pilgrimage/pilgrimage.service';
import { FlightBookingService } from './modules/flight/flight-booking.service';
import { AutoReconciliationService } from './modules/accounting/auto-reconciliation.service';
import { AccountingPostingEngine } from './modules/accounting/engine/accounting-posting-engine.service';
import { VisaService } from './modules/visa/visa.service';
import { DocumentIntelligenceService } from './modules/ocr/document-intelligence.service';
import { PrismaService } from './prisma.service';

describe('TravelOS AI V0.96 - Commercial End-to-End Execution Scenario', () => {
  let app: INestApplication;
  let aiAgentService: AiAgentService;
  let pilgrimageService: PilgrimageService;
  let flightService: FlightBookingService;
  let autoReconciliationService: AutoReconciliationService;
  let postingEngine: AccountingPostingEngine;
  let visaService: VisaService;
  let docIntelligenceService: DocumentIntelligenceService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    aiAgentService = moduleFixture.get<AiAgentService>(AiAgentService);
    pilgrimageService = moduleFixture.get<PilgrimageService>(PilgrimageService);
    flightService = moduleFixture.get<FlightBookingService>(FlightBookingService);
    autoReconciliationService = moduleFixture.get<AutoReconciliationService>(AutoReconciliationService);
    postingEngine = moduleFixture.get<AccountingPostingEngine>(AccountingPostingEngine);
    visaService = moduleFixture.get<VisaService>(VisaService);
    docIntelligenceService = moduleFixture.get<DocumentIntelligenceService>(DocumentIntelligenceService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Executes 100% Commercial Scenario: WhatsApp Query -> Multi-Agent Execution -> Package Booking -> Room & Bus Allocation -> Financial Ledger Posting & Auto-Reconciliation -> Pilgrim Card PDF', async () => {
    const companyId = 'comp-id';
    const phone = '+966501234567';

    // Step 1: Seed baseline package & customer
    const pkg = await (prisma as any).package.create({
      data: {
        companyId,
        name: 'Ramadan Deluxe Hajj & Umrah 1447H',
        type: 'UMRAH',
        season: '1447H',
        capacity: 30,
        remainingSlots: 30,
        basePrice: 3200,
      },
    });

    await (prisma as any).customer.create({
      data: {
        id: 'cust-1',
        companyId,
        fullName: 'John Doe',
        phone,
      },
    });

    // Step 2: Incoming WhatsApp message processed by AI Agent Service
    const aiResult = await aiAgentService.handleIncomingMessage(companyId, {
      from: phone,
      text: 'I want to book Ramadan Umrah package for 2 pilgrims with flight from JED to DXB',
      type: 'TEXT',
    });

    expect(aiResult).toBeDefined();
    expect(aiResult.confidence).toBeGreaterThan(0.9);

    // Step 3: Pilgrimage Booking & Real-time Capacity Sync
    const bookingRes = await pilgrimageService.createPilgrimageBooking(
      companyId,
      'cust-1',
      pkg.id,
      [
        { fullName: 'Ahmed Ali', passportNumber: 'N1234567', gender: 'MALE' },
        { fullName: 'Sara Ali', passportNumber: 'N7654321', gender: 'FEMALE' },
      ],
    );

    expect(bookingRes.booking).toBeDefined();
    expect(bookingRes.pilgrims).toHaveLength(2);

    // Verify remaining slots synced
    const updatedPkg = await (prisma as any).package.findUnique({ where: { id: pkg.id } });
    expect(updatedPkg.remainingSlots).toBe(28);

    // Step 4: Room Allocation & Bus Allocation Algorithms
    const roomRes = await pilgrimageService.allocateRooms(companyId, pkg.id, {
      maxRoomCapacity: 2,
      groupFamilies: true,
    });
    expect(roomRes.summary.totalRooms).toBeGreaterThan(0);

    const busRes = await pilgrimageService.allocateBuses(companyId, pkg.id, {
      busCapacity: 45,
    });
    expect(busRes.summary.totalBuses).toBeGreaterThan(0);

    // Step 5: Document Vaulting & Intelligence OCR Processing
    const docRecord = await docIntelligenceService.processAndVault(
      companyId,
      Buffer.from('mock-passport-binary-data'),
      'passport-ahmed.pdf',
      'application/pdf',
      { customerId: 'cust-1', type: 'PASSPORT', tags: ['mrz', 'verified'] },
    );

    expect(docRecord.id).toBeDefined();
    expect(docRecord.ocrData).toBeDefined();

    // Step 6: Visa Application Submission
    const visaApp = await visaService.createApplication(companyId, {
      customerId: 'cust-1',
      country: 'SA',
      visaType: 'UMRAH',
    });
    expect(visaApp.referenceNumber).toContain('VISA-');

    // Step 7: Flight Search & Amadeus Provider e-Ticketing
    const flightOffers = await flightService.searchFlights(companyId, {
      origin: 'JED',
      destination: 'DXB',
      departureDate: '2026-09-15',
      passengers: { adults: 2, children: 0, infants: 0 },
      cabinClass: 'ECONOMY',
    });

    expect(flightOffers.offers.length).toBeGreaterThan(0);

    const fareRules = await flightService.evaluateFareRules(companyId, {
      airlineCode: 'SV',
      cabinClass: 'ECONOMY',
      basePrice: 650,
      departureDate: '2026-09-15',
    });
    expect(fareRules.baggageAllowance).toBeDefined();

    const flightBooking = await flightService.createBooking(
      companyId,
      'cust-1',
      'AMADEUS',
      flightOffers.offers[0].id,
      [{ firstName: 'Ahmed', lastName: 'Ali' }],
    );

    const ticketedFlight = await flightService.issueTicket(companyId, flightBooking.id);
    expect(ticketedFlight.status).toBe('TICKETED');

    // Step 8: Financial Ledger Posting Engine & Double-Entry Verification
    const journal = await postingEngine.postEvent(companyId, 'PILGRIMAGE_BOOKING', {
      id: bookingRes.booking.id,
      amount: 6400,
      description: 'Ramadan Umrah Package Settlement',
    });

    expect(journal).toBeDefined();

    // Step 9: Bank Transfer Statement Processing & Auto-Reconciliation
    const invoice = await (prisma as any).invoice.create({
      data: {
        companyId,
        number: 'INV-UMRAH-2026',
        amount: 6400,
        customerId: 'cust-1',
      },
    });

    const reconRes = await autoReconciliationService.processBankStatement(companyId, {
      bankName: 'Al Rajhi Bank',
      accountNumber: 'SA99112233',
      transactions: [
        {
          bankReference: 'BANK-TRX-8899',
          senderName: 'JOHN DOE',
          amount: 6400,
          transactionDate: '2026-07-18',
          paymentReference: 'INV-UMRAH-2026',
        },
      ],
    });

    expect(reconRes.summary.autoMatchedCount).toBe(1);
    expect(reconRes.results[0].status).toBe('AUTOMATED_MATCH');

    // Step 10: Official Pilgrim Digital Card PDF Generation
    const cardRes = await pilgrimageService.generatePilgrimCard(
      companyId,
      bookingRes.pilgrims[0].id,
    );

    expect(cardRes.cardUrl).toContain('storage.travelos.ai');
    expect(cardRes.documentId).toBeDefined();
  });
});
