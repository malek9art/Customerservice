import { Injectable, Logger } from '@nestjs/common';
import { AiOrchestrator as CoreAiOrchestrator } from '../ai-orchestrator.service';

@Injectable()
export class AiOrchestrator {
  private readonly logger = new Logger(AiOrchestrator.name);

  constructor(private coreOrchestrator: CoreAiOrchestrator) {}

  async execute(session: any, input: string, context: any) {
    this.logger.log(`Executing Multi-Agent Chain for Session [${session?.id}]`);

    const result = await this.coreOrchestrator.executeStatefulChain(
      session?.companyId || 'comp-id',
      input,
      {
        sessionId: session?.id,
        customerId: session?.customerId,
        whatsappNumber: session?.whatsappNumber,
        ...context,
      },
    );

    return {
      response: result.finalResponse,
      agent: 'Supervisor',
      tools: result.plan.map((p) => p.action),
      confidence: 0.98,
      chainId: result.chainId,
      status: result.status,
      verification: result.verification,
      plan: result.plan,
    };
  }
}
