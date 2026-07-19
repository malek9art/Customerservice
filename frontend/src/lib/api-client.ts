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
  flightBookings?: unknown[];
  hotelBookings?: unknown[];
  pilgrimageBookings?: unknown[];
  transactions?: unknown[];
  documents?: unknown[];
  activityLogs?: unknown[];
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

  pilgrimage: {
    getBookings: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/pilgrimage/dashboard', { companyId }),
    createBooking: (
      body: { customerId: string; packageId: string; pilgrims: any[] },
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<any>('/pilgrimage/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    allocateRooms: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/pilgrimage/room-allocation', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    allocateBuses: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/pilgrimage/bus-allocation', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    syncCapacity: (packageId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>(`/pilgrimage/packages/${packageId}/capacity-sync`, {
        method: 'POST',
        companyId,
      }),
    generatePilgrimCard: (
      pilgrimId: string,
      companyId = DEFAULT_COMPANY_ID,
    ) =>
      apiFetch<any>(`/pilgrimage/pilgrims/${pilgrimId}/digital-card`, {
        method: 'POST',
        companyId,
      }),
  },

  flights: {
    search: (criteria: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/search', {
        method: 'POST',
        body: JSON.stringify(criteria),
        companyId,
      }),
    evaluateFareRules: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/fare-rules/evaluate', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    createBooking: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
    issueTicket: (bookingId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>(`/flights/bookings/${bookingId}/issue-ticket`, {
        method: 'POST',
        companyId,
      }),
    getDashboard: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/dashboard', { companyId }),
  },

  accounting: {
    getDashboard: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/dashboard', { companyId }),
    createInvoice: (body: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/invoices', {
        method: 'POST',
        body: JSON.stringify(body),
        companyId,
      }),
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
