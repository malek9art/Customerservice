import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PrismaService implements OnModuleInit {
  // Stateful in-memory stores for testing and execution without native Prisma binaries
  private stores: Record<string, Map<string, any>> = {
    company: new Map(),
    subscriptionPlan: new Map(),
    subscription: new Map(),
    saasInvoice: new Map(),
    branch: new Map(),
    employee: new Map(),
    customer: new Map(),
    passportInventory: new Map(),
    passportLog: new Map(),
    hotelBooking: new Map(),
    package: new Map(),
    itineraryItem: new Map(),
    pilgrimageGroup: new Map(),
    pilgrimageBooking: new Map(),
    pilgrim: new Map(),
    account: new Map(),
    journal: new Map(),
    journalEntry: new Map(),
    invoice: new Map(),
    payment: new Map(),
    flightBooking: new Map(),
    visaRecord: new Map(),
    transaction: new Map(),
    activityLog: new Map(),
    document: new Map(),
    businessRule: new Map(),
    chatSession: new Map(),
    chatMessage: new Map(),
    report: new Map(),
    analyticsSnapshot: new Map(),
    aiActionLog: new Map(),
  };

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Seed default company
    const defaultCompany = {
      id: 'comp-id',
      name: 'TravelOS Demo Agency',
      slug: 'travelos-demo',
      subscriptionTier: 'ENTERPRISE',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stores.company.set(defaultCompany.id, defaultCompany);

    // Seed default customer
    const defaultCustomer = {
      id: 'cust-1',
      companyId: 'comp-id',
      fullName: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com',
      nationality: 'SA',
      rating: 4.8,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stores.customer.set(defaultCustomer.id, defaultCustomer);

    // Seed default accounts for double entry accounting
    const accounts = [
      { id: 'acc-cash', companyId: 'comp-id', code: '1010', name: 'Cash and Bank', type: 'ASSET', balance: 100000 },
      { id: 'acc-ar', companyId: 'comp-id', code: '1200', name: 'Accounts Receivable', type: 'ASSET', balance: 50000 },
      { id: 'acc-flight-rev', companyId: 'comp-id', code: '4010', name: 'Flight Revenue', type: 'REVENUE', balance: 0 },
      { id: 'acc-hotel-rev', companyId: 'comp-id', code: '4020', name: 'Hotel Revenue', type: 'REVENUE', balance: 0 },
      { id: 'acc-pilgrim-rev', companyId: 'comp-id', code: '4030', name: 'Pilgrimage Revenue', type: 'REVENUE', balance: 0 },
      { id: 'acc-visa-rev', companyId: 'comp-id', code: '4040', name: 'Visa Processing Revenue', type: 'REVENUE', balance: 0 },
      { id: 'acc-ap-airlines', companyId: 'comp-id', code: '2010', name: 'Airlines Payable', type: 'LIABILITY', balance: 0 },
      { id: 'acc-ap-suppliers', companyId: 'comp-id', code: '2020', name: 'Suppliers Payable', type: 'LIABILITY', balance: 0 },
      { id: 'acc-suspense', companyId: 'comp-id', code: '2090', name: 'Unreconciled Bank Suspense', type: 'LIABILITY', balance: 0 },
    ];
    for (const acc of accounts) {
      this.stores.account.set(acc.id, { ...acc, createdAt: new Date(), updatedAt: new Date() });
    }
  }

  private createGenericModelStore(entityName: string) {
    const store = this.stores[entityName] || (this.stores[entityName] = new Map());

    return {
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        if (args.where.id) return store.get(args.where.id) || null;

        // Composite keys or unique fields
        const entries = Array.from(store.values());
        for (const [key, value] of Object.entries(args.where)) {
          if (typeof value === 'object' && value !== null) {
            // Handle composite keys e.g. companyId_code
            const matches = entries.find((item) =>
              Object.entries(value).every(([k, v]) => item[k] === v),
            );
            if (matches) return matches;
          } else {
            const matches = entries.find((item) => item[key] === value);
            if (matches) return matches;
          }
        }
        return null;
      },
      findFirst: async (args: any) => {
        const entries = Array.from(store.values());
        if (!args?.where) return entries[0] || null;

        const filtered = entries.filter((item) => {
          return Object.entries(args.where).every(([k, v]) => {
            if (v === undefined) return true;
            return item[k] === v;
          });
        });
        return filtered[0] || null;
      },
      findMany: async (args: any) => {
        let entries = Array.from(store.values());
        if (args?.where) {
          entries = entries.filter((item) => {
            return Object.entries(args.where).every(([k, v]) => {
              if (v === undefined) return true;
              return item[k] === v;
            });
          });
        }
        return entries;
      },
      create: async (args: any) => {
        const id = args?.data?.id || uuidv4();
        const record = {
          id,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Handle Decimal fields if mul or numeric operations exist
        if (record.basePrice !== undefined) {
          const val = typeof record.basePrice === 'number' ? record.basePrice : Number(record.basePrice) || 0;
          record.basePrice = {
            mul: (n: number) => val * n,
            toNumber: () => val,
            toString: () => String(val),
          };
        }

        store.set(id, record);
        return record;
      },
      update: async (args: any) => {
        const id = args?.where?.id;
        let existing = store.get(id);
        if (!existing) {
          // search by criteria
          existing = await this.createGenericModelStore(entityName).findUnique(args);
        }
        if (!existing) {
          existing = { id: id || uuidv4() };
        }

        const data = { ...existing };
        if (args?.data) {
          for (const [k, v] of Object.entries(args.data)) {
            if (typeof v === 'object' && v !== null && 'decrement' in v) {
              data[k] = (data[k] || 0) - (v as any).decrement;
            } else if (typeof v === 'object' && v !== null && 'increment' in v) {
              data[k] = (data[k] || 0) + (v as any).increment;
            } else {
              data[k] = v;
            }
          }
        }
        data.updatedAt = new Date();
        store.set(data.id, data);
        return data;
      },
      delete: async (args: any) => {
        const id = args?.where?.id;
        const item = store.get(id);
        if (id) store.delete(id);
        return item;
      },
      count: async (args: any) => {
        const items = await this.createGenericModelStore(entityName).findMany(args);
        return items.length;
      },
    };
  }

  // Define property getters for all Prisma models
  get company() { return this.createGenericModelStore('company'); }
  get subscriptionPlan() { return this.createGenericModelStore('subscriptionPlan'); }
  get subscription() { return this.createGenericModelStore('subscription'); }
  get saasInvoice() { return this.createGenericModelStore('saasInvoice'); }
  get branch() { return this.createGenericModelStore('branch'); }
  get employee() { return this.createGenericModelStore('employee'); }
  get customer() { return this.createGenericModelStore('customer'); }
  get passportInventory() { return this.createGenericModelStore('passportInventory'); }
  get passportLog() { return this.createGenericModelStore('passportLog'); }
  get hotelBooking() { return this.createGenericModelStore('hotelBooking'); }
  get package() { return this.createGenericModelStore('package'); }
  get itineraryItem() { return this.createGenericModelStore('itineraryItem'); }
  get pilgrimageGroup() { return this.createGenericModelStore('pilgrimageGroup'); }
  get pilgrimageBooking() { return this.createGenericModelStore('pilgrimageBooking'); }
  get pilgrim() { return this.createGenericModelStore('pilgrim'); }
  get account() { return this.createGenericModelStore('account'); }
  get journal() { return this.createGenericModelStore('journal'); }
  get journalEntry() { return this.createGenericModelStore('journalEntry'); }
  get invoice() { return this.createGenericModelStore('invoice'); }
  get payment() { return this.createGenericModelStore('payment'); }
  get flightBooking() { return this.createGenericModelStore('flightBooking'); }
  get visaRecord() { return this.createGenericModelStore('visaRecord'); }
  get transaction() { return this.createGenericModelStore('transaction'); }
  get activityLog() { return this.createGenericModelStore('activityLog'); }
  get document() { return this.createGenericModelStore('document'); }
  get businessRule() { return this.createGenericModelStore('businessRule'); }
  get chatSession() { return this.createGenericModelStore('chatSession'); }
  get chatMessage() { return this.createGenericModelStore('chatMessage'); }
  get report() { return this.createGenericModelStore('report'); }
  get analyticsSnapshot() { return this.createGenericModelStore('analyticsSnapshot'); }
  get aiActionLog() { return this.createGenericModelStore('aiActionLog'); }

  async onModuleInit() {
    console.log('Stateful Prisma Memory Store initialized');
  }

  async enableShutdownHooks(app: INestApplication) {}
}
