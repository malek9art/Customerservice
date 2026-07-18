import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    private prisma: PrismaService,
    private postingEngine: AccountingPostingEngine,
  ) {}

  @OnEvent('flight.booking_created')
  async handleFlightBooking(payload: any) {
    await this.postingEngine.postEvent(
      payload.companyId,
      'FLIGHT_BOOKING',
      payload,
    );
  }

  @OnEvent('payment.received')
  async handlePaymentReceived(payload: any) {
    await this.postingEngine.postEvent(
      payload.companyId,
      'PAYMENT_RECEIVED',
      payload,
    );
  }

  async createInvoice(companyId: string, data: any) {
    const invoice = await (this.prisma as any).invoice.create({
      data: {
        ...data,
        companyId,
        number: `INV-${Date.now()}`,
      },
    });
    return invoice;
  }

  async getDashboard(companyId: string) {
    return {
      revenue: 0,
      receivables: 0,
      payables: 0,
      cashOnHand: 0,
      recentTransactions: [],
    };
  }
}
