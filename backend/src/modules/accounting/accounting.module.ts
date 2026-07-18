import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';
import { AutoReconciliationService } from './auto-reconciliation.service';

@Module({
  controllers: [AccountingController],
  providers: [
    AccountingService,
    AccountingPostingEngine,
    AutoReconciliationService,
  ],
  exports: [
    AccountingService,
    AccountingPostingEngine,
    AutoReconciliationService,
  ],
})
export class AccountingModule {}
