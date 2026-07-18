import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit {
  // Mocking Prisma methods because the binary cannot be downloaded in this environment
  company = {
    findUnique: async (args: any) => ({
      id: args.where.id || 'comp-id',
      name: 'Mock Company',
      slug: args.where.slug,
    }),
    create: async (args: any) => ({ id: 'new-comp-id', ...args.data }),
  };
  subscriptionPlan = {
    findUnique: async (args: any) => ({
      id: 'plan-id',
      slug: args.where.slug,
      name: 'Premium',
    }),
  };
  subscription = {
    create: async (args: any) => ({ id: 'sub-id', ...args.data }),
  };
  businessRule = {
    findMany: async (args: any) => [],
  };
  customer = {
    findUnique: async (args: any) => ({
      id: 'mock-id',
      companyId: 'mock-company',
      fullName: 'John Doe',
      phone: '123456789',
      interests: ['Hajj', 'Luxury Travel'],
      passports: [],
      identities: [],
      familyMembers: [],
      bookings: [],
      visas: [],
      transactions: [],
      documents: [],
      activityLogs: [],
    }),
    findMany: async (args: any) => [],
    create: async (args: any) => ({ id: 'new-id', ...args.data }),
  };
  passport = {
    create: async (args: any) => ({ id: 'pass-id', ...args.data }),
  };
  passportInventory = {
    create: async (args: any) => ({ id: 'pass-id', ...args.data }),
    findUnique: async (args: any) => ({
      id: args.where.id,
      status: 'RECEIVED_BY_AGENCY',
    }),
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
    findMany: async (args: any) => [],
  };
  passportLog = {
    create: async (args: any) => ({ id: 'log-id', ...args.data }),
  };

  flightBooking = {
    create: async (args: any) => ({ id: 'f-book-id', ...args.data }),
    findUnique: async (args: any) => ({
      id: 'f-book-id',
      status: 'PNR_CREATED',
    }),
    findMany: async (args: any) => [],
  };
  hotelBooking = {
    create: async (args: any) => ({ id: 'h-book-id', ...args.data }),
    findUnique: async (args: any) => ({ id: 'h-book-id', status: 'CONFIRMED' }),
    findMany: async (args: any) => [],
  };
  package = {
    create: async (args: any) => ({
      id: 'pkg-id',
      basePrice: { mul: (n: number) => n * 1000 },
      ...args.data,
    }),
    findUnique: async (args: any) => ({
      id: args.where.id,
      remainingSlots: 100,
      basePrice: { mul: (n: number) => n * 1000 },
      type: 'HAJJ',
      name: 'Standard Hajj',
    }),
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
  };
  pilgrimageBooking = {
    create: async (args: any) => ({ id: 'p-book-id', ...args.data }),
  };
  pilgrim = {
    create: async (args: any) => ({ id: 'pilgrim-id', ...args.data }),
    update: async (args: any) => ({ id: 'pilgrim-id', ...args.data }),
  };
  account = {
    findUnique: async (args: any) => ({
      id: 'acc-id',
      ...args.where.companyId_code,
      balance: 0,
    }),
    create: async (args: any) => ({ id: 'acc-id', ...args.data }),
    update: async (args: any) => ({ id: 'acc-id', ...args.data }),
  };
  journal = {
    create: async (args: any) => ({ id: 'j-id', ...args.data }),
  };
  journalEntry = {
    create: async (args: any) => ({ id: 'je-id', ...args.data }),
  };
  invoice = {
    create: async (args: any) => ({ id: 'inv-id', ...args.data }),
  };
  payment = {
    create: async (args: any) => ({ id: 'pay-id', ...args.data }),
  };
  chatSession = {
    findFirst: async (args: any) => null,
    create: async (args: any) => ({ id: 'session-id', ...args.data }),
  };
  chatMessage = {
    create: async (args: any) => ({ id: 'msg-id', ...args.data }),
  };
  aiActionLog = {
    create: async (args: any) => ({ id: 'ai-log-id', ...args.data }),
  };
  report = {
    findMany: async (args: any) => [],
    create: async (args: any) => ({ id: 'rep-id', ...args.data }),
  };
  analyticsSnapshot = {
    findMany: async (args: any) => [],
    create: async (args: any) => ({ id: 'snap-id', ...args.data }),
  };
  async onModuleInit() {
    console.log('Prisma Mock initialized');
  }

  async enableShutdownHooks(app: INestApplication) {}
}
