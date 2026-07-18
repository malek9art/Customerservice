import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PackageEngineService } from '../package-engine/package-engine.service';
import { StorageService } from '../storage/storage.service';
import { WorkflowService } from '../workflows/workflows.service';
import { NotificationService } from '../notifications/notification.service';
import { PilgrimCardPdfGenerator } from './helpers/pilgrim-card-pdf.generator';

export interface RoomAllocationOptions {
  maxRoomCapacity?: number; // e.g. 4 (QUAD), 3 (TRIPLE), 2 (DOUBLE), 1 (SINGLE)
  groupFamilies?: boolean;
  separateByGender?: boolean;
  prioritySpecialNeeds?: boolean;
}

export interface BusAllocationOptions {
  busCapacity?: number; // e.g. 45 or 50 seats
  keepBookingsTogether?: boolean;
  supervisors?: string[]; // Employee IDs
}

@Injectable()
export class PilgrimageService {
  private readonly logger = new Logger(PilgrimageService.name);

  constructor(
    private prisma: PrismaService,
    private packageEngine: PackageEngineService,
    private storage: StorageService,
    private workflow: WorkflowService,
    private notifications: NotificationService,
  ) {}

  async createPilgrimageBooking(
    companyId: string,
    customerId: string,
    packageId: string,
    pilgrimsData: any[],
  ) {
    // 1. Check & Sync Capacity via Package Engine
    await this.packageEngine.updateAvailability(packageId, pilgrimsData.length);
    const pkg = await this.packageEngine.getPackageDetails(packageId);

    if (!pkg) {
      throw new NotFoundException(`Package ${packageId} not found`);
    }

    // 2. Calculate Pricing
    const unitPrice = typeof pkg.basePrice === 'number'
      ? pkg.basePrice
      : (pkg.basePrice?.toNumber ? pkg.basePrice.toNumber() : Number(pkg.basePrice) || 0);

    const totalAmount = unitPrice * pilgrimsData.length;

    // 3. Create Booking
    const booking = await (this.prisma as any).pilgrimageBooking.create({
      data: {
        packageId,
        customerId,
        totalAmount,
        status: 'CONFIRMED',
      },
    });

    // 4. Register Pilgrims
    const pilgrims = await Promise.all(
      pilgrimsData.map((data) =>
        (this.prisma as any).pilgrim.create({
          data: {
            ...data,
            bookingId: booking.id,
            packageId,
            customerId: data.customerId || customerId,
          },
        }),
      ),
    );

    // 5. Trigger Workflow for Pilgrimage Booking
    await this.workflow.trigger('pilgrimage.booking_created', {
      bookingId: booking.id,
      companyId,
      customerId,
      packageId,
      packageType: pkg.type,
      pilgrimCount: pilgrims.length,
      amount: totalAmount,
    });

    // 6. Real-time sync
    await this.syncPackageCapacity(companyId, packageId);

    return { booking, pilgrims };
  }

  /**
   * Real Room Allocation Algorithm based on family grouping, gender separation, and priority special needs.
   */
  async allocateRooms(
    companyId: string,
    packageId: string,
    options: RoomAllocationOptions = {},
  ) {
    const maxCapacity = options.maxRoomCapacity || 4; // Default QUAD
    const groupFamilies = options.groupFamilies !== false;
    const separateByGender = options.separateByGender !== false;
    const prioritySpecialNeeds = options.prioritySpecialNeeds !== false;

    const pilgrims = await (this.prisma as any).pilgrim.findMany({
      where: { packageId },
    });

    if (!pilgrims || pilgrims.length === 0) {
      return { summary: { totalPilgrims: 0, totalRooms: 0 }, rooms: [] };
    }

    // Sort pilgrims: priority special needs first
    let pool = [...pilgrims];
    if (prioritySpecialNeeds) {
      pool.sort((a, b) => {
        const aHasMed = a.medicalInfo ? 1 : 0;
        const bHasMed = b.medicalInfo ? 1 : 0;
        return bHasMed - aHasMed;
      });
    }

    const rooms: Array<{
      roomId: string;
      roomNumber: string;
      roomType: string;
      gender: 'MALE' | 'FEMALE' | 'FAMILY';
      pilgrims: any[];
    }> = [];

    let roomCounter = 101;

    const assignRoom = (pilgrimList: any[], gender: 'MALE' | 'FEMALE' | 'FAMILY') => {
      let currentIdx = 0;
      while (currentIdx < pilgrimList.length) {
        const chunk = pilgrimList.slice(currentIdx, currentIdx + maxCapacity);
        const roomNumber = `ROOM-${roomCounter++}`;
        const roomType =
          chunk.length === 1
            ? 'SINGLE'
            : chunk.length === 2
            ? 'DOUBLE'
            : chunk.length === 3
            ? 'TRIPLE'
            : 'QUAD';

        const roomObj = {
          roomId: `room-${roomCounter}`,
          roomNumber,
          roomType,
          gender,
          pilgrims: chunk,
        };

        // Update database records
        for (const p of chunk) {
          (this.prisma as any).pilgrim.update({
            where: { id: p.id },
            data: {
              roomNumber,
              roomType,
            },
          });
          p.roomNumber = roomNumber;
          p.roomType = roomType;
        }

        rooms.push(roomObj);
        currentIdx += maxCapacity;
      }
    };

    if (groupFamilies) {
      // Group by booking ID
      const bookingGroups = new Map<string, any[]>();
      for (const p of pool) {
        const list = bookingGroups.get(p.bookingId) || [];
        list.push(p);
        bookingGroups.set(p.bookingId, list);
      }

      const remainingUnattached: any[] = [];

      for (const [bookingId, familyPilgrims] of bookingGroups.entries()) {
        if (familyPilgrims.length > 1) {
          assignRoom(familyPilgrims, 'FAMILY');
        } else {
          remainingUnattached.push(familyPilgrims[0]);
        }
      }

      pool = remainingUnattached;
    }

    if (separateByGender && pool.length > 0) {
      const males = pool.filter((p) => p.gender !== 'FEMALE');
      const females = pool.filter((p) => p.gender === 'FEMALE');

      if (males.length > 0) assignRoom(males, 'MALE');
      if (females.length > 0) assignRoom(females, 'FEMALE');
    } else if (pool.length > 0) {
      assignRoom(pool, 'FAMILY');
    }

    return {
      summary: {
        totalPilgrims: pilgrims.length,
        totalRooms: rooms.length,
        maxCapacityPerRoom: maxCapacity,
        occupancyRate: Number(
          ((pilgrims.length / (rooms.length * maxCapacity)) * 100).toFixed(1),
        ),
      },
      rooms,
    };
  }

  /**
   * Real Bus Allocation Algorithm grouping pilgrims into buses without splitting booking units.
   */
  async allocateBuses(
    companyId: string,
    packageId: string,
    options: BusAllocationOptions = {},
  ) {
    const busCapacity = options.busCapacity || 45;
    const keepBookingsTogether = options.keepBookingsTogether !== false;
    const supervisors = options.supervisors || [];

    const pilgrims = await (this.prisma as any).pilgrim.findMany({
      where: { packageId },
    });

    if (!pilgrims || pilgrims.length === 0) {
      return { summary: { totalPilgrims: 0, totalBuses: 0 }, buses: [] };
    }

    // Group by booking ID if required
    let chunks: any[][] = [];
    if (keepBookingsTogether) {
      const bookingMap = new Map<string, any[]>();
      for (const p of pilgrims) {
        const list = bookingMap.get(p.bookingId) || [];
        list.push(p);
        bookingMap.set(p.bookingId, list);
      }

      let currentBus: any[] = [];
      for (const group of bookingMap.values()) {
        if (currentBus.length + group.length <= busCapacity) {
          currentBus.push(...group);
        } else {
          if (currentBus.length > 0) chunks.push(currentBus);
          currentBus = [...group];
        }
      }
      if (currentBus.length > 0) chunks.push(currentBus);
    } else {
      for (let i = 0; i < pilgrims.length; i += busCapacity) {
        chunks.push(pilgrims.slice(i, i + busCapacity));
      }
    }

    const busGroups: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const busNumber = `BUS-${101 + i}`;
      const groupName = `Bus Group ${i + 1}`;
      const supervisorId = supervisors[i % Math.max(1, supervisors.length)] || null;

      // Create or update PilgrimageGroup
      const groupRecord = await (this.prisma as any).pilgrimageGroup.create({
        data: {
          packageId,
          name: groupName,
          busNumber,
          capacity: busCapacity,
          supervisorId,
        },
      });

      const passengers = chunks[i];
      let seatNum = 1;

      for (const pilgrim of passengers) {
        await (this.prisma as any).pilgrim.update({
          where: { id: pilgrim.id },
          data: {
            groupId: groupRecord.id,
          },
        });
        pilgrim.groupId = groupRecord.id;
        pilgrim.busNumber = busNumber;
        pilgrim.seatNumber = seatNum++;
      }

      busGroups.push({
        group: groupRecord,
        busNumber,
        passengerCount: passengers.length,
        availableSeats: busCapacity - passengers.length,
        supervisorId,
        roster: passengers,
      });
    }

    return {
      summary: {
        totalPilgrims: pilgrims.length,
        totalBuses: busGroups.length,
        busCapacity,
        capacityUtilization: Number(
          ((pilgrims.length / (busGroups.length * busCapacity)) * 100).toFixed(1),
        ),
      },
      buses: busGroups,
    };
  }

  /**
   * Real-time package capacity synchronization.
   */
  async syncPackageCapacity(companyId: string, packageId: string) {
    const pkg = await (this.prisma as any).package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException(`Package ${packageId} not found`);
    }

    const totalPilgrims = await (this.prisma as any).pilgrim.count({
      where: { packageId },
    });

    const remainingSlots = Math.max(0, pkg.capacity - totalPilgrims);

    const updatedPkg = await (this.prisma as any).package.update({
      where: { id: packageId },
      data: { remainingSlots },
    });

    this.logger.log(
      `Synced package ${packageId}: capacity=${pkg.capacity}, booked=${totalPilgrims}, remaining=${remainingSlots}`,
    );

    return {
      packageId,
      capacity: pkg.capacity,
      bookedSlots: totalPilgrims,
      remainingSlots,
      isAvailable: remainingSlots > 0,
      updatedAt: updatedPkg.updatedAt || new Date(),
    };
  }

  /**
   * Automated Pilgrim Digital Card Generation (PDF).
   */
  async generatePilgrimCard(companyId: string, pilgrimId: string) {
    const pilgrim = await (this.prisma as any).pilgrim.findUnique({
      where: { id: pilgrimId },
    });

    if (!pilgrim) {
      throw new NotFoundException(`Pilgrim ${pilgrimId} not found`);
    }

    const customer = await (this.prisma as any).customer.findUnique({
      where: { id: pilgrim.customerId },
    });

    const pkg = await (this.prisma as any).package.findUnique({
      where: { id: pilgrim.packageId },
    });

    const company = await (this.prisma as any).company.findUnique({
      where: { id: companyId },
    });

    let group: any = null;
    if (pilgrim.groupId) {
      group = await (this.prisma as any).pilgrimageGroup.findUnique({
        where: { id: pilgrim.groupId },
      });
    }

    const cardPdfBuffer = PilgrimCardPdfGenerator.generateCardPdfBuffer({
      pilgrimId: pilgrim.id,
      fullName: customer?.fullName || 'Pilgrim Visitor',
      passportNumber: pilgrim.passportNumber || 'A0000000',
      nationality: customer?.nationality || 'SA',
      packageName: pkg?.name || 'Standard Hajj & Umrah Package',
      season: pkg?.season || '1447H',
      groupName: group?.name,
      busNumber: group?.busNumber || pilgrim.busNumber,
      seatNumber: pilgrim.seatNumber,
      hotelName: pkg?.hotels?.[0]?.name || 'Makkah Royal Hotel',
      roomNumber: pilgrim.roomNumber,
      roomType: pilgrim.roomType,
      minaCamp: pilgrim.minaCamp || 'Mina Camp Zone A',
      arafatCamp: pilgrim.arafatCamp || 'Arafat Zone 4',
      emergencyContact: pilgrim.emergencyContact || customer?.phone || '+966 50 000 0000',
      medicalInfo: pilgrim.medicalInfo || 'None',
      agencyName: company?.name || 'TravelOS AI Agency',
    });

    // Upload to S3 storage via StorageService
    const fileName = `pilgrim-card-${pilgrim.id}.pdf`;
    const uploadResult = await this.storage.uploadFile(
      companyId,
      cardPdfBuffer,
      fileName,
      'application/pdf',
      false, // public digital card URL
    );

    // Update pilgrim record
    await (this.prisma as any).pilgrim.update({
      where: { id: pilgrimId },
      data: {
        digitalCardUrl: uploadResult.url,
      },
    });

    return {
      pilgrimId,
      cardUrl: uploadResult.url,
      documentId: uploadResult.id,
      generatedAt: new Date(),
    };
  }

  async allocateToGroup(pilgrimId: string, groupId: string) {
    return (this.prisma as any).pilgrim.update({
      where: { id: pilgrimId },
      data: { groupId },
    });
  }

  async getOperationsDashboard(companyId: string, type: string) {
    const packages = await (this.prisma as any).package.findMany({
      where: { companyId },
    });

    const pilgrims = await (this.prisma as any).pilgrim.findMany({});

    return {
      activePackagesCount: packages.length,
      totalPilgrims: pilgrims.length,
      allocatedRooms: pilgrims.filter((p) => p.roomNumber).length,
      allocatedBuses: pilgrims.filter((p) => p.groupId).length,
      cardsGenerated: pilgrims.filter((p) => p.digitalCardUrl).length,
      packages,
    };
  }
}
