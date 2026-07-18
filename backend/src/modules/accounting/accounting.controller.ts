import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Financial Operations')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new financial invoice' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async createInvoice(@CurrentCompany() companyId: string, @Body() data: any) {
    return this.accountingService.createInvoice(companyId, data);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Financial Operations Dashboard' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getDashboard(@CurrentCompany() companyId: string) {
    return this.accountingService.getDashboard(companyId);
  }
}
