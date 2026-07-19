import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SaasService {
  private readonly logger = new Logger(SaasService.name);

  constructor(private prisma: PrismaService) {}

  async onBoardTenant(data: {
    name: string;
    slug: string;
    adminEmail: string;
    planSlug: string;
  }) {
    this.logger.log(`Provisioning new tenant: ${data.slug}`);

    // 1. Check if slug exists
    const existing = await (this.prisma as any).company.findUnique({
      where: { slug: data.slug },
    });
    if (existing) throw new BadRequestException('Tenant slug already taken');

    // 2. Get Plan
    const plan = await (this.prisma as any).subscriptionPlan.findUnique({
      where: { slug: data.planSlug },
    });
    if (!plan) throw new BadRequestException('Invalid subscription plan');

    // 3. Create Company, initial subscription, and administrator.
    const company = await (this.prisma as any).company.create({
      data: {
        name: data.name,
        slug: data.slug,
        subscriptionTier: plan.name,
        status: 'ACTIVE',
        settings: {},
      },
    });
    const subscription = await (this.prisma as any).subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'TRIAL',
      },
    });
    const administrator = await (this.prisma as any).employee.create({
      data: {
        companyId: company.id,
        userId: data.adminEmail,
        email: data.adminEmail,
        fullName: `${data.name} Administrator`,
        role: 'ADMIN',
        permissions: ['*'],
        isActive: true,
      },
    });
    return { company, subscription, administrator };
  }

  async getPlatformMetrics() {
    const [companies, subscriptions, employees, documents, messages] =
      await Promise.all([
        (this.prisma as any).company.findMany({}),
        (this.prisma as any).subscription.findMany({}),
        (this.prisma as any).employee.findMany({}),
        (this.prisma as any).document.findMany({}),
        (this.prisma as any).chatMessage.findMany({}),
      ]);
    return {
      totalTenants: companies.length,
      activeSubscriptions: subscriptions.filter((item: any) =>
        ['ACTIVE', 'TRIAL'].includes(item.status),
      ).length,
      activeEmployees: employees.filter((item: any) => item.isActive).length,
      usage: {
        documents: documents.length,
        messages: messages.length,
      },
    };
  }

  async checkQuota(companyId: string, metric: string) {
    const company = await (this.prisma as any).company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new BadRequestException('Invalid tenant');
    const usage = this.prisma.getMemoryStoreStats();
    return {
      allowed: company.status === 'ACTIVE',
      metric,
      used: usage[metric] ?? 0,
      limit: null,
    };
  }
}
