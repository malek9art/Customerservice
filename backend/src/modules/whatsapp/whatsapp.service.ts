import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  async sendMessage(to: string, message: string) {
    console.log(`WhatsApp message to ${to}: ${message}`);
    return { success: true, messageId: 'mock-id' };
  }
}
