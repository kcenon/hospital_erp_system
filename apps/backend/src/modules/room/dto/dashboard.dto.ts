import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomType, BedStatus } from '@prisma/client';

export class DashboardSummary {
  @ApiProperty({ description: 'Total beds' })
  totalBeds: number;

  @ApiProperty({ description: 'Occupied beds' })
  occupiedBeds: number;

  @ApiProperty({ description: 'Empty beds' })
  emptyBeds: number;

  @ApiProperty({ description: 'Reserved beds' })
  reservedBeds: number;

  @ApiProperty({ description: 'Beds under maintenance' })
  maintenanceBeds: number;
}

export class DashboardPatient {
  @ApiProperty({ description: 'Patient ID' })
  id: string;

  @ApiProperty({ description: 'Patient name' })
  name: string;

  @ApiProperty({ description: 'Admission date' })
  admissionDate: Date;
}

export class DashboardBed {
  @ApiProperty({ description: 'Bed ID' })
  id: string;

  @ApiProperty({ description: 'Bed number' })
  bedNumber: string;

  @ApiProperty({
    description: 'Bed status',
    enum: ['EMPTY', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
  })
  status: BedStatus;

  @ApiPropertyOptional({ description: 'Patient info', type: DashboardPatient, nullable: true })
  patient: DashboardPatient | null;
}

export class DashboardRoom {
  @ApiProperty({ description: 'Room ID' })
  id: string;

  @ApiProperty({ description: 'Room number' })
  roomNumber: string;

  @ApiProperty({
    description: 'Room type',
    enum: ['GENERAL', 'ICU', 'ISOLATION', 'PRIVATE', 'SEMI_PRIVATE'],
  })
  roomType: RoomType;

  @ApiProperty({ description: 'Beds in room', type: [DashboardBed] })
  beds: DashboardBed[];
}

export class FloorDashboard {
  @ApiProperty({ description: 'Floor ID' })
  floorId: string;

  @ApiProperty({ description: 'Floor number' })
  floorNumber: number;

  @ApiProperty({ description: 'Floor name' })
  name: string;

  @ApiPropertyOptional({ description: 'Department', nullable: true })
  department: string | null;

  @ApiProperty({ description: 'Summary statistics', type: DashboardSummary })
  summary: DashboardSummary;

  @ApiProperty({ description: 'Rooms on floor', type: [DashboardRoom] })
  rooms: DashboardRoom[];
}

export class FloorSummaryDto {
  @ApiProperty({ description: 'Floor ID' })
  id: string;

  @ApiProperty({ description: 'Floor number' })
  floorNumber: number;

  @ApiProperty({ description: 'Floor name' })
  name: string;

  @ApiPropertyOptional({ description: 'Department', nullable: true })
  department: string | null;

  @ApiProperty({ description: 'Summary statistics', type: DashboardSummary })
  summary: DashboardSummary;
}

export class BuildingDashboard {
  @ApiProperty({ description: 'Building ID' })
  buildingId: string;

  @ApiProperty({ description: 'Building code' })
  code: string;

  @ApiProperty({ description: 'Building name' })
  name: string;

  @ApiProperty({ description: 'Summary statistics', type: DashboardSummary })
  summary: DashboardSummary;

  @ApiProperty({ description: 'Floors summary', type: [FloorSummaryDto] })
  floors: FloorSummaryDto[];
}
