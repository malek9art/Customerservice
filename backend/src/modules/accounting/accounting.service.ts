import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma.service';
import { CreateInvoiceDto, RecordPaymentDto } from './dto/accounting.dto';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService, private postingEngine: AccountingPostingEngine) {}

  @OnEvent('flight.booking_created') handleFlight(payload: any) { return this.createServiceInvoice(payload, 'FLIGHT', 'Flight booking'); }
  @OnEvent('hotel.booking_created') handleHotel(payload: any) { return this.createServiceInvoice(payload, 'HOTEL', 'Hotel booking'); }
  @OnEvent('pilgrimage.booking_created') handlePilgrimage(payload: any) { return this.createServiceInvoice(payload, 'PILGRIMAGE', 'Hajj/Umrah booking'); }
  @OnEvent('visa.application_created') handleVisa(payload: any) { return this.createServiceInvoice(payload, 'VISA', 'Visa application'); }

  async createInvoice(companyId: string, data: CreateInvoiceDto) {
    const customer = await (this.prisma as any).customer.findUnique({ where: { id: data.customerId } });
    if (!customer || customer.companyId !== companyId) throw new NotFoundException('Customer not found');
    if (data.sourceId) {
      const existing = await (this.prisma as any).invoice.findFirst({ where: { companyId, sourceId: data.sourceId } });
      if (existing) return this.enrichInvoice(existing);
    }
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = data.discount || 0;
    if (discount > subtotal) throw new BadRequestException('Discount cannot exceed invoice subtotal');
    const taxable = subtotal - discount;
    const taxAmount = taxable * ((data.taxRate || 0) / 100);
    const total = taxable + taxAmount;
    const invoice = await (this.prisma as any).invoice.create({ data: {
      companyId, customerId: data.customerId, number: `INV-${nanoid(10).toUpperCase()}`,
      subtotal, discount, taxRate: data.taxRate || 0, taxAmount, amount: total,
      paidAmount: 0, balance: total, currency: data.currency || 'USD', status: 'UNPAID',
      dueDate: data.dueDate ? new Date(data.dueDate) : null, items: data.items,
      sourceType: data.sourceType, sourceId: data.sourceId,
    }});
    await this.postingEngine.postEvent(companyId, this.eventType(data.sourceType), {
      id: invoice.id, customerId: data.customerId, amount: total,
      description: `Invoice ${invoice.number} revenue recognition`,
    });
    await this.activity(data.customerId, 'INVOICE_CREATED', `Invoice ${invoice.number} created for ${total} ${invoice.currency}`);
    return this.enrichInvoice(invoice);
  }

  async recordPayment(companyId: string, invoiceId: string, data: RecordPaymentDto) {
    const invoice = await this.ownedInvoice(companyId, invoiceId);
    const balance = Number(invoice.balance ?? invoice.amount - (invoice.paidAmount || 0));
    if (invoice.status === 'PAID' || balance <= 0) throw new BadRequestException('Invoice is already paid');
    if (data.amount > balance) throw new BadRequestException('Payment cannot exceed invoice balance');
    const payment = await (this.prisma as any).payment.create({ data: {
      companyId, invoiceId, customerId: invoice.customerId, amount: data.amount,
      method: data.method, transactionId: data.transactionId, notes: data.notes,
      status: 'COMPLETED',
    }});
    const paidAmount = Number(invoice.paidAmount || 0) + data.amount;
    const remaining = Number(invoice.amount) - paidAmount;
    const updated = await (this.prisma as any).invoice.update({ where: { id: invoiceId }, data: {
      paidAmount, balance: remaining, status: remaining === 0 ? 'PAID' : 'PARTIAL',
    }});
    await this.postingEngine.postEvent(companyId, 'PAYMENT_RECEIVED', {
      id: payment.id, customerId: invoice.customerId, amount: data.amount,
      description: `Payment for invoice ${invoice.number}`,
    });
    await this.activity(invoice.customerId, 'PAYMENT_RECEIVED', `${data.method} payment ${data.amount} received for ${invoice.number}`);
    return { payment, invoice: await this.enrichInvoice(updated) };
  }

  async listCustomerInvoices(companyId: string, customerId: string) {
    await this.assertCustomer(companyId, customerId);
    const invoices = await (this.prisma as any).invoice.findMany({ where: { companyId, customerId }, orderBy: { createdAt: 'desc' } });
    return Promise.all(invoices.map((invoice: any) => this.enrichInvoice(invoice)));
  }

  async customerStatement(companyId: string, customerId: string) {
    const invoices = await this.listCustomerInvoices(companyId, customerId);
    const payments = await (this.prisma as any).payment.findMany({ where: { companyId, customerId }, orderBy: { createdAt: 'desc' } });
    return { customerId, invoices, payments, total: invoices.reduce((s: number, i: any) => s + Number(i.amount), 0), paid: payments.reduce((s: number, p: any) => s + Number(p.amount), 0), outstanding: invoices.reduce((s: number, i: any) => s + Number(i.balance), 0) };
  }

  async ledger(companyId: string) {
    const journals = await (this.prisma as any).journal.findMany({ where: { companyId }, orderBy: { date: 'desc' } });
    return Promise.all(journals.map(async (journal: any) => ({ ...journal, entries: await (this.prisma as any).journalEntry.findMany({ where: { journalId: journal.id } }) })));
  }

  async getDashboard(companyId: string) {
    const [invoices, payments, journals] = await Promise.all([
      (this.prisma as any).invoice.findMany({ where: { companyId } }),
      (this.prisma as any).payment.findMany({ where: { companyId, status: 'COMPLETED' } }),
      (this.prisma as any).journal.findMany({ where: { companyId } }),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const revenue = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const paid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    return {
      revenue, paid, outstanding: revenue - paid,
      unpaid: invoices.filter((i: any) => i.status === 'UNPAID').length,
      partial: invoices.filter((i: any) => i.status === 'PARTIAL').length,
      paidInvoices: invoices.filter((i: any) => i.status === 'PAID').length,
      invoicesToday: invoices.filter((i: any) => new Date(i.createdAt).toISOString().slice(0, 10) === today).length,
      paymentsToday: payments.filter((p: any) => new Date(p.createdAt).toISOString().slice(0, 10) === today).length,
      totalInvoices: invoices.length, totalJournals: journals.length,
    };
  }

  private async createServiceInvoice(payload: any, sourceType: string, label: string) {
    if (!payload.companyId || !payload.customerId || !(Number(payload.amount) > 0)) return null;
    return this.createInvoice(payload.companyId, {
      customerId: payload.customerId,
      items: [{ description: label, quantity: 1, unitPrice: Number(payload.amount), serviceType: sourceType, serviceId: payload.bookingId || payload.id }],
      taxRate: 0, discount: 0, currency: payload.currency || 'USD', sourceType,
      sourceId: payload.bookingId || payload.id,
    });
  }
  private eventType(type?: string) { return type === 'FLIGHT' ? 'FLIGHT_BOOKING' : type === 'HOTEL' ? 'HOTEL_BOOKING' : type === 'PILGRIMAGE' ? 'PILGRIMAGE_BOOKING' : type === 'VISA' ? 'VISA_APPLICATION' : 'STANDARD_INVOICE'; }
  private async enrichInvoice(invoice: any) { const payments = await (this.prisma as any).payment.findMany({ where: { invoiceId: invoice.id } }); return { ...invoice, payments }; }
  private async ownedInvoice(companyId: string, id: string) { const invoice = await (this.prisma as any).invoice.findUnique({ where: { id } }); if (!invoice || invoice.companyId !== companyId) throw new NotFoundException('Invoice not found'); return invoice; }
  private async assertCustomer(companyId: string, id: string) { const c = await (this.prisma as any).customer.findUnique({ where: { id } }); if (!c || c.companyId !== companyId) throw new NotFoundException('Customer not found'); }
  private activity(customerId: string, action: string, description: string) { return (this.prisma as any).activityLog.create({ data: { customerId, action, description } }); }
}
