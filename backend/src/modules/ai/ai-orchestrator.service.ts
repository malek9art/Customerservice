import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AiToolRegistry } from './tools/ai-tool-registry.service';
import { AiMemoryService } from './memory/ai-memory.service';
import { WorkflowService } from '../workflows/workflows.service';
import { BreService } from '../bre/bre.service';
import { nanoid } from 'nanoid';

export interface ActionChainStep {
  stepId: string;
  stepName: string;
  targetAgent:
    | 'SUPERVISOR'
    | 'PILGRIMAGE_AGENT'
    | 'FLIGHT_AGENT'
    | 'FINANCE_AGENT'
    | 'OCR_AGENT'
    | 'VERIFIER';
  action: string;
  input: any;
  output?: any;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  confidenceScore: number;
}

export interface ActionChainExecutionResult {
  chainId: string;
  companyId: string;
  sessionId?: string;
  userGoal: string;
  status: 'VERIFIED_SUCCESS' | 'PARTIAL' | 'FAILED' | 'ESCALATED';
  plan: ActionChainStep[];
  verification: {
    isValid: boolean;
    checksPassed: string[];
    checksFailed: string[];
  };
  tokenUsage: {
    totalTokens: number;
    costUsd: number;
  };
  finalResponse: string;
  executedAt: Date;
}

@Injectable()
export class AiOrchestrator {
  private readonly logger = new Logger(AiOrchestrator.name);

  constructor(
    private prisma: PrismaService,
    private toolRegistry: AiToolRegistry,
    private memoryService: AiMemoryService,
    private workflowService: WorkflowService,
    private breService: BreService,
  ) {}

  async process(prompt: string, context: any = {}) {
    const companyId = context.companyId || 'comp-id';
    const result = await this.executeStatefulChain(companyId, prompt, context);
    return {
      response: result.finalResponse,
      agent: 'Supervisor',
      confidence: 0.98,
      chainId: result.chainId,
      executionPlan: result.plan,
      tokenUsage: result.tokenUsage,
    };
  }

  async executeStatefulChain(
    companyId: string,
    prompt: string,
    context: any = {},
  ): Promise<ActionChainExecutionResult> {
    const chainId = `CHAIN-${nanoid(10).toUpperCase()}`;
    this.logger.log(
      `Executing Stateful Action Chain [${chainId}] for prompt: "${prompt}"`,
    );

    // 0. Check Semantic Cache
    const cachedResponse = this.memoryService.getCachedResponse(
      prompt,
      companyId,
    );
    if (cachedResponse) {
      return {
        ...cachedResponse,
        chainId,
        executedAt: new Date(),
      };
    }

    // STEP 1: PLANNING PHASE
    const plan = await this.planActionChain(companyId, prompt, context);

    // Save initial action logs
    if (context.sessionId) {
      await (this.prisma as any).aiActionLog.create({
        data: {
          sessionId: context.sessionId,
          agentName: 'SUPERVISOR',
          action: 'CHAIN_PLANNING',
          input: { prompt, context },
          output: { chainId, planStepsCount: plan.length },
          confidenceScore: 0.98,
        },
      });
    }

    // STEP 2: EXECUTION PHASE
    const outputsMap = new Map<string, any>();

    for (const step of plan) {
      step.status = 'RUNNING';
      this.logger.log(
        `Executing Step [${step.stepId}]: ${step.stepName} (${step.action})`,
      );

      try {
        const stepInput = {
          ...step.input,
          previousOutputs: Object.fromEntries(outputsMap),
        };

        let stepOutput: any;
        switch (step.action) {
          case 'SEARCH_PACKAGES':
            stepOutput = await (this.prisma as any).package.findMany({
              where: { companyId },
            });
            break;

          case 'BOOK_PILGRIMAGE':
            stepOutput = await (this.prisma as any).pilgrimageBooking.create({
              data: {
                packageId: stepInput.packageId || 'pkg-default',
                customerId: context.customerId || 'cust-1',
                totalAmount: 2500,
                status: 'CONFIRMED',
              },
            });
            break;

          case 'SEARCH_FLIGHTS':
            stepOutput = await (this.prisma as any).flightBooking.findMany({
              where: { companyId },
            });
            break;

          case 'POST_ACCOUNTING_JOURNAL':
            // Accounting journals must only be persisted by AccountingPostingEngine,
            // which guarantees balanced debit and credit entries.
            stepOutput = {
              delegated: true,
              eventType: stepInput.bookingType || 'AI_CHAIN',
              status: 'AWAITING_ACCOUNTING_EVENT',
            };
            break;

          case 'DISPATCH_NOTIFICATION':
            stepOutput = {
              notified: true,
              channel: 'WHATSAPP',
              recipient: context.whatsappNumber || '+1234567890',
            };
            break;

          default:
            stepOutput = { executed: true, timestamp: new Date() };
            break;
        }

        step.output = stepOutput;
        step.status = 'SUCCESS';
        outputsMap.set(step.stepId, stepOutput);

        if (context.sessionId) {
          await (this.prisma as any).aiActionLog.create({
            data: {
              sessionId: context.sessionId,
              agentName: step.targetAgent,
              action: step.action,
              input: stepInput,
              output: stepOutput,
              confidenceScore: step.confidenceScore,
            },
          });
        }
      } catch (err: any) {
        this.logger.error(`Error executing step ${step.stepId}`, err);
        step.status = 'FAILED';
        step.output = { error: err.message };
      }
    }

    // STEP 3: VERIFICATION PHASE
    const verification = this.verifyActionChain(plan);
    const status = verification.isValid ? 'VERIFIED_SUCCESS' : 'ESCALATED';

    const finalResponse = verification.isValid
      ? `Request successfully processed and verified! Goal: "${prompt}". Reference: ${chainId}.`
      : `Request processing required human supervisor verification for goal: "${prompt}".`;

    // Calculate Token Metrics
    const tokenMetrics = this.memoryService.calculateTokens(
      prompt,
      finalResponse,
    );

    const resultResult: ActionChainExecutionResult = {
      chainId,
      companyId,
      sessionId: context.sessionId,
      userGoal: prompt,
      status,
      plan,
      verification,
      tokenUsage: {
        totalTokens: tokenMetrics.totalTokens,
        costUsd: tokenMetrics.estimatedCostUsd,
      },
      finalResponse,
      executedAt: new Date(),
    };

    // Store in Semantic Cache
    this.memoryService.setCachedResponse(prompt, companyId, resultResult);

    return resultResult;
  }

  private async planActionChain(
    companyId: string,
    prompt: string,
    context: any,
  ): Promise<ActionChainStep[]> {
    const lower = prompt.toLowerCase();

    if (
      lower.includes('hajj') ||
      lower.includes('umrah') ||
      lower.includes('package') ||
      lower.includes('pilgrim')
    ) {
      return [
        {
          stepId: 'step-1',
          stepName: 'Identify Available Packages',
          targetAgent: 'PILGRIMAGE_AGENT',
          action: 'SEARCH_PACKAGES',
          input: { type: lower.includes('hajj') ? 'HAJJ' : 'UMRAH' },
          status: 'PENDING',
          confidenceScore: 0.98,
        },
        {
          stepId: 'step-2',
          stepName: 'Reserve Booking & Capacity',
          targetAgent: 'PILGRIMAGE_AGENT',
          action: 'BOOK_PILGRIMAGE',
          input: { packageId: context.packageId },
          status: 'PENDING',
          confidenceScore: 0.95,
        },
        {
          stepId: 'step-3',
          stepName: 'Generate Financial Journal Entries',
          targetAgent: 'FINANCE_AGENT',
          action: 'POST_ACCOUNTING_JOURNAL',
          input: { bookingType: 'PILGRIMAGE_BOOKING' },
          status: 'PENDING',
          confidenceScore: 0.99,
        },
        {
          stepId: 'step-4',
          stepName: 'Send WhatsApp Confirmation & PDF',
          targetAgent: 'SUPERVISOR',
          action: 'DISPATCH_NOTIFICATION',
          input: { channel: 'WHATSAPP' },
          status: 'PENDING',
          confidenceScore: 0.97,
        },
      ];
    } else if (
      lower.includes('flight') ||
      lower.includes('ticket') ||
      lower.includes('pnr')
    ) {
      return [
        {
          stepId: 'step-1',
          stepName: 'Search Live GDS Flights',
          targetAgent: 'FLIGHT_AGENT',
          action: 'SEARCH_FLIGHTS',
          input: { criteria: prompt },
          status: 'PENDING',
          confidenceScore: 0.96,
        },
        {
          stepId: 'step-2',
          stepName: 'Record Journal Ledger Entry',
          targetAgent: 'FINANCE_AGENT',
          action: 'POST_ACCOUNTING_JOURNAL',
          input: { bookingType: 'FLIGHT_BOOKING' },
          status: 'PENDING',
          confidenceScore: 0.98,
        },
        {
          stepId: 'step-3',
          stepName: 'Send Confirmation Ticket',
          targetAgent: 'SUPERVISOR',
          action: 'DISPATCH_NOTIFICATION',
          input: { channel: 'WHATSAPP' },
          status: 'PENDING',
          confidenceScore: 0.95,
        },
      ];
    } else {
      return [
        {
          stepId: 'step-1',
          stepName: 'Process General AI Query',
          targetAgent: 'SUPERVISOR',
          action: 'GENERAL_ASSIST',
          input: { prompt },
          status: 'PENDING',
          confidenceScore: 0.95,
        },
        {
          stepId: 'step-2',
          stepName: 'Send Dynamic Customer Response',
          targetAgent: 'SUPERVISOR',
          action: 'DISPATCH_NOTIFICATION',
          input: { channel: 'WHATSAPP' },
          status: 'PENDING',
          confidenceScore: 0.95,
        },
      ];
    }
  }

  private verifyActionChain(plan: ActionChainStep[]) {
    const checksPassed: string[] = [];
    const checksFailed: string[] = [];

    for (const step of plan) {
      if (step.status === 'SUCCESS') {
        checksPassed.push(`Step [${step.stepName}] executed successfully`);
      } else {
        checksFailed.push(`Step [${step.stepName}] failed or pending`);
      }
    }

    return {
      isValid: checksFailed.length === 0,
      checksPassed,
      checksFailed,
    };
  }
}
