import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BreService } from '../bre/bre.service';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';

@Injectable()
export class PackageEngineService {
  constructor(
    private prisma: PrismaService,
    private bre: BreService,
  ) {}

  listPackages(companyId: string) {
    return (this.prisma as any).package.findMany({
      where: { companyId },
      orderBy: { startDate: 'asc' },
    });
  }

  async createPackage(companyId: string, data: CreatePackageDto) {
    const durationDays = this.duration(data.startDate, data.endDate);
    const calculated = await this.bre.evaluate(
      companyId,
      'PACKAGE_PRICING',
      data,
    );
    return (this.prisma as any).package.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        durationDays,
        companyId,
        basePrice: calculated?.finalPrice || data.basePrice,
        remainingSlots: data.capacity,
        status: data.status || 'DRAFT',
      },
    });
  }

  async getPackageDetails(companyId: string, packageId: string) {
    const pkg = await this.owned(companyId, packageId);
    const [itinerary, groups, bookings] = await Promise.all([
      (this.prisma as any).itineraryItem.findMany({
        where: { packageId },
        orderBy: { dayNumber: 'asc' },
      }),
      (this.prisma as any).pilgrimageGroup.findMany({ where: { packageId } }),
      (this.prisma as any).pilgrimageBooking.findMany({ where: { packageId } }),
    ]);
    return {
      ...pkg,
      itinerary,
      groups,
      bookings,
      bookedSlots: pkg.capacity - pkg.remainingSlots,
    };
  }

  async updatePackage(companyId: string, id: string, data: UpdatePackageDto) {
    const pkg = await this.owned(companyId, id);
    if (pkg.status === 'CANCELLED')
      throw new BadRequestException('Cancelled package cannot be modified');
    if (!Object.values(data).some((value) => value !== undefined))
      throw new BadRequestException('At least one package change is required');
    const startDate =
      data.startDate || new Date(pkg.startDate).toISOString().slice(0, 10);
    const endDate =
      data.endDate || new Date(pkg.endDate).toISOString().slice(0, 10);
    const update: any = {
      ...data,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      durationDays: this.duration(startDate, endDate),
    };
    if (data.capacity !== undefined) {
      const booked = pkg.capacity - pkg.remainingSlots;
      if (data.capacity < booked)
        throw new BadRequestException('Capacity cannot be below booked slots');
      update.remainingSlots = data.capacity - booked;
    }
    return (this.prisma as any).package.update({ where: { id }, data: update });
  }

  async setCapacity(companyId: string, id: string, capacity: number) {
    const pkg = await this.owned(companyId, id);
    const booked = pkg.capacity - pkg.remainingSlots;
    if (capacity < booked)
      throw new BadRequestException('Capacity cannot be below booked slots');
    return (this.prisma as any).package.update({
      where: { id },
      data: { capacity, remainingSlots: capacity - booked },
    });
  }

  async updateAvailability(packageId: string, slots: number) {
    const pkg = await (this.prisma as any).package.findUnique({
      where: { id: packageId },
    });
    if (!pkg || pkg.remainingSlots < slots)
      throw new BadRequestException('Insufficient capacity');
    return (this.prisma as any).package.update({
      where: { id: packageId },
      data: { remainingSlots: { decrement: slots } },
    });
  }

  private async owned(companyId: string, id: string) {
    const pkg = await (this.prisma as any).package.findUnique({
      where: { id },
    });
    if (!pkg || pkg.companyId !== companyId)
      throw new NotFoundException('Package not found');
    return pkg;
  }

  private duration(start: string, end: string) {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
    );
    if (days < 1)
      throw new BadRequestException(
        'Package end date must be after start date',
      );
    return days;
  }
}
