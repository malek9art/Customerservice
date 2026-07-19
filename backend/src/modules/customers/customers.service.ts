import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StorageService } from '../storage/storage.service';
import { OcrService, OcrType } from '../ocr/ocr.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';
import { AuditService } from '../audit/audit.service';
import { WorkflowService } from '../workflows/workflows.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private ocr: OcrService,
    private ai: AiOrchestrator,
    private audit: AuditService,
    private workflow: WorkflowService,
  ) {}

  async create(companyId: string, data: any) {
    // Duplicate detection
    const existing = await (this.prisma as any).customer.findUnique({
      where: { companyId_phone: { companyId, phone: data.phone } },
    });
    if (existing) {
      throw new BadRequestException('Customer with this phone already exists');
    }

    const suppliedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    const customer = await (this.prisma as any).customer.create({
      data: {
        rating: 0,
        preferences: {},
        interests: [],
        ...suppliedData,
        companyId,
      },
    });

    await this.audit.log({
      companyId,
      action: 'CUSTOMER_CREATED',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      newValues: customer,
    });

    return customer;
  }

  async getCustomer360(companyId: string, customerId: string) {
    const customer = await (this.prisma as any).customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.companyId !== companyId) {
      throw new NotFoundException('Customer not found');
    }

    const [
      passports,
      identities,
      familyMembers,
      flightBookings,
      hotelBookings,
      pilgrimageBookings,
      visas,
      transactions,
      documents,
      activityLogs,
    ] = await Promise.all([
      (this.prisma as any).passportInventory.findMany({ where: { customerId } }),
      (this.prisma as any).nationalIdentity.findMany({ where: { customerId } }),
      (this.prisma as any).familyMember.findMany({ where: { customerId } }),
      (this.prisma as any).flightBooking.findMany({ where: { customerId } }),
      (this.prisma as any).hotelBooking.findMany({ where: { customerId } }),
      (this.prisma as any).pilgrimageBooking.findMany({ where: { customerId } }),
      (this.prisma as any).visaRecord.findMany({ where: { customerId } }),
      (this.prisma as any).transaction.findMany({ where: { customerId } }),
      (this.prisma as any).document.findMany({ where: { customerId } }),
      (this.prisma as any).activityLog.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const pilgrimageBookingsWithDetails = await Promise.all(
      pilgrimageBookings.map(async (booking: any) => ({
        ...booking,
        package: await (this.prisma as any).package.findUnique({ where: { id: booking.packageId } }),
        pilgrims: await (this.prisma as any).pilgrim.findMany({ where: { bookingId: booking.id } }),
      })),
    );
    const interests = Array.isArray(customer.interests)
      ? customer.interests
      : [];
    const aiSummary = await this.ai.process(
      `Summarize travel history and profile for customer: ${customer.fullName}. Interests: ${interests.join(', ')}`,
      { companyId, customerId, task: 'CUSTOMER_SUMMARY' },
    );

    return {
      ...customer,
      interests,
      passports,
      identities,
      familyMembers,
      flightBookings,
      hotelBookings,
      pilgrimageBookings: pilgrimageBookingsWithDetails,
      visas,
      transactions,
      documents,
      activityLogs,
      aiInsights: {
        summary: aiSummary.response,
        recommendations: ['Next Umrah Season Offer', 'Visa Renewal Reminder'],
        nextBestAction: 'Renew Passport (expires in 2 months)',
      },
    };
  }

  async smartSearch(companyId: string, query: string) {
    // In production, this would use full-text search or vector search
    // Mocking a basic filter
    return (this.prisma as any).customer.findMany({
      where: {
        companyId,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query } },
        ],
      },
    });
  }

  async uploadPassport(
    companyId: string,
    customerId: string,
    file: Buffer,
    fileName: string,
  ) {
    const uploaded = await this.storage.uploadFile(
      companyId,
      file,
      fileName,
      'image/jpeg',
    );
    const ocrResult = await this.ocr.processDocument(
      uploaded.url,
      OcrType.PASSPORT,
      companyId,
    );

    const passport = await (this.prisma as any).passportInventory.create({
      data: {
        companyId,
        customerId,
        passportNumber: (ocrResult.data as any).passportNumber || 'UNKNOWN',
        status: 'RECEIVED_BY_AGENCY',
        location: 'Intake',
        receivedDate: new Date(),
      },
    });

    await this.workflow.trigger('customer.passport_uploaded', {
      customerId,
      passportId: passport.id,
    });

    return passport;
  }
}
