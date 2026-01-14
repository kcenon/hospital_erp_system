// Room-related type definitions

export type BedStatusType = 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type RoomType = 'GENERAL' | 'ICU' | 'VIP' | 'ISOLATION' | 'EMERGENCY';

export interface Floor {
  id: string;
  name: string;
  floorNumber: number;
  building?: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  patientNumber?: string;
}

export interface BedStatus {
  id: string;
  bedNumber: string;
  status: BedStatusType;
  patient?: PatientSummary;
  admissionId?: string;
}

export interface RoomStatus {
  id: string;
  roomNumber: string;
  roomType: RoomType;
  floor: Floor;
  beds: BedStatus[];
}

export interface FloorDashboardSummary {
  totalBeds: number;
  occupiedBeds: number;
  emptyBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
}

export interface FloorDashboard {
  floor: Floor;
  summary: FloorDashboardSummary;
  rooms: RoomStatus[];
}

export interface AvailableBed {
  id: string;
  bedNumber: string;
  room: {
    id: string;
    roomNumber: string;
    roomType: RoomType;
    floor: Floor;
  };
}

export interface AvailableBedFilters {
  floorId?: string;
  roomType?: RoomType;
}

// WebSocket event payloads
export interface BedStatusUpdate {
  bedId: string;
  roomId: string;
  floorId: string;
  status: BedStatusType;
  patient?: PatientSummary;
  admissionId?: string;
}

export interface AdmissionEvent {
  admissionId: string;
  bedId: string;
  roomId: string;
  floorId: string;
  patient: PatientSummary;
}
