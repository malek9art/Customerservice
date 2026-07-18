import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BreService } from './modules/bre/bre.service';
import { WorkflowService } from './modules/workflows/workflows.service';
import { AuditService } from './modules/audit/audit.service';

import { AiOrchestrator } from './modules/ai/ai-orchestrator.service';
import { IamService } from './modules/iam/iam.service';
import { WhatsappService } from './modules/whatsapp/whatsapp.service';
import { NotificationService } from './modules/notifications/notification.service';

import { CoreController } from './core.controller';

import { StorageService } from './modules/storage/storage.service';
import { OcrService } from './modules/ocr/ocr.service';
import { CacheService } from './modules/cache/cache.service';
import { AiMemoryService } from './modules/ai/memory/ai-memory.service';
import { AiToolRegistry } from './modules/ai/tools/ai-tool-registry.service';
import { IntegrationFramework } from './modules/integrations/integration-framework.service';

import { CustomersModule } from './modules/customers/customers.module';

import { OcrModule } from './modules/ocr/ocr.module';

import { VisaModule } from './modules/visa/visa.module';
import { PassportProcessingModule } from './modules/passport/passport-processing.module';

import { FlightModule } from './modules/flight/flight.module';
import { HotelModule } from './modules/hotel/hotel.module';
import { PackageEngineModule } from './modules/package-engine/package-engine.module';
import { PilgrimageModule } from './modules/pilgrimage/pilgrimage.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { SaasModule } from './modules/saas/saas.module';

import { AiAgentService } from './modules/ai/ai-agent.service';
import { AiOrchestrator as AiOrchestratorEngine } from './modules/ai/orchestrator/ai-orchestrator.engine';
import { AiWhatsappController } from './modules/ai/ai-whatsapp.controller';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    CustomersModule,
    OcrModule,
    VisaModule,
    PassportProcessingModule,
    FlightModule,
    HotelModule,
    PackageEngineModule,
    PilgrimageModule,
    AccountingModule,
    AnalyticsModule,
    AdminModule,
    SaasModule,
  ],
  controllers: [CoreController, AiWhatsappController],
  providers: [
    PrismaService,
    BreService,
    WorkflowService,
    AuditService,
    AiOrchestrator, // Original foundation service
    AiOrchestratorEngine, // New execution engine
    AiAgentService,
    IamService,
    WhatsappService,
    NotificationService,
    StorageService,
    OcrService,
    CacheService,
    AiMemoryService,
    AiToolRegistry,
    IntegrationFramework,
  ],
  exports: [
    PrismaService,
    BreService,
    WorkflowService,
    AuditService,
    AiOrchestrator,
    AiOrchestratorEngine,
    AiAgentService,
    IamService,
    WhatsappService,
    NotificationService,
    StorageService,
    OcrService,
    CacheService,
    AiMemoryService,
    AiToolRegistry,
    IntegrationFramework,
  ],
})
export class AppModule {}
