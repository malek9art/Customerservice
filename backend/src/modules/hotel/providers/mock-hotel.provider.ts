import { Injectable } from '@nestjs/common';
import {
  IHotelProvider,
  HotelSearchCriteria,
  HotelOffer,
} from '../interfaces/hotel-provider.interface';

@Injectable()
export class MockHotelProvider implements IHotelProvider {
  name = 'MOCK_PROVIDER';

  async search(criteria: HotelSearchCriteria): Promise<HotelOffer[]> {
    return [
      {
        id: 'h-offer-1',
        hotelName: 'Mock Luxury Resort',
        hotelId: 'h-123',
        provider: this.name,
        rooms: [{ type: 'DELUXE', price: '200' }],
        totalPrice: { amount: '200.00', currency: 'USD' },
      },
    ];
  }

  async book(offerId: string, guests: any[]): Promise<any> {
    return {
      confirmationNumber: 'HOTEL12345',
      supplierRef: 'SUPP-999',
      hotelId: 'h-123',
      hotelName: 'Mock Luxury Resort',
      rooms: [{ type: 'DELUXE' }],
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
      totalPrice: { amount: '200.00', currency: 'USD' },
    };
  }

  async cancel(confirmationNumber: string): Promise<any> {
    return { success: true };
  }
}
