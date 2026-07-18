import { Test, TestingModule } from '@nestjs/testing';
import { FlightBookingService } from './flight-booking.service';
import { FlightProviderRegistry } from './providers/flight-provider.registry';
import { AmadeusProvider } from './providers/amadeus.provider';
import { FareRulesEvaluatorService } from './fare-rules-evaluator.service';
import { PrismaService } from '../../prisma.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { AiToolRegistry } from '../ai/tools/ai-tool-registry.service';
import { AiMemoryService } from '../ai/memory/ai-memory.service';
import { BreService } from '../bre/bre.service';
import { WorkflowService } from '../workflows/workflows.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('FlightBookingService (Hardened GDS & Flight Ops)', () => {
  let service: FlightBookingService;
  let registry: FlightProviderRegistry;
  let amadeus: AmadeusProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightBookingService,
        FlightProviderRegistry,
        AmadeusProvider,
        FareRulesEvaluatorService,
        PrismaService,
        AiOrchestrator,
        AiToolRegistry,
        AiMemoryService,
        BreService,
        WorkflowService,
        ConfigService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<FlightBookingService>(FlightBookingService);
    registry = module.get<FlightProviderRegistry>(FlightProviderRegistry);
    amadeus = module.get<AmadeusProvider>(AmadeusProvider);

    registry.register(amadeus);
  });

  it('should search flights using Amadeus live adapter', async () => {
    const results = await service.searchFlights('comp-id', {
      origin: 'JED',
      destination: 'DXB',
      departureDate: '2026-09-10',
      passengers: { adults: 1, children: 0, infants: 0 },
      cabinClass: 'ECONOMY',
    });

    expect(results.offers).toBeDefined();
    expect(results.offers.length).toBeGreaterThan(0);
    expect(results.offers[0].provider).toBe('AMADEUS');
  });

  it('should evaluate fare rules via BRE and Return Baggage / Cancellation Policies', async () => {
    const evaluation = await service.evaluateFareRules('comp-id', {
      airlineCode: 'SV',
      cabinClass: 'BUSINESS',
      basePrice: 1200,
      departureDate: '2026-10-01',
    });

    expect(evaluation.airlineCode).toBe('SV');
    expect(evaluation.cabinClass).toBe('BUSINESS');
    expect(evaluation.baggageAllowance.pieces).toBe(2);
    expect(evaluation.cancellationPolicy.isRefundable).toBe(true);
    expect(evaluation.pricingBreakdown.finalPrice).toBeGreaterThan(1200);
  });

  it('should create booking, generate live PNR, and issue e-ticket', async () => {
    const booking = await service.createBooking(
      'comp-id',
      'cust-1',
      'AMADEUS',
      'amadeus-offer-1',
      [{ firstName: 'MALEK', lastName: 'AHMED' }],
    );

    expect(booking).toBeDefined();
    expect(booking.pnr).toBeDefined();
    expect(booking.status).toBe('PNR_CREATED');

    const ticketedBooking = await service.issueTicket('comp-id', booking.id);
    expect(ticketedBooking.status).toBe('TICKETED');
    expect(ticketedBooking.ticketNumbers.length).toBeGreaterThan(0);
  });
});
