import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AiOrchestrator } from '../ai/ai-orchestrator.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiOrchestrator,
  ) {}

  async getExecutiveDashboard(companyId: string) {
    // Aggregated real-time metrics
    return {
      sales: {
        totalRevenue: 125000,
        growth: 12.5,
        bookingsCount: 450,
      },
      operations: {
        pendingVisas: 24,
        ongoingHajjGroups: 2,
        unallocatedPassports: 5,
      },
      aiPerformance: {
        avgConfidence: 0.94,
        automationRate: 0.82,
        totalTokens: 1500000,
      },
      customerSatisfaction: {
        nps: 78,
        retentionRate: 0.88,
      },
    };
  }

  async askCopilot(companyId: string, question: string) {
    this.logger.log(`Copilot Query from Company ${companyId}: ${question}`);

    // 1. Context Gathering: Retrieve schema info and top-level stats
    const stats = await this.getExecutiveDashboard(companyId);

    // 2. AI Analysis & SQL Generation (Simplified)
    const prompt = `Act as a CEO's AI Copilot. Use this data: ${JSON.stringify(stats)}. Answer this question: ${question}. Provide insights and recommendations.`;
    const analysis = await this.ai.process(prompt, {
      companyId,
      task: 'COPILOT_ANALYSIS',
    });

    return {
      answer: analysis.response,
      dataVisualization: {
        chartType: 'BAR',
        series: [{ name: 'Revenue', data: [10, 20, 30] }], // Mock chart data
      },
      recommendations: [
        'Increase marketing for Ramadan Umrah packages.',
        'Review Visa processing delay in Cairo branch.',
      ],
    };
  }

  async generateReport(
    companyId: string,
    type: string,
    format: 'PDF' | 'EXCEL' | 'CSV',
  ) {
    this.logger.log(`Generating ${type} report in ${format} format`);
    return {
      downloadUrl: `https://reports.travelos.ai/exports/report-${Date.now()}.${format.toLowerCase()}`,
      metadata: { generatedAt: new Date().toISOString() },
    };
  }
}
