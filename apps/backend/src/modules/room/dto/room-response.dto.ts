import { RoomType, BedStatus } from '@prisma/client';

export class BedResponseDto {
  id: string;
  bedNumber: string;
  status: BedStatus;
  currentAdmissionId: string | null;
  notes: string | null;
  isActive: boolean;
}

export class RoomResponseDto {
  id: string;
  roomNumber: string;
  name: string | null;
  roomType: RoomType;
  bedCount: number;
  isActive: boolean;
  notes: string | null;
  beds: BedResponseDto[];
}

export class FloorResponseDto {
  id: string;
  floorNumber: number;
  name: string;
  department: string | null;
  isActive: boolean;
  rooms?: RoomResponseDto[];
}

export class BuildingResponseDto {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
  floors?: FloorResponseDto[];
}
