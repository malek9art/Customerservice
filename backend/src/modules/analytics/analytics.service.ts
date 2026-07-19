import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService, private ai: AiOrchestrator) {}

  async getExecutiveDashboard(companyId: string) {
    const [customers, flights, hotels, passports, packages, invoices, payments, visas, pilgrimageBookings, pilgrims] = await Promise.all([
      (this.prisma as any).customer.findMany({ where: { companyId } }),
      (this.prisma as any).flightBooking.findMany({ where: { companyId } }),
      (this.prisma as any).hotelBooking.findMany({ where: { companyId } }),
      (this.prisma as any).passportInventory.findMany({ where: { companyId } }),
      (this.prisma as any).package.findMany({ where: { companyId } }),
      (this.prisma as any).invoice.findMany({ where: { companyId } }),
      (this.prisma as any).payment.findMany({ where: { companyId } }),
      (this.prisma as any).visaRecord.findMany({}),
      (this.prisma as any).pilgrimageBooking.findMany({}),
      (this.prisma as any).pilgrim.findMany({}),
    ]);
    const customerIds = new Set(customers.map((c: any) => c.id));
    const companyVisas = visas.filter((v: any) => customerIds.has(v.customerId));
    const companyPilgrimage = pilgrimageBookings.filter((b: any) => customerIds.has(b.customerId));
    const companyPilgrims = pilgrims.filter((p: any) => customerIds.has(p.customerId));
    const revenue = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const paid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const cancellations = [...flights, ...hotels, ...companyPilgrimage].filter((b: any) => b.status === 'CANCELLED').length;
    const spending = new Map<string, number>();
    invoices.forEach((i: any) => spending.set(i.customerId, (spending.get(i.customerId) || 0) + Number(i.amount)));
    const topCustomers = customers.map((c: any) => ({ id: c.id, name: c.fullName, revenue: spending.get(c.id) || 0 })).sort((a: any,b: any) => b.revenue-a.revenue).slice(0,5);
    const destinations = new Map<string, number>();
    flights.forEach((b: any) => { const s=b.segments?.[0]?.segments?.[0]; const d=typeof s?.arrival==='object'?s.arrival.iataCode:s?.arrival; if(d) destinations.set(d,(destinations.get(d)||0)+1); });
    const topPackages = packages.map((p: any) => ({ id:p.id,name:p.name,booked:p.capacity-p.remainingSlots })).sort((a:any,b:any)=>b.booked-a.booked).slice(0,5);
    const capacity = packages.reduce((s:number,p:any)=>s+p.capacity,0); const booked=packages.reduce((s:number,p:any)=>s+(p.capacity-p.remainingSlots),0);
    return {
      counts: { customers: customers.length, flights: flights.length, hotels: hotels.length, visas: companyVisas.length, passports: passports.length, packages: packages.length, pilgrimageBookings: companyPilgrimage.length, pilgrims: companyPilgrims.length, bookings: flights.length + hotels.length + companyPilgrimage.length },
      finance: { revenue, paid, outstanding: revenue-paid }, cancellations,
      occupancyRate: capacity ? Number(((booked/capacity)*100).toFixed(1)) : 0,
      topCustomers, topDestinations: [...destinations].map(([destination,count])=>({destination,count})).sort((a,b)=>b.count-a.count).slice(0,5), topPackages,
      charts: { bookings: [{ label:'Flights',value:flights.length},{label:'Hotels',value:hotels.length},{label:'Hajj & Umrah',value:companyPilgrimage.length}], finance:[{label:'Paid',value:paid},{label:'Outstanding',value:revenue-paid}] },
    };
  }

  async askCopilot(companyId: string, question: string) { const stats=await this.getExecutiveDashboard(companyId); const analysis=await this.ai.process(`Analyze these live ERP metrics: ${JSON.stringify(stats)}. Question: ${question}`,{companyId,task:'COPILOT_ANALYSIS'}); return { answer:analysis.response, metrics:stats }; }
  async generateReport(companyId:string,type:string,format:string) { const data=await this.getExecutiveDashboard(companyId); return { type,format,generatedAt:new Date(),data }; }
}
