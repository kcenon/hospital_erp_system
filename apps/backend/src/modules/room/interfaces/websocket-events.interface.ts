import { Bed, BedStatus, Room, Floor, Building } from '@prisma/client';
import { FloorDashboard } from '../dto';

/**
 * Bed with room relation included
 */
export type BedWithRoom = Bed & {
  room: Room & {
    floor: Floor & {
      building: Building;
    };
  };
};

/**
 * Patient summary for WebSocket events
 */
export interface PatientSummary {
  id: string;
  name: string;
  admissionDate?: Date;
}

/**
 * Room update event payload
 */
export interface RoomUpdate {
  type: 'ROOM_UPDATE';
  roomId: string;
  roomNumber?: string;
  timestamp: Date;
}

/**
 * Bed status update event payload
 */
export interface BedStatusUpdate {
  type: 'BED_UPDATE';
  bedId: string;
  roomId: string;
  status: BedStatus;
  patient?: PatientSummary;
  timestamp: Date;
}

/**
 * Admission event payload
 */
export interface AdmissionEvent {
  type: 'ADMISSION_CREATED' | 'ADMISSION_DISCHARGED';
  admissionId: string;
  bedId: string;
  patient?: PatientSummary;
  timestamp: Date;
}

/**
 * Vital alert event payload
 */
export interface VitalAlertEvent {
  type: 'VITAL_RECORDED';
  patientId: string;
  bedId: string;
  alertLevel?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  timestamp: Date;
}

/**
 * Server to Client events
 */
export interface ServerToClientEvents {
  'room:status': (data: FloorDashboard | RoomUpdate) => void;
  'bed:status': (data: BedStatusUpdate) => void;
  'admission:created': (data: AdmissionEvent) => void;
  'admission:discharged': (data: AdmissionEvent) => void;
  'vital:recorded': (data: VitalAlertEvent) => void;
}

/**
 * Client to Server events
 */
export interface ClientToServerEvents {
  'subscribe:floor': (floorId: string) => void;
  'unsubscribe:floor': (floorId: string) => void;
}

/**
 * Domain events for internal event bus
 */
export interface AdmissionCreatedEvent {
  admissionId: string;
  patientId: string;
  patientName: string;
  bedId: string;
}

export interface AdmissionDischargedEvent {
  admissionId: string;
  bedId: string;
}

export interface BedStatusChangedEvent {
  bedId: string;
  roomId: string;
  newStatus: BedStatus;
  patient?: PatientSummary;
}
