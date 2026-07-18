export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const DEFAULT_COMPANY_ID = 'comp-id';

export interface ApiRequestOptions extends RequestInit {
  companyId?: string;
}

export async function apiFetch<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const companyId = options.companyId || DEFAULT_COMPANY_ID;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-company-id': companyId,
    ...(options.headers as Record<string, string> || {}),
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'API Network Request Failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.warn(`API call failed for [${endpoint}], utilizing resilient offline data context:`, error?.message);
    throw error;
  }
}

export const TravelOSApi = {
  // Pilgrimage Operations
  pilgrimage: {
    getBookings: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/pilgrimage/dashboard', { companyId }),
    createBooking: (body: { customerId: string; packageId: string; pilgrims: any[] }, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/pilgrimage/bookings', { method: 'POST', body: JSON.stringify(body), companyId }),
    allocateRooms: (body: { packageId: string; options?: any }, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/pilgrimage/room-allocation', { method: 'POST', body: JSON.stringify(body), companyId }),
    allocateBuses: (body: { packageId: string; options?: any }, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/pilgrimage/bus-allocation', { method: 'POST', body: JSON.stringify(body), companyId }),
    syncCapacity: (packageId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>(`/pilgrimage/packages/${packageId}/capacity-sync`, { method: 'POST', companyId }),
    generatePilgrimCard: (pilgrimId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>(`/pilgrimage/pilgrims/${pilgrimId}/digital-card`, { method: 'POST', companyId }),
  },

  // Flight Operations
  flights: {
    search: (criteria: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/search', { method: 'POST', body: JSON.stringify(criteria), companyId }),
    evaluateFareRules: (req: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/fare-rules/evaluate', { method: 'POST', body: JSON.stringify(req), companyId }),
    createBooking: (body: { customerId: string; provider: string; offerId: string; passengers: any[] }, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/bookings', { method: 'POST', body: JSON.stringify(body), companyId }),
    issueTicket: (bookingId: string, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>(`/flights/bookings/${bookingId}/issue-ticket`, { method: 'POST', companyId }),
    getDashboard: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/flights/dashboard', { companyId }),
  },

  // Accounting & Financial Operations
  accounting: {
    getDashboard: (companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/dashboard', { companyId }),
    createInvoice: (data: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/invoices', { method: 'POST', body: JSON.stringify(data), companyId }),
    processBankStatement: (payload: any, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/reconciliation/process-statement', { method: 'POST', body: JSON.stringify(payload), companyId }),
    confirmMatch: (body: { bankReference: string; targetType: string; targetId: string; amount: number }, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/reconciliation/confirm-match', { method: 'POST', body: JSON.stringify(body), companyId }),
    postEvent: (body: { eventType: string; payload: any }, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/accounting/journals/post-event', { method: 'POST', body: JSON.stringify(body), companyId }),
  },

  // AI Orchestration
  ai: {
    executeChain: (prompt: string, context: any = {}, companyId = DEFAULT_COMPANY_ID) =>
      apiFetch<any>('/ai/whatsapp/message', { method: 'POST', body: JSON.stringify({ text: prompt, ...context }), companyId }),
  },

  // Document Intelligence
  documents: {
    processAndVault: (formData: FormData, companyId = DEFAULT_COMPANY_ID) =>
      fetch(`${API_BASE_URL}/documents/vault`, {
        method: 'POST',
        headers: { 'x-company-id': companyId },
        body: formData,
      }).then((res) => res.json()),
  },
};
