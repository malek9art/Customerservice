import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AiOrchestrator } from './orchestrator/ai-orchestrator.engine';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private prisma: PrismaService,
    private orchestrator: AiOrchestrator,
    private whatsapp: WhatsappService,
  ) {}

  async getSession(companyId: string, sessionId: string) {
    const session = await (this.prisma as any).chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.companyId !== companyId) {
      throw new NotFoundException('Conversation session not found');
    }
    const [messages, actions] = await Promise.all([
      (this.prisma as any).chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      }),
      (this.prisma as any).aiActionLog.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return { ...session, messages, actions };
  }

  async handleIncomingMessage(companyId: string, payload: any) {
    const { from, text, type } = payload;

    // 1. Get or Create Session
    let session = await (this.prisma as any).chatSession.findFirst({
      where: { companyId, whatsappNumber: from, status: 'ACTIVE' },
      include: { customer: true },
    });

    if (!session) {
      // Find customer by phone
      const customer = await (this.prisma as any).customer.findUnique({
        where: { companyId_phone: { companyId, phone: from } },
      });

      if (!customer) {
        // Handle new customer logic or ask for name
        return this.whatsapp.sendMessage(
          from,
          'Welcome to TravelOS. Please tell us your name to start.',
        );
      }

      session = await (this.prisma as any).chatSession.create({
        data: {
          companyId,
          customerId: customer.id,
          whatsappNumber: from,
          status: 'ACTIVE',
        },
      });
    }

    // 2. Log Message
    await (this.prisma as any).chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'CUSTOMER',
        content: text || '',
        type,
        metadata: payload,
      },
    });

    // 3. Orchestrate Response (Multi-Agent Planning & Execution)
    const result = await this.orchestrator.execute(session, text, payload);

    // 4. Send Response
    await this.whatsapp.sendMessage(from, result.response);

    // 5. Log AI Message
    await (this.prisma as any).chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'AI',
        content: result.response,
        type: 'TEXT',
        metadata: { agent: result.agent, tools: result.tools },
      },
    });

    return result;
  }
}
