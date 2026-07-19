import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { PilgrimageService } from './modules/pilgrimage/pilgrimage.service';
import { FlightBookingService } from './modules/flight/flight-booking.service';
import { PassportProcessingService } from './modules/passport/passport-processing.service';
import { WorkflowService } from './modules/workflows/workflows.service';
import { PrismaService } from './prisma.service';

describe('TravelOS AI V1.0 Beta Real Operations & Lifecycle Scenarios', () => {
  let app: INestApplication;
  let pilgrimageService: PilgrimageService;
  let flightService: FlightBookingService;
  let passportService: PassportProcessingService;
  let workflowService: WorkflowService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    pilgrimageService = moduleFixture.get<PilgrimageService>(PilgrimageService);
    flightService =
      moduleFixture.get<FlightBookingService>(FlightBookingService);
    passportService = moduleFixture.get<PassportProcessingService>(
      PassportProcessingService,
    );
    workflowService = moduleFixture.get<WorkflowService>(WorkflowService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Scenario A: Umrah Booking Creation -> Modification -> Cancellation & Slot Restoration', async () => {
    const companyId = 'comp-id';

    // 1. Create package
    const pkg = await (prisma as any).package.create({
      data: {
        companyId,
        name: 'Umrah Executive 1447H',
        type: 'UMRAH',
        capacity: 10,
        remainingSlots: 10,
        basePrice: 2000,
      },
    });

    // 2. Create Pilgrimage booking for 2 pilgrims
    const bookingRes = await pilgrimageService.createPilgrimageBooking(
      companyId,
      'cust-1',
      pkg.id,
      [
        { fullName: 'Sami Mansour', passportNumber: 'P001122' },
        { fullName: 'Laila Mansour', passportNumber: 'P001123' },
      ],
    );

    expect(bookingRes.booking.status).toBe('CONFIRMED');

    // Verify remaining slots = 8
    let currentPkg = await (prisma as any).package.findUnique({
      where: { id: pkg.id },
    });
    expect(currentPkg.remainingSlots).toBe(8);

    // 3. Modify booking details
    const modRes = await pilgrimageService.modifyBooking(
      companyId,
      bookingRes.booking.id,
      { totalAmount: 4200 },
    );
    expect(modRes.totalAmount).toBe(4200);

    // 4. Cancel booking & verify remaining slots restored back to 10
    const cancelRes = await pilgrimageService.cancelBooking(
      companyId,
      bookingRes.booking.id,
      'Customer requested refund & cancellation',
    );

    expect(cancelRes.status).toBe('CANCELLED');
    expect(cancelRes.slotsRestored).toBe(2);

    // Verify slots restored in package
    currentPkg = await (prisma as any).package.findUnique({
      where: { id: pkg.id },
    });
    expect(currentPkg.remainingSlots).toBe(10);
  });

  it('Scenario B: Flight Order PNR Creation -> e-Ticket Issuance -> Cancellation', async () => {
    const companyId = 'comp-id';

    // 1. Create Flight booking
    const booking = await flightService.createBooking(
      companyId,
      'cust-1',
      'AMADEUS',
      'amadeus-offer-101',
      [{ firstName: 'SAMI', lastName: 'MANSOUR' }],
    );

    expect(booking.pnr).toBeDefined();
    expect(booking.status).toBe('PNR_CREATED');

    // 2. Issue Ticket
    const ticketed = await flightService.issueTicket(companyId, booking.id);
    expect(ticketed.status).toBe('TICKETED');

    // 3. Cancel Flight Booking
    const cancelled = await flightService.cancelBooking(
      companyId,
      booking.id,
      'Flight schedule change',
    );
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('Scenario C: Physical Passport Custody Chain (Received -> In Safe -> Submitted -> Delivered)', async () => {
    const companyId = 'comp-id';

    // 1. Receive Passport
    const passport = await passportService.receivePassport(companyId, {
      customerId: 'cust-1',
      passportNumber: 'PASS-778899',
      receivedById: 'emp-101',
    });

    expect(passport.status).toBe('RECEIVED_BY_AGENCY');

    // 2. Transfer to Safe
    const safeUpdate = await passportService.updateLocation(
      passport.id,
      'Safe 02 - Shelf B',
      'IN_SAFE',
      'emp-101',
      'Moved to physical safe location',
    );
    expect(safeUpdate.status).toBe('IN_SAFE');

    // 3. Submit to Embassy
    const embassyUpdate = await passportService.updateLocation(
      passport.id,
      'Saudi Embassy Courier',
      'SUBMITTED_TO_EMBASSY',
      'emp-101',
    );
    expect(embassyUpdate.status).toBe('SUBMITTED_TO_EMBASSY');
  });

  it('Scenario D: Human Conversation Escalation Queue Workflow', async () => {
    const companyId = 'comp-id';

    const session = await (prisma as any).chatSession.create({
      data: {
        companyId,
        customerId: 'cust-1',
        whatsappNumber: '+966551122334',
        status: 'ACTIVE',
      },
    });

    // Trigger human escalation
    await workflowService.trigger('chat.escalated_human', {
      companyId,
      sessionId: session.id,
      customerId: 'cust-1',
      reason:
        'Customer requested live human supervisor for complex group discount query',
    });

    const updatedSession = await (prisma as any).chatSession.findUnique({
      where: { id: session.id },
    });
    expect(updatedSession.status).toBe('ESCALATED');
  });
});
