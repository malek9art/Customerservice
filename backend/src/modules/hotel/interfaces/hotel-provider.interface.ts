export interface HotelSearchCriteria {
  city: string;
  country: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
}

export interface HotelRoomOffer {
  id: string;
  type: string;
  bedType: string;
  mealPlan: string;
  pricePerNight: number;
  maxAdults: number;
  maxChildren: number;
  available: number;
}

export interface HotelOffer {
  id: string;
  hotelName: string;
  hotelId: string;
  provider: string;
  images: string[];
  stars: number;
  location: {
    city: string;
    country: string;
    address: string;
  };
  rooms: HotelRoomOffer[];
  totalPrice: {
    amount: string;
    currency: string;
  };
  cancellationPolicy: string;
  amenities: string[];
  checkIn: string;
  checkOut: string;
  requestedRooms: number;
}

export interface HotelProviderBookingResult {
  confirmationNumber: string;
  supplierRef: string;
  offer: HotelOffer;
  selectedRoom: HotelRoomOffer;
}

export interface IHotelProvider {
  name: string;
  search(criteria: HotelSearchCriteria): Promise<HotelOffer[]>;
  book(
    offerId: string,
    roomId: string,
    guests: Array<{
      firstName: string;
      lastName: string;
      type: string;
      dateOfBirth?: string;
      email?: string;
    }>,
  ): Promise<HotelProviderBookingResult>;
  cancel(confirmationNumber: string): Promise<{ success: boolean }>;
}
