import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { HotelProviderRegistry } from './providers/hotel-provider.registry';
import { HotelSearchCriteria } from './interfaces/hotel-provider.interface';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { WorkflowService } from '../workflows/workflows.service';
import { nanoid } from 'nanoid';

@Injectable()
export class HotelBookingService {
  private readonly logger = new Logger(HotelBookingService.name);

  constructor(
    private prisma: PrismaService,
    private registry: HotelProviderRegistry,
    private ai: AiOrchestrator,
    private workflow: WorkflowService,
  ) {}

  async searchHotels(companyId: string, criteria: HotelSearchCriteria) {
    const providers = this.registry.getAllProviders();
    const searchPromises = providers.map((p) =>
      p.search(criteria).catch((e) => {
        this.logger.error(`Hotel Provider ${p.name} failed`, e);
        return [];
      }),
    );

    const results = await Promise.all(searchPromises);
    const flattened = results.flat();

    const aiRec = await this.ai.process(
      `Recommend best hotels: ${JSON.stringify(flattened.slice(0, 5))}`,
      { companyId, task: 'HOTEL_RECOMMENDATION' },
    );

    return {
      offers: flattened,
      aiInsights: aiRec.response,
    };
  }

  async createBooking(
    companyId: string,
    customerId: string,
    providerName: string,
    offerId: string,
    guests: any[],
  ) {
    const provider = this.registry.getProvider(providerName);
    const result = await provider.book(offerId, guests);

    const internalRef = `HOTEL-${nanoid(10).toUpperCase()}`;

    const booking = await (this.prisma as any).hotelBooking.create({
      data: {
        companyId,
        customerId,
        referenceNumber: internalRef,
        hotelConfirmationNumber: result.confirmationNumber,
        supplierReference: result.supplierRef,
        provider: providerName,
        hotelId: result.hotelId,
        hotelName: result.hotelName,
        roomDetails: result.rooms,
        checkIn: new Date(result.checkIn),
        checkOut: new Date(result.checkOut),
        totalAmount: result.totalPrice.amount,
        currency: result.totalPrice.currency,
        guests,
      },
    });

    await this.workflow.trigger('hotel.booking_created', {
      bookingId: booking.id,
      hotelName: booking.hotelName,
    });

    return booking;
  }
}
