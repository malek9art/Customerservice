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

  @OnEvent('hotel.booking_created')
  async handleHotelBooking(payload: any) {
    await this.postingEngine.postEvent(
      payload.companyId,
      'HOTEL_BOOKING',
      payload,
    );
  }

  @OnEvent('pilgrimage.booking_created')
  async handlePilgrimageBooking(payload: any) {
    await this.postingEngine.postEvent(
      payload.companyId,
      'PILGRIMAGE_BOOKING',
      payload,
    );
  }

  @OnEvent('visa.application_submitted')
  async handleVisaApplication(payload: any) {
    await this.postingEngine.postEvent(
      payload.companyId,
      'VISA_APPLICATION',
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

  @OnEvent('refund.processed')
  async handleRefundProcessed(payload: any) {
    await this.postingEngine.postEvent(
      payload.companyId,
      'REFUND_PROCESSED',
      payload,
    );
  }

  async createInvoice(companyId: string, data: any) {
    const invoice = await (this.prisma as any).invoice.create({
      data: {
        ...data,
        companyId,
        number: data.number || `INV-${Date.now()}`,
      },
    });
    return invoice;
  }

  async getDashboard(companyId: string) {
    const accounts = await (this.prisma as any).account.findMany({
      where: { companyId },
    });

    const journals = await (this.prisma as any).journal.findMany({
      where: { companyId },
    });

    const invoices = await (this.prisma as any).invoice.findMany({
      where: { companyId },
    });

    const revenue = accounts
      .filter((a) => a.type === 'REVENUE')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    const receivables = accounts
      .filter((a) => a.code === '1200')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    const cashOnHand = accounts
      .filter((a) => a.code === '1010')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    const payables = accounts
      .filter((a) => a.type === 'LIABILITY')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    return {
      revenue,
      receivables,
      payables,
      cashOnHand,
      totalInvoices: invoices.length,
      totalJournals: journals.length,
      recentTransactions: journals.slice(-10),
    };
  }
}
