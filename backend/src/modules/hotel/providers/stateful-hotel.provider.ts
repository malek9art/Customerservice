import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  HotelOffer,
  HotelProviderBookingResult,
  HotelSearchCriteria,
  HotelRoomOffer,
  IHotelProvider,
} from '../interfaces/hotel-provider.interface';

@Injectable()
export class StatefulHotelProvider implements IHotelProvider {
  readonly name = 'TRAVELOS_HOTELS';
  private readonly offers = new Map<string, HotelOffer>();
  private readonly activeConfirmations = new Set<string>();

  async search(criteria: HotelSearchCriteria): Promise<HotelOffer[]> {
    const nights = Math.ceil(
      (new Date(criteria.checkOut).getTime() - new Date(criteria.checkIn).getTime()) /
        86_400_000,
    );
    if (nights < 1) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const cityKey = criteria.city.trim().toUpperCase().replace(/\s+/g, '-');
    const country = criteria.country.trim().toUpperCase();
    const definitions = [
      {
        suffix: 'GRAND',
        name: `${criteria.city} Grand Hotel`,
        stars: 5,
        address: `Central District, ${criteria.city}`,
        amenities: ['Free Wi-Fi', 'Breakfast', 'Airport transfer', 'Pool', 'Gym'],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        ],
        rooms: this.rooms('GRAND', 145),
      },
      {
        suffix: 'PLAZA',
        name: `${criteria.city} Plaza Suites`,
        stars: 4,
        address: `Business Avenue, ${criteria.city}`,
        amenities: ['Free Wi-Fi', 'Restaurant', 'Family rooms', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80',
        ],
        rooms: this.rooms('PLAZA', 105),
      },
      {
        suffix: 'INN',
        name: `${criteria.city} Traveller Inn`,
        stars: 3,
        address: `Airport Road, ${criteria.city}`,
        amenities: ['Free Wi-Fi', '24-hour reception', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        ],
        rooms: this.rooms('INN', 75),
      },
    ];

    const results = definitions.map((hotel, index): HotelOffer => {
      const id = `hotel-offer-${cityKey}-${hotel.suffix}-${criteria.checkIn}-${criteria.checkOut}`;
      const baseRoom = hotel.rooms[0];
      const offer: HotelOffer = {
        id,
        hotelId: `hotel-${cityKey}-${hotel.suffix}`,
        hotelName: hotel.name,
        provider: this.name,
        images: hotel.images,
        stars: hotel.stars,
        location: { city: criteria.city, country, address: hotel.address },
        rooms: hotel.rooms,
        totalPrice: {
          amount: String(baseRoom.pricePerNight * nights * criteria.rooms),
          currency: 'USD',
        },
        cancellationPolicy:
          index === 2
            ? 'Non-refundable after booking confirmation'
            : 'Free cancellation until 48 hours before check-in',
        amenities: hotel.amenities,
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        requestedRooms: criteria.rooms,
      };
      this.offers.set(id, offer);
      return offer;
    });

    return results;
  }

  async book(
    offerId: string,
    roomId: string,
    guests: Array<{
      firstName: string;
      lastName: string;
      type: string;
      dateOfBirth?: string;
      email?: string;
    }>,
  ): Promise<HotelProviderBookingResult> {
    const offer = this.offers.get(offerId);
    if (!offer) {
      throw new NotFoundException('Hotel offer expired; search again');
    }
    const selectedRoom = offer.rooms.find((room) => room.id === roomId);
    if (!selectedRoom) {
      throw new NotFoundException('Selected room is not available');
    }
    if (offer.requestedRooms > selectedRoom.available) {
      throw new BadRequestException('Requested room capacity is not available');
    }
    if (!guests.length) {
      throw new BadRequestException('At least one guest is required');
    }

    const confirmationNumber = `HTL${nanoid(8).toUpperCase()}`;
    this.activeConfirmations.add(confirmationNumber);
    return {
      confirmationNumber,
      supplierRef: `SUP-${nanoid(10).toUpperCase()}`,
      offer,
      selectedRoom,
    };
  }

  async cancel(confirmationNumber: string): Promise<{ success: boolean }> {
    this.activeConfirmations.delete(confirmationNumber);
    return { success: true };
  }

  private rooms(prefix: string, basePrice: number): HotelRoomOffer[] {
    return [
      {
        id: `${prefix}-STANDARD`,
        type: 'STANDARD',
        bedType: 'Queen bed',
        mealPlan: 'ROOM_ONLY',
        pricePerNight: basePrice,
        maxAdults: 2,
        maxChildren: 1,
        available: 12,
      },
      {
        id: `${prefix}-DELUXE`,
        type: 'DELUXE',
        bedType: 'King bed',
        mealPlan: 'BREAKFAST',
        pricePerNight: basePrice + 55,
        maxAdults: 2,
        maxChildren: 2,
        available: 8,
      },
      {
        id: `${prefix}-FAMILY`,
        type: 'FAMILY_SUITE',
        bedType: 'King bed + twin beds',
        mealPlan: 'BREAKFAST',
        pricePerNight: basePrice + 110,
        maxAdults: 4,
        maxChildren: 3,
        available: 4,
      },
    ];
  }
}
