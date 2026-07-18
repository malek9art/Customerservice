import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FlightProviderRegistry } from './providers/flight-provider.registry';
import { FlightSearchCriteria } from './interfaces/flight-provider.interface';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { BreService } from '../bre/bre.service';
import { WorkflowService } from '../workflows/workflows.service';
import { nanoid } from 'nanoid';

@Injectable()
export class FlightBookingService {
  private readonly logger = new Logger(FlightBookingService.name);

  constructor(
    private prisma: PrismaService,
    private registry: FlightProviderRegistry,
    private ai: AiOrchestrator,
    private bre: BreService,
    private workflow: WorkflowService,
  ) {}

  async searchFlights(companyId: string, criteria: FlightSearchCriteria) {
    this.logger.log(`Searching flights for company ${companyId}`);

    // Aggregated search from all registered providers
    const providers = this.registry.getAllProviders();
    const searchPromises = providers.map((p) =>
      p.search(criteria).catch((e) => {
        this.logger.error(`Provider ${p.name} search failed`, e);
        return [];
      }),
    );

    const results = await Promise.all(searchPromises);
    const flattenedResults = results.flat();

    // AI Enrichment: Best flight recommendation
    const aiRecommendation = await this.ai.process(
      `Recommend the best flight from these results: ${JSON.stringify(flattenedResults.slice(0, 5))}`,
      { companyId, task: 'FLIGHT_RECOMMENDATION' },
    );

    return {
      offers: flattenedResults,
      aiInsights: aiRecommendation.response,
    };
  }

  async createBooking(
    companyId: string,
    customerId: string,
    providerName: string,
    offerId: string,
    passengers: any[],
  ) {
    const provider = this.registry.getProvider(providerName);
    const gdsBooking = await provider.createBooking(offerId, passengers);

    const internalRef = `FLIGHT-${nanoid(10).toUpperCase()}`;

    const booking = await (this.prisma as any).flightBooking.create({
      data: {
        companyId,
        customerId,
        referenceNumber: internalRef,
        pnr: gdsBooking.pnr,
        status: 'PNR_CREATED',
        provider: providerName,
        totalAmount: gdsBooking.price.total,
        currency: gdsBooking.price.currency,
        passengers,
        segments: gdsBooking.itineraries,
        fareDetails: gdsBooking.price,
      },
    });

    await this.workflow.trigger('flight.booking_created', {
      bookingId: booking.id,
      pnr: booking.pnr,
    });

    return booking;
  }

  async getDashboard(companyId: string) {
    // Aggregated stats for Flight Operations Dashboard
    return {
      activeBookings: 0,
      totalRevenue: 0,
      pendingTicketing: 0,
      recentPNRs: [],
    };
  }
}
