import { RoomType, BedStatus } from '@prisma/client';

export class DashboardSummary {
  totalBeds: number;
  occupiedBeds: number;
  emptyBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
}

export class DashboardBed {
  id: string;
  bedNumber: string;
  status: BedStatus;
  patient: {
    id: string;
    name: string;
    admissionDate: Date;
  } | null;
}

export class DashboardRoom {
  id: string;
  roomNumber: string;
  roomType: RoomType;
  beds: DashboardBed[];
}

export class FloorDashboard {
  floorId: string;
  floorNumber: number;
  name: string;
  department: string | null;
  summary: DashboardSummary;
  rooms: DashboardRoom[];
}

export class BuildingDashboard {
  buildingId: string;
  code: string;
  name: string;
  summary: DashboardSummary;
  floors: {
    id: string;
    floorNumber: number;
    name: string;
    department: string | null;
    summary: DashboardSummary;
  }[];
}
