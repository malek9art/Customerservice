import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { WorkflowService } from '../workflows/workflows.service';
import { CreateHotelBookingDto, HotelGuestType } from './dto/create-hotel-booking.dto';
import { UpdateHotelBookingDto } from './dto/update-hotel-booking.dto';
import {
  HotelRoomOffer,
  HotelSearchCriteria,
} from './interfaces/hotel-provider.interface';
import { HotelProviderRegistry } from './providers/hotel-provider.registry';

interface StoredRoomDetails {
  selectedRoom: HotelRoomOffer;
  availableRooms: HotelRoomOffer[];
  roomCount: number;
}

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
    this.assertDateRange(criteria.checkIn, criteria.checkOut);
    const providers = this.registry.getAllProviders();
    const searchPromises = providers.map((provider) =>
      provider.search(criteria).catch((error) => {
        this.logger.error(`Hotel provider ${provider.name} failed`, error);
        return [];
      }),
    );
    const offers = (await Promise.all(searchPromises)).flat();
    const aiRecommendation = await this.ai.process(
      `Recommend the best hotel for ${criteria.city}, ${criteria.country}: ${JSON.stringify(offers.slice(0, 5))}`,
      { companyId, task: 'HOTEL_RECOMMENDATION' },
    );

    return { offers, aiInsights: aiRecommendation.response };
  }

  async createBooking(companyId: string, body: CreateHotelBookingDto) {
    await this.assertCustomer(companyId, body.customerId);
    const provider = this.registry.getProvider(body.provider.toUpperCase());
    const result = await provider.book(body.offerId, body.roomId, body.guests);
    this.assertGuestCapacity(result.selectedRoom, result.offer.requestedRooms, body.guests);

    const nights = this.nights(result.offer.checkIn, result.offer.checkOut);
    const totalAmount =
      result.selectedRoom.pricePerNight * nights * result.offer.requestedRooms;
    const internalReference = `HOTEL-${nanoid(10).toUpperCase()}`;
    const roomDetails: StoredRoomDetails = {
      selectedRoom: result.selectedRoom,
      availableRooms: result.offer.rooms,
      roomCount: result.offer.requestedRooms,
    };

    const booking = await (this.prisma as any).hotelBooking.create({
      data: {
        companyId,
        customerId: body.customerId,
        referenceNumber: internalReference,
        hotelConfirmationNumber: result.confirmationNumber,
        supplierReference: result.supplierRef,
        status: 'CONFIRMED',
        provider: provider.name,
        hotelId: result.offer.hotelId,
        hotelName: result.offer.hotelName,
        hotelImages: result.offer.images,
        stars: result.offer.stars,
        location: result.offer.location,
        amenities: result.offer.amenities,
        cancellationPolicy: result.offer.cancellationPolicy,
        roomDetails,
        checkIn: new Date(result.offer.checkIn),
        checkOut: new Date(result.offer.checkOut),
        totalAmount,
        currency: result.offer.totalPrice.currency,
        guests: body.guests,
      },
    });

    await Promise.all([
      this.workflow.trigger('hotel.booking_created', {
        bookingId: booking.id,
        companyId,
        customerId: body.customerId,
        hotelName: booking.hotelName,
      }),
      this.logActivity(
        body.customerId,
        'HOTEL_BOOKING_CREATED',
        `Hotel booking ${internalReference} created for ${booking.hotelName}`,
      ),
    ]);
    return booking;
  }

  async getBooking(companyId: string, bookingId: string) {
    return this.findOwnedBooking(companyId, bookingId);
  }

  async updateBooking(
    companyId: string,
    bookingId: string,
    body: UpdateHotelBookingDto,
  ) {
    const booking = await this.findOwnedBooking(companyId, bookingId);
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled hotel booking cannot be modified');
    }
    const hasChanges = Object.values(body).some((value) => value !== undefined);
    if (!hasChanges) {
      throw new BadRequestException('At least one booking change is required');
    }

    const checkIn = body.checkIn || this.dateOnly(booking.checkIn);
    const checkOut = body.checkOut || this.dateOnly(booking.checkOut);
    this.assertDateRange(checkIn, checkOut);

    const roomDetails = booking.roomDetails as StoredRoomDetails;
    const selectedRoom = body.roomId
      ? roomDetails.availableRooms.find((room) => room.id === body.roomId)
      : roomDetails.selectedRoom;
    if (!selectedRoom) {
      throw new BadRequestException('Selected room is not available for this hotel');
    }
    const roomCount = body.roomCount || roomDetails.roomCount;
    if (roomCount > selectedRoom.available) {
      throw new BadRequestException('Requested room capacity is not available');
    }
    const guests = body.guests || booking.guests;
    this.assertGuestCapacity(selectedRoom, roomCount, guests);
    const totalAmount = selectedRoom.pricePerNight * this.nights(checkIn, checkOut) * roomCount;

    const updated = await (this.prisma as any).hotelBooking.update({
      where: { id: bookingId },
      data: {
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        roomDetails: {
          ...roomDetails,
          selectedRoom,
          roomCount,
        },
        guests,
        totalAmount,
        status: 'CONFIRMED',
      },
    });
    await this.logActivity(
      booking.customerId,
      'HOTEL_BOOKING_UPDATED',
      `Hotel booking ${booking.referenceNumber} was updated`,
    );
    await this.workflow.trigger('hotel.booking_updated', {
      bookingId,
      companyId,
      customerId: booking.customerId,
    });
    return updated;
  }

  async cancelBooking(companyId: string, bookingId: string, reason: string) {
    const booking = await this.findOwnedBooking(companyId, bookingId);
    if (booking.status === 'CANCELLED') {
      return booking;
    }
    const provider = this.registry.getProvider(booking.provider);
    await provider.cancel(booking.hotelConfirmationNumber);
    const cancelled = await (this.prisma as any).hotelBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });
    await this.logActivity(
      booking.customerId,
      'HOTEL_BOOKING_CANCELLED',
      `Hotel booking ${booking.referenceNumber} cancelled: ${reason}`,
    );
    await this.workflow.trigger('hotel.booking_cancelled', {
      bookingId,
      companyId,
      customerId: booking.customerId,
      reason,
    });
    return cancelled;
  }

  async getDashboard(companyId: string) {
    const bookings = await (this.prisma as any).hotelBooking.findMany({
      where: { companyId },
    });
    const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED');
    return {
      totalBookings: bookings.length,
      activeBookings: confirmed.length,
      cancelledBookings: bookings.filter((booking) => booking.status === 'CANCELLED').length,
      totalRevenue: confirmed.reduce(
        (total, booking) => total + (Number(booking.totalAmount) || 0),
        0,
      ),
      upcomingCheckIns: confirmed
        .sort(
          (first, second) =>
            new Date(first.checkIn).getTime() - new Date(second.checkIn).getTime(),
        )
        .slice(0, 5),
    };
  }

  private async assertCustomer(companyId: string, customerId: string) {
    const customer = await (this.prisma as any).customer.findUnique({
      where: { id: customerId },
    });
    if (!customer || customer.companyId !== companyId) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  private async findOwnedBooking(companyId: string, bookingId: string) {
    const booking = await (this.prisma as any).hotelBooking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || booking.companyId !== companyId) {
      throw new NotFoundException('Hotel booking not found');
    }
    return booking;
  }

  private assertDateRange(checkIn: string, checkOut: string) {
    if (this.nights(checkIn, checkOut) < 1) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }
  }

  private nights(checkIn: string, checkOut: string) {
    return Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
    );
  }

  private dateOnly(value: Date | string) {
    return new Date(value).toISOString().slice(0, 10);
  }

  private assertGuestCapacity(
    room: HotelRoomOffer,
    roomCount: number,
    guests: Array<{ type?: string }>,
  ) {
    const adults = guests.filter((guest) => guest.type === HotelGuestType.ADULT).length;
    const children = guests.filter((guest) => guest.type === HotelGuestType.CHILD).length;
    if (!adults) {
      throw new BadRequestException('At least one adult guest is required');
    }
    if (
      adults > room.maxAdults * roomCount ||
      children > room.maxChildren * roomCount
    ) {
      throw new BadRequestException('Guest count exceeds selected room capacity');
    }
  }

  private async logActivity(
    customerId: string,
    action: string,
    description: string,
  ) {
    return (this.prisma as any).activityLog.create({
      data: { customerId, action, description },
    });
  }
}
