export interface HotelSearchCriteria {
  city: string;
  checkIn: string;
  checkOut: string;
  rooms: {
    adults: number;
    children: number;
    ages?: number[];
  }[];
}

export interface HotelOffer {
  id: string;
  hotelName: string;
  hotelId: string;
  provider: string;
  rooms: any[];
  totalPrice: {
    amount: string;
    currency: string;
  };
  cancellationPolicy?: string;
}

export interface IHotelProvider {
  name: string;
  search(criteria: HotelSearchCriteria): Promise<HotelOffer[]>;
  book(offerId: string, guests: any[]): Promise<any>;
  cancel(confirmationNumber: string): Promise<any>;
}
