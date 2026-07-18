import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BreService } from '../bre/bre.service';
import { nanoid } from 'nanoid';

@Injectable()
export class PackageEngineService {
  private readonly logger = new Logger(PackageEngineService.name);

  constructor(
    private prisma: PrismaService,
    private bre: BreService,
  ) {}

  async createPackage(companyId: string, data: any) {
    // Evaluate pricing and rules via BRE
    const calculatedPricing = await this.bre.evaluate(
      companyId,
      'PACKAGE_PRICING',
      data,
    );

    const pkg = await (this.prisma as any).package.create({
      data: {
        ...data,
        companyId,
        basePrice: calculatedPricing?.finalPrice || data.basePrice,
        remainingSlots: data.capacity,
      },
    });

    return pkg;
  }

  async getPackageDetails(packageId: string) {
    return (this.prisma as any).package.findUnique({
      where: { id: packageId },
      include: { itinerary: true, groups: true },
    });
  }

  async updateAvailability(packageId: string, slots: number) {
    const pkg = await (this.prisma as any).package.findUnique({
      where: { id: packageId },
    });
    if (pkg.remainingSlots < slots) {
      throw new BadRequestException('Insufficient capacity');
    }

    return (this.prisma as any).package.update({
      where: { id: packageId },
      data: { remainingSlots: { decrement: slots } },
    });
  }
}
