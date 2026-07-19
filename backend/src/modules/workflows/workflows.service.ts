import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma.service';

export interface WorkflowTransitionLog {
  workflowId: string;
  domain:
    | 'PILGRIMAGE'
    | 'FLIGHT'
    | 'VISA'
    | 'PASSPORT'
    | 'FINANCE'
    | 'CHAT_ESCALATION';
  eventName: string;
  previousState?: string;
  newState: string;
  entityId: string;
  companyId: string;
  timestamp: Date;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
  ) {}

  async trigger(eventName: string, payload: any) {
    this.logger.log(
      `Workflow State Event Triggered: [${eventName}] for entity [${payload.bookingId || payload.id || payload.pnr || 'N/A'}]`,
    );
    await this.eventEmitter.emitAsync(eventName, payload);
  }

  @OnEvent('pilgrimage.booking_cancelled')
  async handlePilgrimageCancellation(payload: any) {
    this.logger.log(
      `Processing Pilgrimage Cancellation & Slot Restoration for booking ${payload.bookingId}`,
    );

    // 1. Update Booking Status
    if (payload.bookingId) {
      await (this.prisma as any).pilgrimageBooking.update({
        where: { id: payload.bookingId },
        data: { status: 'CANCELLED' },
      });
    }

    // 2. Restore Package Slots atomically
    if (payload.packageId && payload.pilgrimCount) {
      await (this.prisma as any).package.update({
        where: { id: payload.packageId },
        data: {
          remainingSlots: { increment: payload.pilgrimCount },
        },
      });
    }

    // 3. Record Audit Activity Log
    await (this.prisma as any).activityLog.create({
      data: {
        customerId: payload.customerId || 'cust-1',
        action: 'PILGRIMAGE_BOOKING_CANCELLED',
        description: `Booking ${payload.bookingId} cancelled, ${payload.pilgrimCount || 1} slots restored to package ${payload.packageId}`,
      },
    });
  }

  @OnEvent('flight.booking_cancelled')
  async handleFlightCancellation(payload: any) {
    this.logger.log(
      `Processing Flight Order Cancellation for PNR ${payload.pnr}`,
    );

    if (payload.bookingId) {
      await (this.prisma as any).flightBooking.update({
        where: { id: payload.bookingId },
        data: { status: 'CANCELLED' },
      });
    }

    await (this.prisma as any).activityLog.create({
      data: {
        customerId: payload.customerId || 'cust-1',
        action: 'FLIGHT_BOOKING_CANCELLED',
        description: `Flight booking ${payload.bookingId} (PNR: ${payload.pnr}) marked as CANCELLED`,
      },
    });
  }

  @OnEvent('passport.status_updated')
  async handlePassportCustodyTransition(payload: any) {
    this.logger.log(
      `Passport Custody Logged: ${payload.passportNumber} -> Status: ${payload.status}`,
    );

    await (this.prisma as any).passportLog.create({
      data: {
        passportInventoryId: payload.passportInventoryId,
        status: payload.status,
        location: payload.location || 'Safe 01',
        performedById: payload.actorId || 'SYSTEM',
        notes: payload.notes || `Passport moved to ${payload.status}`,
      },
    });
  }

  @OnEvent('chat.escalated_human')
  async handleHumanEscalation(payload: any) {
    this.logger.log(
      `Session ${payload.sessionId} Escalated to Human Employee Supervisor`,
    );

    if (payload.sessionId) {
      await (this.prisma as any).chatSession.update({
        where: { id: payload.sessionId },
        data: { status: 'ESCALATED' },
      });
    }

    await (this.prisma as any).activityLog.create({
      data: {
        customerId: payload.customerId || 'cust-1',
        action: 'HUMAN_AGENT_ESCALATION',
        description: `Chat session ${payload.sessionId} flagged for manual review: "${payload.reason || 'Complex query'}"`,
      },
    });
  }
}
