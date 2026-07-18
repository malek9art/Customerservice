import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { AutoReconciliationService, BankStatementPayload } from './auto-reconciliation.service';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';

@ApiTags('Financial Operations & Ledger')
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly reconciliationService: AutoReconciliationService,
    private readonly postingEngine: AccountingPostingEngine,
  ) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new financial invoice' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async createInvoice(@CurrentCompany() companyId: string, @Body() data: any) {
    return this.accountingService.createInvoice(companyId, data);
  }

  @Post('reconciliation/process-statement')
  @ApiOperation({ summary: 'Process bank transfer statement for automated reconciliation' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async processBankStatement(
    @CurrentCompany() companyId: string,
    @Body() payload: BankStatementPayload,
  ) {
    return this.reconciliationService.processBankStatement(companyId, payload);
  }

  @Post('reconciliation/confirm-match')
  @ApiOperation({ summary: 'Confirm or override suggested match for bank transaction' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async confirmMatch(
    @CurrentCompany() companyId: string,
    @Body()
    body: {
      bankReference: string;
      targetType: string;
      targetId: string;
      amount: number;
    },
  ) {
    return this.reconciliationService.confirmManualMatch(
      companyId,
      body.bankReference,
      body.targetType,
      body.targetId,
      body.amount,
    );
  }

  @Post('journals/post-event')
  @ApiOperation({ summary: 'Trigger accounting posting engine event manually' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async postEvent(
    @CurrentCompany() companyId: string,
    @Body() body: { eventType: string; payload: any },
  ) {
    return this.postingEngine.postEvent(companyId, body.eventType, body.payload);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Financial Operations Dashboard' })
  @ApiHeader({ name: 'x-company-id', required: true })
  async getDashboard(@CurrentCompany() companyId: string) {
    return this.accountingService.getDashboard(companyId);
  }
}
