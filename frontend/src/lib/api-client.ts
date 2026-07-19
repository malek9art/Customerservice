export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const DEFAULT_COMPANY_ID = 'comp-id';

export interface ApiRequestOptions extends RequestInit {
  companyId?: string;
}

export interface Customer {
  id: string;
  companyId: string;
  fullName: string;
  phone: string;
  email?: string;
  nationality?: string;
  classification?: string;
  interests?: string[];
  passports?: Passport[];
  visas?: VisaApplication[];
  flightBookings?: FlightBooking[];
  hotelBookings?: HotelBooking[];
  pilgrimageBookings?: PilgrimageBooking[];
  transactions?: unknown[];
  documents?: unknown[];
  activityLogs?: unknown[];
  invoices?: Invoice[];
  payments?: Payment[];
  financialSummary?: { invoiced: number; paid: number; outstanding: number };
  aiInsights?: {
    summary: string;
    recommendations: string[];
    nextBestAction: string;
  };
}

export interface Passport {
  id: string;
  companyId: string;
  customerId: string;
  passportNumber: string;
  status: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisaApplication {
  id: string;
  customerId: string;
  referenceNumber?: string;
  country: string;
  visaType: string;
  status: string;
  requirements?: unknown;
  eligibilityData?: string;
  createdAt?: string;
}

export interface FlightOffer {
  id: string;
  provider: string;
  validatingAirline: string;
  itineraries: Array<{
    duration?: string;
    segments?: Array<{
      departure?: { iataCode?: string; at?: string } | string;
      arrival?: { iataCode?: string; at?: string } | string;
      carrierCode?: string;
      carrier?: string;
      number?: string;
    }>;
  }>;
  price: { total: string; currency: string };
}

export interface FlightBooking {
  id: string;
  companyId: string;
  customerId: string;
  referenceNumber: string;
  pnr: string;
  status: 'PNR_CREATED' | 'TICKETED' | 'CANCELLED';
  provider: string;
  totalAmount: string | number;
  currency: string;
  passengers: Array<{ firstName: string; lastName: string }>;
  segments: FlightOffer['itineraries'];
  ticketNumbers?: string[];
  cancellationReason?: string;
}

export interface FlightSearchResult {
  offers: FlightOffer[];
  aiInsights: string;
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
  hotelId: string;
  hotelName: string;
  provider: string;
  images: string[];
  stars: number;
  location: { city: string; country: string; address: string };
  rooms: HotelRoomOffer[];
  totalPrice: { amount: string; currency: string };
  cancellationPolicy: string;
  amenities: string[];
  checkIn: string;
  checkOut: string;
  requestedRooms: number;
}

export interface HotelGuest {
  firstName: string;
  lastName: string;
  type: 'ADULT' | 'CHILD';
  dateOfBirth?: string;
  email?: string;
}

export interface Payment { id: string; invoiceId: string; customerId?: string; amount: number; method: string; transactionId?: string; status: string; createdAt: string; }
export interface InvoiceItem { description: string; quantity: number; unitPrice: number; serviceType?: string; serviceId?: string; }
export interface Invoice { id: string; customerId: string; number: string; subtotal: number; discount: number; taxRate: number; taxAmount: number; amount: number; paidAmount: number; balance: number; currency: string; status: string; items: InvoiceItem[]; payments?: Payment[]; sourceType?: string; createdAt: string; }

export interface Pilgrim {
  id: string; bookingId: string; packageId: string; customerId: string; fullName?: string;
  gender?: string; passportNumber?: string; roomNumber?: string; roomType?: string;
  busNumber?: string; seatNumber?: number; groupId?: string; digitalCardUrl?: string;
  medicalInfo?: string; emergencyContact?: string;
}
export interface PilgrimageBooking {
  id: string; packageId: string; customerId: string; status: string;
  totalAmount: number | string; paidAmount: number | string; cancellationReason?: string;
  pilgrims: Pilgrim[]; package?: TravelPackage;
}

export interface TravelPackage {
  id: string; companyId: string; name: string; type: string; season?: string;
  description?: string; startDate: string; endDate: string; durationDays: number;
  basePrice: number | string; currency: string; capacity: number; remainingSlots: number;
  status: string; flights?: Record<string, unknown>; hotels?: Record<string, unknown>;
  transportation?: Record<string, unknown>; bookings?: unknown[]; bookedSlots?: number;
}

export interface HotelBooking {
  id: string;
  companyId: string;
  customerId: string;
  referenceNumber: string;
  hotelConfirmationNumber: string;
  status: 'CONFIRMED' | 'CANCELLED';
  provider: string;
  hotelId: string;
  hotelName: string;
  hotelImages?: string[];
  stars?: number;
  location?: { city: string; country: string; address: string };
  amenities?: string[];
  cancellationPolicy?: string;
  roomDetails: {
    selectedRoom: HotelRoomOffer;
    availableRooms: HotelRoomOffer[];
    roomCount: number;
  };
  checkIn: string;
  checkOut: string;
  totalAmount: number | string;
  currency: string;
  guests: HotelGuest[];
  cancellationReason?: string;
}

function errorMessage(payload: unknown, status: number, statusText: string) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    return Array.isArray(message) ? message.join('، ') : String(message);
  }
  return `HTTP ${status}: ${statusText}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const companyId = options.companyId || DEFAULT_COMPANY_ID;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-company-id': companyId,
    ...((options.headers as Record<string, string>) || {}),
  };
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new Error(errorMessage(payload, response.status, response.statusText));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const TravelOSApi = {
  health: () => apiFetch<{ status: string; timestamp: string }>('/core/health'),

  customers: {
    create: (
      body: {
        fullName: string;
        phone: string;
        email?: string;
        nationality?: string;
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    search: (query: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<Customer[]>(`/customers/search?q=${encodeURIComponent(query)}`, {
        companyId,
      }),
    get360: (customerId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<Customer>(`/customers/${customerId}/360`, { companyId }),
  },

  passports: {
    getInventory: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<Passport[]>('/passports/inventory', { companyId }),
    receive: (
      body: {
        customerId: string;
        passportNumber: string;
        receivedById: string;
        location?: string;
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<Passport>('/passports/receive', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    updateStatus: (
      passportId: string,
      body: {
        status: string;
        location: string;
        actorId: string;
        notes?: string;
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<Passport>(`/passports/${passportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        companyId,
      }),
  },

  visas: {
    create: (
      body: { customerId: string; country: string; visaType: string },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<VisaApplication>('/visa/applications', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    getDashboard: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<unknown>('/visa/dashboard', { companyId }),
  },

  packages: {
    list: (companyId = DEFAULT_COMPANY_ID) => apiFetch<TravelPackage[]>('/packages', { companyId }),
    get: (id: string, companyId = DEFAULT_COMPANY_ID) => apiFetch<TravelPackage>(`/packages/${id}`, { companyId }),
    create: (body: Record<string, unknown>, companyId = DEFAULT_COMPANY_ID) => apiFetch<TravelPackage>('/packages', { method: 'POST', body: JSON.stringify(body), companyId }),
    update: (id: string, body: Record<string, unknown>, companyId = DEFAULT_COMPANY_ID) => apiFetch<TravelPackage>(`/packages/${id}`, { method: 'PATCH', body: JSON.stringify(body), companyId }),
    setCapacity: (id: string, capacity: number, companyId = DEFAULT_COMPANY_ID) => apiFetch<TravelPackage>(`/packages/${id}/capacity`, { method: 'PATCH', body: JSON.stringify({ capacity }), companyId }),
  },

  pilgrimage: {
    dashboard: (companyId = DEFAULT_COMPANY_ID) => apiFetch<Record<string, unknown>>('/pilgrimage/dashboard', { companyId }),
    getBookings: (companyId = DEFAULT_COMPANY_ID) => apiFetch<Record<string, unknown>>('/pilgrimage/dashboard', { companyId }),
    createBooking: (body: { customerId: string; packageId: string; pilgrims: Array<{ fullName: string; gender: string; passportNumber?: string; medicalInfo?: string; emergencyContact?: string }> }, companyId = DEFAULT_COMPANY_ID) => apiFetch<{ booking: PilgrimageBooking; pilgrims: Pilgrim[]; package: TravelPackage }>('/pilgrimage/bookings', { method: 'POST', body: JSON.stringify(body), companyId }),
    modifyBooking: (id: string, body: { status?: string; paidAmount?: number }, companyId = DEFAULT_COMPANY_ID) => apiFetch<PilgrimageBooking>(`/pilgrimage/bookings/${id}/modify`, { method: 'PATCH', body: JSON.stringify(body), companyId }),
    cancelBooking: (id: string, reason: string, companyId = DEFAULT_COMPANY_ID) => apiFetch<PilgrimageBooking>(`/pilgrimage/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }), companyId }),
    allocateRooms: (input: string | { packageId: string; options?: { maxRoomCapacity?: number; groupFamilies?: boolean; separateByGender?: boolean } }, maxRoomCapacity = 4, companyId = DEFAULT_COMPANY_ID) => {
      const packageId = typeof input === 'string' ? input : input.packageId;
      const capacity = typeof input === 'string' ? maxRoomCapacity : input.options?.maxRoomCapacity || 4;
      return apiFetch<Record<string, unknown>>('/pilgrimage/room-allocation', { method: 'POST', body: JSON.stringify({ packageId, maxRoomCapacity: capacity }), companyId });
    },
    allocateBuses: (input: string | { packageId: string; options?: { busCapacity?: number; keepBookingsTogether?: boolean } }, busCapacity = 45, companyId = DEFAULT_COMPANY_ID) => {
      const packageId = typeof input === 'string' ? input : input.packageId;
      const capacity = typeof input === 'string' ? busCapacity : input.options?.busCapacity || 45;
      return apiFetch<Record<string, unknown>>('/pilgrimage/bus-allocation', { method: 'POST', body: JSON.stringify({ packageId, busCapacity: capacity }), companyId });
    },
    syncCapacity: (packageId: string, companyId = DEFAULT_COMPANY_ID) => apiFetch<Record<string, unknown>>(`/pilgrimage/packages/${packageId}/capacity-sync`, { method: 'POST', companyId }),
    generatePilgrimCard: (pilgrimId: string, companyId = DEFAULT_COMPANY_ID) => apiFetch<{ pilgrimId: string; cardUrl: string }>(`/pilgrimage/pilgrims/${pilgrimId}/digital-card`, { method: 'POST', companyId }),
    allocateGroup: (pilgrimId: string, groupId: string, companyId = DEFAULT_COMPANY_ID) => apiFetch<Pilgrim>('/pilgrimage/allocate-group', { method: 'POST', body: JSON.stringify({ pilgrimId, groupId }), companyId }),
  },

  flights: {
    search: (
      criteria: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        passengers: { adults: number; children: number; infants: number };
        cabinClass: string;
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<FlightSearchResult>('/flights/search', {
        method: 'POST',
        body: JSON.stringify(criteria),
        companyId,
      }),
    evaluateFareRules: (
      body: Record<string, unknown>,
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<Record<string, unknown>>('/flights/fare-rules/evaluate', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    createBooking: (
      body: {
        customerId: string;
        provider: string;
        offerId: string;
        passengers: Array<{
          firstName: string;
          lastName: string;
          dateOfBirth?: string;
          email?: string;
        }>;
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<FlightBooking>('/flights/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    issueTicket: (bookingId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<FlightBooking>(`/flights/bookings/${bookingId}/issue-ticket`, {
        method: 'POST',
        companyId,
      }),
    cancelBooking: (
      bookingId: string,
      reason?: string,
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<FlightBooking>(`/flights/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
        companyId,
      }),
    getDashboard: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<{
        activeBookings: number;
        totalRevenue: number;
        pendingTicketing: number;
      }>('/flights/dashboard', { companyId }),
  },

  hotels: {
    search: (
      criteria: {
        city: string;
        country: string;
        checkIn: string;
        checkOut: string;
        rooms: number;
        adults: number;
        children: number;
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<{ offers: HotelOffer[]; aiInsights: string }>('/hotels/search', {
        method: 'POST',
        body: JSON.stringify(criteria),
        companyId,
      }),
    createBooking: (
      body: {
        customerId: string;
        provider: string;
        offerId: string;
        roomId: string;
        guests: HotelGuest[];
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<HotelBooking>('/hotels/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    getBooking: (bookingId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<HotelBooking>(`/hotels/bookings/${bookingId}`, { companyId }),
    updateBooking: (
      bookingId: string,
      body: {
        checkIn?: string;
        checkOut?: string;
        roomId?: string;
        roomCount?: number;
        guests?: HotelGuest[];
      },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<HotelBooking>(`/hotels/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        companyId,
      }),
    cancelBooking: (
      bookingId: string,
      reason: string,
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<HotelBooking>(`/hotels/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
        companyId,
      }),
    getDashboard: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<{
        totalBookings: number;
        activeBookings: number;
        cancelledBookings: number;
        totalRevenue: number;
      }>('/hotels/dashboard', { companyId }),
  },

  accounting: {
    getDashboard: (companyId = DEFAULT_COMPANY_ID) => apiFetch<Record<string, number>>('/accounting/dashboard', { companyId }),
    customerInvoices: (customerId: string, companyId = DEFAULT_COMPANY_ID) => apiFetch<Invoice[]>(`/accounting/invoices?customerId=${customerId}`, { companyId }),
    customerStatement: (customerId: string, companyId = DEFAULT_COMPANY_ID) => apiFetch<Record<string, unknown>>(`/accounting/customers/${customerId}/statement`, { companyId }),
    ledger: (companyId = DEFAULT_COMPANY_ID) => apiFetch<Array<Record<string, unknown>>>('/accounting/ledger', { companyId }),
    createInvoice: (body: { customerId: string; items: InvoiceItem[]; taxRate?: number; discount?: number; currency?: string }, companyId = DEFAULT_COMPANY_ID) => apiFetch<Invoice>('/accounting/invoices', { method: 'POST', body: JSON.stringify(body), companyId }),
    recordPayment: (invoiceId: string, body: { amount: number; method: string; transactionId?: string; notes?: string }, companyId = DEFAULT_COMPANY_ID) => apiFetch<{ payment: Payment; invoice: Invoice }>(`/accounting/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(body), companyId }),
    processBankStatement: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/reconciliation/process-statement', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    confirmMatch: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/reconciliation/confirm-match', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    postEvent: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/journals/post-event', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
  },

  ai: {
    executeChain: (
      prompt: string,
      context: any = {},
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<any>('/ai/whatsapp/message', {
        method: 'POST',
        body: JSON.stringify({ text: prompt, ...context }),
        companyId,
      }),
  },

  documents: {
    processAndVault: (
      formData: FormData,
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      fetch(`${API_BASE_URL}/documents/vault`, {
        method: 'POST',
        headers: { 'x-company-id': companyId },
        body: formData,
      }).then((response) => response.json()),
  },
};
