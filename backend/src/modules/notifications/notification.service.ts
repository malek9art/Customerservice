import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async notify(userId: string, type: string, content: any) {
    console.log(`Notification to ${userId} [${type}]:`, content);
  }
}
