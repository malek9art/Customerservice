export interface FlightSearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: 'ECONOMY' | 'PREMIUM' | 'BUSINESS' | 'FIRST';
}

export interface FlightOffer {
  id: string;
  provider: string;
  itineraries: any[];
  price: {
    total: string;
    currency: string;
  };
  validatingAirline: string;
  fareRules?: any;
}

export interface IFlightProvider {
  name: string;
  search(criteria: FlightSearchCriteria): Promise<FlightOffer[]>;
  createBooking(offerId: string, passengers: any[]): Promise<any>;
  issueTicket(pnr: string): Promise<any>;
  cancelBooking(pnr: string): Promise<any>;
}
