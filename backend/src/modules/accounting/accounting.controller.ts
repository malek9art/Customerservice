import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import { AccountingService } from './accounting.service';
import { AutoReconciliationService } from './auto-reconciliation.service';
import {
  BankStatementDto,
  ConfirmMatchDto,
  CreateInvoiceDto,
  PostAccountingEventDto,
  RecordPaymentDto,
} from './dto/accounting.dto';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';

@ApiTags('Financial Operations & Ledger')
@Controller('accounting')
export class AccountingController {
  constructor(
    private accountingService: AccountingService,
    private reconciliationService: AutoReconciliationService,
    private postingEngine: AccountingPostingEngine,
  ) {}

  @Post('invoices')
  @ApiHeader({ name: 'x-company-id', required: true })
  createInvoice(
    @CurrentCompany() companyId: string,
    @Body() data: CreateInvoiceDto,
  ) {
    return this.accountingService.createInvoice(companyId, data);
  }

  @Get('invoices')
  @ApiHeader({ name: 'x-company-id', required: true })
  invoices(
    @CurrentCompany() companyId: string,
    @Query('customerId') customerId: string,
  ) {
    return this.accountingService.listCustomerInvoices(companyId, customerId);
  }

  @Post('invoices/:id/payments')
  @ApiHeader({ name: 'x-company-id', required: true })
  payment(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() data: RecordPaymentDto,
  ) {
    return this.accountingService.recordPayment(companyId, id, data);
  }

  @Get('customers/:customerId/statement')
  @ApiHeader({ name: 'x-company-id', required: true })
  statement(
    @CurrentCompany() companyId: string,
    @Param('customerId') id: string,
  ) {
    return this.accountingService.customerStatement(companyId, id);
  }

  @Get('ledger')
  @ApiHeader({ name: 'x-company-id', required: true })
  ledger(@CurrentCompany() companyId: string) {
    return this.accountingService.ledger(companyId);
  }

  @Post('reconciliation/process-statement')
  @ApiHeader({ name: 'x-company-id', required: true })
  processBankStatement(
    @CurrentCompany() companyId: string,
    @Body() payload: BankStatementDto,
  ) {
    return this.reconciliationService.processBankStatement(companyId, payload);
  }

  @Post('reconciliation/confirm-match')
  @ApiHeader({ name: 'x-company-id', required: true })
  confirmMatch(
    @CurrentCompany() companyId: string,
    @Body() body: ConfirmMatchDto,
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
  @ApiHeader({ name: 'x-company-id', required: true })
  postEvent(
    @CurrentCompany() companyId: string,
    @Body() body: PostAccountingEventDto,
  ) {
    return this.postingEngine.postEvent(
      companyId,
      body.eventType,
      body.payload,
    );
  }

  @Get('dashboard')
  @ApiHeader({ name: 'x-company-id', required: true })
  getDashboard(@CurrentCompany() companyId: string) {
    return this.accountingService.getDashboard(companyId);
  }
}
