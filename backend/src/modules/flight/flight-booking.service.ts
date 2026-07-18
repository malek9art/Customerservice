import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FlightProviderRegistry } from './providers/flight-provider.registry';
import { FlightSearchCriteria } from './interfaces/flight-provider.interface';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { BreService } from '../bre/bre.service';
import { WorkflowService } from '../workflows/workflows.service';
import { FareRulesEvaluatorService, EvaluationRequest } from './fare-rules-evaluator.service';
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
    private fareEvaluator: FareRulesEvaluatorService,
  ) {}

  async searchFlights(companyId: string, criteria: FlightSearchCriteria) {
    this.logger.log(`Searching flights for company ${companyId}`);

    const providers = this.registry.getAllProviders();
    const searchPromises = providers.map((p) =>
      p.search(criteria).catch((e) => {
        this.logger.error(`Provider ${p.name} search failed`, e);
        return [];
      }),
    );

    const results = await Promise.all(searchPromises);
    const flattenedResults = results.flat();

    const aiRecommendation = await this.ai.process(
      `Recommend the best flight offer for criteria: ${JSON.stringify(criteria)} from results: ${JSON.stringify(flattenedResults.slice(0, 5))}`,
      { companyId, task: 'FLIGHT_RECOMMENDATION' },
    );

    return {
      offers: flattenedResults,
      aiInsights: aiRecommendation.response,
    };
  }

  async evaluateFareRules(companyId: string, req: EvaluationRequest) {
    return this.fareEvaluator.evaluateFareRules(companyId, req);
  }

  async createBooking(
    companyId: string,
    customerId: string,
    providerName: string,
    offerId: string,
    passengers: any[],
  ) {
    const provider = this.registry.getProvider(providerName || 'AMADEUS');
    const gdsBooking = await provider.createBooking(offerId, passengers);

    const internalRef = `FLIGHT-${nanoid(10).toUpperCase()}`;

    const booking = await (this.prisma as any).flightBooking.create({
      data: {
        companyId,
        customerId,
        referenceNumber: internalRef,
        pnr: gdsBooking.pnr,
        status: 'PNR_CREATED',
        provider: provider.name,
        totalAmount: gdsBooking.price.total,
        currency: gdsBooking.price.currency,
        passengers,
        segments: gdsBooking.itineraries,
        fareDetails: gdsBooking.price,
      },
    });

    await this.workflow.trigger('flight.booking_created', {
      bookingId: booking.id,
      companyId,
      customerId,
      pnr: booking.pnr,
      amount: Number(gdsBooking.price.total),
    });

    return booking;
  }

  async issueTicket(companyId: string, bookingId: string) {
    const booking = await (this.prisma as any).flightBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Flight booking ${bookingId} not found`);
    }

    const provider = this.registry.getProvider(booking.provider || 'AMADEUS');
    const ticketResult = await provider.issueTicket(booking.pnr);

    const updatedBooking = await (this.prisma as any).flightBooking.update({
      where: { id: bookingId },
      data: {
        status: 'TICKETED',
        ticketNumbers: ticketResult.ticketNumbers,
      },
    });

    await this.workflow.trigger('flight.ticket_issued', {
      bookingId: booking.id,
      companyId,
      pnr: booking.pnr,
      ticketNumbers: ticketResult.ticketNumbers,
    });

    return updatedBooking;
  }

  /**
   * Cancel Flight Order & PNR
   */
  async cancelBooking(companyId: string, bookingId: string, reason?: string) {
    const booking = await (this.prisma as any).flightBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Flight booking ${bookingId} not found`);
    }

    const provider = this.registry.getProvider(booking.provider || 'AMADEUS');
    await provider.cancelBooking(booking.pnr);

    await this.workflow.trigger('flight.booking_cancelled', {
      bookingId: booking.id,
      companyId,
      pnr: booking.pnr,
      customerId: booking.customerId,
      reason: reason || 'Flight cancellation requested',
    });

    return {
      success: true,
      bookingId: booking.id,
      pnr: booking.pnr,
      status: 'CANCELLED',
    };
  }

  async getDashboard(companyId: string) {
    const bookings = await (this.prisma as any).flightBooking.findMany({
      where: { companyId },
    });

    const activeBookings = bookings.length;
    const pendingTicketing = bookings.filter((b) => b.status === 'PNR_CREATED').length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (Number(b.totalAmount) || 0),
      0,
    );

    return {
      activeBookings,
      totalRevenue,
      pendingTicketing,
      recentPNRs: bookings.slice(-5).map((b) => ({
        pnr: b.pnr,
        referenceNumber: b.referenceNumber,
        status: b.status,
        totalAmount: b.totalAmount,
      })),
    };
  }
}
