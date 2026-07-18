import { Injectable } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class IntegrationFramework {
  constructor(
    private whatsapp: WhatsappService,
    private notifications: NotificationService,
  ) {}

  async triggerExternal(provider: string, action: string, payload: any) {
    // Dynamic dispatching to Amadeus, Sabre, Stripe, etc.
    console.log(`Integration: ${provider} -> ${action}`, payload);
  }
}
