import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtTokenService } from '../auth/services';
import { RoomDashboardService } from './room-dashboard.service';
import { BedService } from './bed.service';
import {
  BedStatusUpdate,
  AdmissionEvent,
  PatientSummary,
  AdmissionCreatedEvent,
  AdmissionDischargedEvent,
  BedWithRoom,
} from './interfaces';
import { BedStatus } from '@prisma/client';

@WebSocketGateway({
  namespace: '/rooms',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly roomDashboardService: RoomDashboardService,
    private readonly bedService: BedService,
  ) {}

  /**
   * Handle client connection with JWT authentication
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token as string;

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted connection without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtTokenService.verifyAccessToken(token);
      client.data.user = {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles,
        permissions: payload.permissions,
        sessionId: payload.sessionId,
      };

      this.logger.log(`Client connected: ${client.id}, User: ${payload.username}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Client ${client.id} connection failed: ${message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to floor updates
   */
  @SubscribeMessage('subscribe:floor')
  async subscribeToFloor(
    @ConnectedSocket() client: Socket,
    @MessageBody() floorId: string,
  ): Promise<{ success: boolean; floorId?: string; error?: string }> {
    try {
      // Leave previous floor rooms
      const rooms = Array.from(client.rooms);
      rooms.forEach((room) => {
        if (room.startsWith('floor:')) {
          client.leave(room);
        }
      });

      // Join new floor room
      client.join(`floor:${floorId}`);

      // Send current status
      const dashboard = await this.roomDashboardService.getFloorDashboard(floorId);
      client.emit('room:status', dashboard);

      this.logger.debug(
        `Client ${client.id} subscribed to floor ${floorId}`,
      );

      return { success: true, floorId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to subscribe to floor ${floorId}: ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * Unsubscribe from floor updates
   */
  @SubscribeMessage('unsubscribe:floor')
  async unsubscribeFromFloor(
    @ConnectedSocket() client: Socket,
    @MessageBody() floorId: string,
  ): Promise<{ success: boolean }> {
    client.leave(`floor:${floorId}`);

    this.logger.debug(
      `Client ${client.id} unsubscribed from floor ${floorId}`,
    );

    return { success: true };
  }

  /**
   * Broadcast room status update to all clients subscribed to the floor
   */
  async broadcastRoomUpdate(
    roomId: string,
    floorId: string,
    update: Partial<{ roomNumber: string }>,
  ): Promise<void> {
    this.server.to(`floor:${floorId}`).emit('room:status', {
      type: 'ROOM_UPDATE',
      roomId,
      ...update,
      timestamp: new Date(),
    });

    this.logger.debug(`Broadcast room update for room ${roomId}`);
  }

  /**
   * Broadcast bed status change to all clients subscribed to the floor
   */
  async broadcastBedUpdate(
    bedId: string,
    status: BedStatus,
    patient?: PatientSummary,
  ): Promise<void> {
    try {
      const bed = (await this.bedService.findById(bedId)) as BedWithRoom;

      const update: BedStatusUpdate = {
        type: 'BED_UPDATE',
        bedId,
        roomId: bed.room.id,
        status,
        patient,
        timestamp: new Date(),
      };

      this.server.to(`floor:${bed.room.floor.id}`).emit('bed:status', update);

      this.logger.debug(`Broadcast bed update for bed ${bedId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to broadcast bed update: ${message}`);
    }
  }

  /**
   * Broadcast admission event to all clients subscribed to the floor
   */
  async broadcastAdmission(event: AdmissionCreatedEvent): Promise<void> {
    try {
      const bed = (await this.bedService.findById(event.bedId)) as BedWithRoom;

      const admissionEvent: AdmissionEvent = {
        type: 'ADMISSION_CREATED',
        admissionId: event.admissionId,
        bedId: event.bedId,
        patient: {
          id: event.patientId,
          name: event.patientName,
        },
        timestamp: new Date(),
      };

      this.server.to(`floor:${bed.room.floor.id}`).emit('admission:created', admissionEvent);

      this.logger.debug(`Broadcast admission created for bed ${event.bedId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to broadcast admission: ${message}`);
    }
  }

  /**
   * Broadcast discharge event to all clients subscribed to the floor
   */
  async broadcastDischarge(event: AdmissionDischargedEvent): Promise<void> {
    try {
      const bed = (await this.bedService.findById(event.bedId)) as BedWithRoom;

      const dischargeEvent: AdmissionEvent = {
        type: 'ADMISSION_DISCHARGED',
        admissionId: event.admissionId,
        bedId: event.bedId,
        timestamp: new Date(),
      };

      this.server.to(`floor:${bed.room.floor.id}`).emit('admission:discharged', dischargeEvent);

      this.logger.debug(`Broadcast discharge for bed ${event.bedId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to broadcast discharge: ${message}`);
    }
  }
}
