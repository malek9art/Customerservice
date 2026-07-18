import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { AccountingPostingEngine } from './engine/accounting-posting-engine.service';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, AccountingPostingEngine],
  exports: [AccountingService, AccountingPostingEngine],
})
export class AccountingModule {}
