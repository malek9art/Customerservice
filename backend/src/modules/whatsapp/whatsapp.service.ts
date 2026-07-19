import { Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendMessage(to: string, message: string) {
    const messageId = `MSG-${nanoid(10).toUpperCase()}`;
    this.logger.log(`Message ${messageId} dispatched to ${to}`);
    return { success: true, messageId, message };
  }
}
