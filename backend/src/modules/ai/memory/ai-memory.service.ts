import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

export interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

@Injectable()
export class AiMemoryService {
  private readonly logger = new Logger(AiMemoryService.name);
  private semanticCache = new Map<string, { response: any; timestamp: number }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL for frequent queries

  constructor(private prisma: PrismaService) {}

  /**
   * Semantic caching for frequent AI queries to optimize token usage & cost
   */
  getCachedResponse(prompt: string, companyId: string): any | null {
    const cacheKey = `${companyId}:${prompt.trim().toLowerCase()}`;
    const cached = this.semanticCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.logger.log(`Semantic Cache Hit for prompt [${cacheKey}], saved tokens!`);
      return cached.response;
    }
    return null;
  }

  setCachedResponse(prompt: string, companyId: string, response: any) {
    const cacheKey = `${companyId}:${prompt.trim().toLowerCase()}`;
    this.semanticCache.set(cacheKey, { response, timestamp: Date.now() });
  }

  /**
   * Calculate precise token consumption and cost estimation
   */
  calculateTokens(inputText: string, outputText: string): TokenMetrics {
    // Standard estimation: ~4 chars per token for English/Arabic mixed prompt
    const promptTokens = Math.ceil((inputText || '').length / 3.5);
    const completionTokens = Math.ceil((outputText || '').length / 3.5);
    const totalTokens = promptTokens + completionTokens;

    // Price estimate based on GPT-4o standard rate ($2.50 / 1M input, $10.00 / 1M output)
    const estimatedCostUsd = Number(
      ((promptTokens * 0.0000025) + (completionTokens * 0.000010)).toFixed(6),
    );

    return { promptTokens, completionTokens, totalTokens, estimatedCostUsd };
  }

  async getContext(customerId: string, companyId: string) {
    const customer = await (this.prisma as any).customer.findUnique({
      where: { id: customerId },
    });

    const recentSessions = await (this.prisma as any).chatSession.findMany({
      where: { companyId, customerId },
    });

    return {
      customer,
      history: recentSessions || [],
      preferences: customer?.preferences || {},
      lastBookingStatus: 'ACTIVE',
    };
  }

  async persistMessage(sessionId: string, message: any) {
    this.logger.log(`Persisting chat message for session ${sessionId}`);
    return (this.prisma as any).chatMessage.create({
      data: {
        sessionId,
        role: message.role || 'AI',
        content: message.content || message.text || '',
        type: message.type || 'TEXT',
        metadata: message.metadata || {},
      },
    });
  }
}
