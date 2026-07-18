import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PackageEngineService } from '../package-engine/package-engine.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { WorkflowService } from '../workflows/workflows.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class PilgrimageService {
  private readonly logger = new Logger(PilgrimageService.name);

  constructor(
    private prisma: PrismaService,
    private packageEngine: PackageEngineService,
    private ai: AiOrchestrator,
    private workflow: WorkflowService,
    private notifications: NotificationService,
  ) {}

  async createPilgrimageBooking(
    companyId: string,
    customerId: string,
    packageId: string,
    pilgrimsData: any[],
  ) {
    // 1. Check Capacity via Package Engine
    await this.packageEngine.updateAvailability(packageId, pilgrimsData.length);

    const pkg = await this.packageEngine.getPackageDetails(packageId);

    // 2. Create Booking
    const booking = await (this.prisma as any).pilgrimageBooking.create({
      data: {
        packageId,
        customerId,
        totalAmount: pkg.basePrice.mul(pilgrimsData.length),
        status: 'CONFIRMED',
      },
    });

    // 3. Register Pilgrims
    const pilgrims = await Promise.all(
      pilgrimsData.map((data) =>
        (this.prisma as any).pilgrim.create({
          data: {
            ...data,
            bookingId: booking.id,
            packageId,
            customerId,
          },
        }),
      ),
    );

    // 4. AI Recommendation for itinerary
    const aiRec = await this.ai.process(
      `Generate a customized religious schedule for ${pkg.type} package: ${pkg.name}`,
      { companyId, task: 'PILGRIMAGE_SCHEDULE' },
    );

    await this.workflow.trigger('pilgrimage.booking_created', {
      bookingId: booking.id,
      packageType: pkg.type,
    });

    return { booking, pilgrims, aiSchedule: aiRec.response };
  }

  async allocateToGroup(pilgrimId: string, groupId: string) {
    return (this.prisma as any).pilgrim.update({
      where: { id: pilgrimId },
      data: { groupId },
    });
  }

  async getOperationsDashboard(companyId: string, type: string) {
    // Dashboard data for Hajj/Umrah
    return {
      activePackages: [],
      totalPilgrims: 0,
      visaStatus: {},
      transportationStatus: {},
    };
  }
}
