import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class WorkflowService {
  constructor(private eventEmitter: EventEmitter2) {}

  async trigger(eventName: string, payload: any) {
    this.eventEmitter.emit(eventName, payload);
  }

  @OnEvent('booking.created')
  async handleBookingCreated(payload: any) {
    // Logic for workflow automation
    console.log('Workflow triggered: booking.created', payload);
  }
}
