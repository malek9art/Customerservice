import { Injectable } from '@nestjs/common';

@Injectable()
export class AiMemoryService {
  async getContext(customerId: string, companyId: string) {
    return {
      history: [],
      preferences: {},
      lastBookingStatus: 'NONE',
    };
  }

  async persistMessage(sessionId: string, message: any) {
    // Save to Vector DB (pgvector) and relational chat_messages
    console.log(`Persisting message for session ${sessionId}`);
  }
}
