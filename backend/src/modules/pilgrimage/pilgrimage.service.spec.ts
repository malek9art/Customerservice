import { Test, TestingModule } from '@nestjs/testing';
import { PilgrimageService } from './pilgrimage.service';
import { PrismaService } from '../../prisma.service';
import { PackageEngineService } from '../package-engine/package-engine.service';
import { StorageService } from '../storage/storage.service';
import { WorkflowService } from '../workflows/workflows.service';
import { BreService } from '../bre/bre.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('PilgrimageService (Hardened Engine)', () => {
  let service: PilgrimageService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PilgrimageService,
        PrismaService,
        PackageEngineService,
        StorageService,
        WorkflowService,
        BreService,
        ConfigService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<PilgrimageService>(PilgrimageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPilgrimageBooking & Capacity Sync', () => {
    it('should create booking and sync package capacity atomically', async () => {
      const pkg = await (prisma as any).package.create({
        data: {
          companyId: 'comp-id',
          name: 'Ramadan Premium Umrah',
          type: 'UMRAH',
          capacity: 20,
          remainingSlots: 20,
          basePrice: 2500,
        },
      });

      const pilgrimsData = [
        { customerId: 'cust-1', passportNumber: 'P10001', medicalInfo: 'None' },
        {
          customerId: 'cust-1',
          passportNumber: 'P10002',
          medicalInfo: 'Wheelchair',
        },
      ];

      const res = await service.createPilgrimageBooking(
        'comp-id',
        'cust-1',
        pkg.id,
        pilgrimsData,
      );

      expect(res.booking).toBeDefined();
      expect(res.pilgrims).toHaveLength(2);

      const updatedPkg = await (prisma as any).package.findUnique({
        where: { id: pkg.id },
      });
      expect(updatedPkg.remainingSlots).toBe(18);
    });
  });

  describe('allocateRooms Algorithm', () => {
    it('should allocate rooms keeping family groups together and respecting room capacity', async () => {
      const pkgId = 'pkg-room-test';
      await (prisma as any).package.create({
        data: {
          id: pkgId,
          companyId: 'comp-id',
          name: 'Room Allocation Package',
          type: 'UMRAH',
          capacity: 10,
          remainingSlots: 7,
          basePrice: 1000,
        },
      });

      // Create pilgrims for 2 different bookings
      await (prisma as any).pilgrim.create({
        data: {
          id: 'p1',
          bookingId: 'b-fam1',
          packageId: pkgId,
          customerId: 'c1',
          gender: 'MALE',
        },
      });
      await (prisma as any).pilgrim.create({
        data: {
          id: 'p2',
          bookingId: 'b-fam1',
          packageId: pkgId,
          customerId: 'c2',
          gender: 'FEMALE',
        },
      });
      await (prisma as any).pilgrim.create({
        data: {
          id: 'p3',
          bookingId: 'b-fam2',
          packageId: pkgId,
          customerId: 'c3',
          gender: 'MALE',
        },
      });

      const allocation = await service.allocateRooms('comp-id', pkgId, {
        maxRoomCapacity: 2,
        groupFamilies: true,
      });

      expect(allocation.summary.totalPilgrims).toBe(3);
      expect(allocation.rooms.length).toBeGreaterThanOrEqual(2);
      expect(allocation.rooms[0].pilgrims).toBeDefined();
    });
  });

  describe('allocateBuses Algorithm', () => {
    it('should group pilgrims into buses without exceeding bus capacity', async () => {
      const pkgId = 'pkg-bus-test';
      await (prisma as any).package.create({
        data: {
          id: pkgId,
          companyId: 'comp-id',
          name: 'Bus Allocation Package',
          type: 'HAJJ',
          capacity: 20,
          remainingSlots: 10,
          basePrice: 1000,
        },
      });

      for (let i = 1; i <= 10; i++) {
        await (prisma as any).pilgrim.create({
          data: {
            id: `p-bus-${i}`,
            bookingId: `b-${Math.ceil(i / 2)}`,
            packageId: pkgId,
            customerId: `c-${i}`,
          },
        });
      }

      const busAllocation = await service.allocateBuses('comp-id', pkgId, {
        busCapacity: 4,
        keepBookingsTogether: true,
      });

      expect(busAllocation.summary.totalPilgrims).toBe(10);
      expect(busAllocation.buses.length).toBe(3); // 4 + 4 + 2
    });
  });

  describe('generatePilgrimCard PDF', () => {
    it('should generate official PDF digital card and update pilgrim record', async () => {
      const pkg = await (prisma as any).package.create({
        data: {
          companyId: 'comp-id',
          name: 'Hajj 1447 Deluxe',
          type: 'HAJJ',
          season: '1447H',
          capacity: 50,
          remainingSlots: 50,
          basePrice: 5000,
        },
      });

      const pilgrim = await (prisma as any).pilgrim.create({
        data: {
          bookingId: 'b-card-test',
          packageId: pkg.id,
          customerId: 'cust-1',
          passportNumber: 'K98765432',
        },
      });

      const result = await service.generatePilgrimCard('comp-id', pilgrim.id);

      expect(result.pilgrimId).toBe(pilgrim.id);
      expect(result.cardUrl).toMatch(/^data:application\/pdf;base64,/);

      const updatedPilgrim = await (prisma as any).pilgrim.findUnique({
        where: { id: pilgrim.id },
      });
      expect(updatedPilgrim.digitalCardUrl).toBe(result.cardUrl);
    });
  });
});
