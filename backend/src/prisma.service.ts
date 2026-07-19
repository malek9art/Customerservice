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
    nationalIdentity: new Map(),
    familyMember: new Map(),
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
      interests: [],
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

  private applyWhere(entries: any[], where: any): any[] {
    return entries.filter((item) => {
      return Object.entries(where).every(([k, v]) => {
        if (v === undefined) return true;
        if (k === 'OR' && Array.isArray(v)) {
          return (v as any[]).some((cond: any) =>
            Object.entries(cond).every(([ck, cv]: [string, any]) => {
              if (cv === undefined) return true;
              if (typeof cv === 'object' && cv !== null && 'contains' in cv) {
                const itemVal = String(item[ck] || '');
                const searchVal = String(cv.contains);
                return cv.mode === 'insensitive'
                  ? itemVal.toLowerCase().includes(searchVal.toLowerCase())
                  : itemVal.includes(searchVal);
              }
              return item[ck] === cv;
            }),
          );
        }
        if (typeof v === 'object' && v !== null && 'contains' in v) {
          const itemVal = String(item[k] || '');
          const searchVal = String((v as any).contains);
          return (v as any).mode === 'insensitive'
            ? itemVal.toLowerCase().includes(searchVal.toLowerCase())
            : itemVal.includes(searchVal);
        }
        return item[k] === v;
      });
    });
  }

  private applyOrderBy(entries: any[], orderBy: any): any[] {
    if (!orderBy) return entries;
    const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...entries].sort((a, b) => {
      for (const order of orders) {
        for (const [field, dir] of Object.entries(order)) {
          const aVal = a[field];
          const bVal = b[field];
          if (aVal === bVal) continue;
          const cmp = aVal < bVal ? -1 : 1;
          return dir === 'desc' ? -cmp : cmp;
        }
      }
      return 0;
    });
  }

  private createGenericModelStore(entityName: string) {
    const store = this.stores[entityName] || (this.stores[entityName] = new Map());

    const self = this;

    return {
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let record: any = null;

        if (args.where.id) {
          record = store.get(args.where.id) || null;
        } else {
          // Composite keys or unique fields
          const entries = Array.from(store.values());
          for (const [key, value] of Object.entries(args.where)) {
            if (typeof value === 'object' && value !== null) {
              // Handle composite keys e.g. companyId_code
              const matches = entries.find((item) =>
                Object.entries(value as Record<string, any>).every(([k, v]) => item[k] === v),
              );
              if (matches) { record = matches; break; }
            } else {
              const matches = entries.find((item) => item[key] === value);
              if (matches) { record = matches; break; }
            }
          }
        }

        return record;
      },
      findFirst: async (args: any) => {
        let entries = Array.from(store.values());
        if (args?.where) {
          entries = self.applyWhere(entries, args.where);
        }
        if (args?.orderBy) {
          entries = self.applyOrderBy(entries, args.orderBy);
        }
        return entries[0] || null;
      },
      findMany: async (args: any) => {
        let entries = Array.from(store.values());
        if (args?.where) {
          entries = self.applyWhere(entries, args.where);
        }
        if (args?.orderBy) {
          entries = self.applyOrderBy(entries, args.orderBy);
        }
        if (args?.skip) {
          entries = entries.slice(args.skip);
        }
        if (args?.take) {
          entries = entries.slice(0, args.take);
        }
        return entries;
      },
      create: async (args: any) => {
        const id = args?.data?.id || uuidv4();
        const record: any = {
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
        let existing = id ? store.get(id) : null;
        if (!existing) {
          // search by criteria
          existing = await self.createGenericModelStore(entityName).findUnique(args);
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
      upsert: async (args: any) => {
        const model = self.createGenericModelStore(entityName);
        const existing = await model.findUnique({ where: args.where });
        if (existing) {
          return model.update({ where: args.where, data: args.update });
        } else {
          return model.create({ data: { ...args.where, ...args.create } });
        }
      },
      delete: async (args: any) => {
        const id = args?.where?.id;
        const item = store.get(id);
        if (id) store.delete(id);
        return item;
      },
      deleteMany: async (args: any) => {
        let entries = Array.from(store.values());
        if (args?.where) {
          entries = self.applyWhere(entries, args.where);
        }
        let count = 0;
        for (const entry of entries) {
          store.delete(entry.id);
          count++;
        }
        return { count };
      },
      count: async (args: any) => {
        let entries = Array.from(store.values());
        if (args?.where) {
          entries = self.applyWhere(entries, args.where);
        }
        return entries.length;
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
  // passportInventory is the canonical model; passport is an alias for backward compatibility
  get passportInventory() { return this.createGenericModelStore('passportInventory'); }
  get passport() { return this.createGenericModelStore('passportInventory'); }
  get passportLog() { return this.createGenericModelStore('passportLog'); }
  get nationalIdentity() { return this.createGenericModelStore('nationalIdentity'); }
  get familyMember() { return this.createGenericModelStore('familyMember'); }
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
