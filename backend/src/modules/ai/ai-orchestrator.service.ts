import { Injectable } from '@nestjs/common';

@Injectable()
export class AiOrchestrator {
  async process(prompt: string, context: any) {
    return {
      response: `AI Processed: ${prompt}`,
      agent: 'Supervisor',
      confidence: 0.95,
    };
  }
}
