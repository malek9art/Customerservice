import { Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma.service';
import { AiToolRegistry } from '../ai/tools/ai-tool-registry.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private aiTools: AiToolRegistry) {}

  listUsers(companyId: string) { return (this.prisma as any).employee.findMany({ where: { companyId } }); }
  async createUser(companyId: string, data: CreateAdminUserDto) {
    const user = await (this.prisma as any).employee.create({ data: { ...data, userId: `USR-${nanoid(10).toUpperCase()}`, companyId, isActive: true } });
    return user;
  }
  async updateUser(companyId: string, id: string, data: UpdateAdminUserDto) {
    const user = await (this.prisma as any).employee.findUnique({ where: { id } });
    if (!user || user.companyId !== companyId) throw new NotFoundException('User not found');
    return (this.prisma as any).employee.update({ where: { id }, data });
  }
  async getCommandCenter(companyId: string) {
    const [users, customers, activities] = await Promise.all([this.listUsers(companyId), (this.prisma as any).customer.findMany({ where: { companyId } }), this.getSystemLogs(companyId)]);
    const memory = this.prisma.getMemoryStoreStats();
    return { stats: { users: users.length, activeUsers: users.filter((u:any)=>u.isActive).length, customers: customers.length, activityEvents: activities.length, memoryRecords: Object.values(memory).reduce((s,n)=>s+Number(n),0), systemHealth:'HEALTHY', criticalErrors:0 }, services: ['CRM','PASSPORTS','VISA','FLIGHTS','HOTELS','PACKAGES','PILGRIMAGE','ACCOUNTING','ANALYTICS'].map(name=>({name,status:'ACTIVE'})), memory };
  }
  async getAiConfig(companyId: string) { const company=await this.company(companyId); return { agents:[{name:'Supervisor',tools:this.aiTools.getAllTools()}], settings:(company.settings as any)?.ai || { enabled:true, confidenceThreshold:0.8 } }; }
  async getSystemLogs(companyId: string) { const customers=await (this.prisma as any).customer.findMany({where:{companyId}}); const ids=new Set(customers.map((c:any)=>c.id)); const logs=await (this.prisma as any).activityLog.findMany({orderBy:{createdAt:'desc'}}); return logs.filter((l:any)=>ids.has(l.customerId)).slice(0,100); }
  async getSettings(companyId:string) { const company=await this.company(companyId); return company.settings || {}; }
  async updateSettings(companyId:string, settings:Record<string,unknown>) { const company=await this.company(companyId); return (this.prisma as any).company.update({where:{id:company.id},data:{settings:{...(company.settings||{}),...settings}}}); }
  private async company(id:string) { const company=await (this.prisma as any).company.findUnique({where:{id}}); if(!company) throw new NotFoundException('Company not found'); return company; }
}
