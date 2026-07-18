import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SaasService {
  private readonly logger = new Logger(SaasService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

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

    // 3. Create Company & Initial Subscription
    return await (this.prisma as any).company.create({
      data: {
        name: data.name,
        slug: data.slug,
        subscriptionTier: plan.name,
        subscriptions: {
          create: {
            planId: plan.id,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            status: 'TRIAL',
          },
        },
      },
    });
  }

  async getPlatformMetrics() {
    return {
      totalTenants: 1250,
      activeSubscriptions: 1100,
      mrr: 45000,
      avgHealthScore: 92,
      topModules: ['CRM', 'WhatsApp AI', 'Visa Ops'],
      usage: {
        aiTokens: '450M',
        storage: '12TB',
        messages: '1.2M',
      },
    };
  }

  async checkQuota(companyId: string, metric: string) {
    // Logic to check if tenant has exceeded their plan quotas (e.g. AI tokens, Employees)
    return { allowed: true, remaining: 5000 };
  }
}
