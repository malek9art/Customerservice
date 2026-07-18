import { Injectable } from '@nestjs/common';
import {
  IFlightProvider,
  FlightSearchCriteria,
  FlightOffer,
} from '../interfaces/flight-provider.interface';

@Injectable()
export class MockAmadeusProvider implements IFlightProvider {
  name = 'AMADEUS';

  async search(criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
    return [
      {
        id: 'mock-offer-1',
        provider: this.name,
        itineraries: [],
        price: { total: '450.00', currency: 'USD' },
        validatingAirline: 'QR',
      },
    ];
  }

  async createBooking(offerId: string, passengers: any[]): Promise<any> {
    return {
      pnr: 'MOCKPNR123',
      price: { total: '450.00', currency: 'USD' },
      itineraries: [],
    };
  }

  async issueTicket(pnr: string): Promise<any> {
    return { success: true, ticketNumbers: ['157-1234567890'] };
  }

  async cancelBooking(pnr: string): Promise<any> {
    return { success: true };
  }
}
