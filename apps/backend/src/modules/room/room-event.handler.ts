import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RoomGateway } from './room.gateway';
import {
  AdmissionCreatedEvent,
  AdmissionDischargedEvent,
  BedStatusChangedEvent,
} from './interfaces';

/**
 * Event handler that bridges domain events to WebSocket broadcasts
 */
@Injectable()
export class RoomEventHandler {
  private readonly logger = new Logger(RoomEventHandler.name);

  constructor(private readonly roomGateway: RoomGateway) {}

  /**
   * Handle admission created event
   */
  @OnEvent('admission.created')
  async handleAdmissionCreated(event: AdmissionCreatedEvent): Promise<void> {
    this.logger.debug(`Handling admission.created event for admission ${event.admissionId}`);

    await this.roomGateway.broadcastAdmission(event);
  }

  /**
   * Handle admission discharged event
   */
  @OnEvent('admission.discharged')
  async handleAdmissionDischarged(event: AdmissionDischargedEvent): Promise<void> {
    this.logger.debug(`Handling admission.discharged event for admission ${event.admissionId}`);

    await this.roomGateway.broadcastDischarge(event);
  }

  /**
   * Handle bed status changed event
   */
  @OnEvent('bed.statusChanged')
  async handleBedStatusChanged(event: BedStatusChangedEvent): Promise<void> {
    this.logger.debug(`Handling bed.statusChanged event for bed ${event.bedId}`);

    await this.roomGateway.broadcastBedUpdate(event.bedId, event.newStatus, event.patient);
  }
}
