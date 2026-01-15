import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomType, BedStatus } from '@prisma/client';

export class BedResponseDto {
  @ApiProperty({ description: 'Bed ID' })
  id: string;

  @ApiProperty({ description: 'Bed number', example: 'A' })
  bedNumber: string;

  @ApiProperty({
    description: 'Bed status',
    enum: ['EMPTY', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
  })
  status: BedStatus;

  @ApiPropertyOptional({ description: 'Current admission ID', nullable: true })
  currentAdmissionId: string | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Is bed active' })
  isActive: boolean;
}

export class RoomResponseDto {
  @ApiProperty({ description: 'Room ID' })
  id: string;

  @ApiProperty({ description: 'Room number', example: '301' })
  roomNumber: string;

  @ApiPropertyOptional({ description: 'Room name', nullable: true })
  name: string | null;

  @ApiProperty({
    description: 'Room type',
    enum: ['GENERAL', 'ICU', 'ISOLATION', 'PRIVATE', 'SEMI_PRIVATE'],
  })
  roomType: RoomType;

  @ApiProperty({ description: 'Number of beds in room' })
  bedCount: number;

  @ApiProperty({ description: 'Is room active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Beds in room', type: [BedResponseDto] })
  beds: BedResponseDto[];
}

export class FloorResponseDto {
  @ApiProperty({ description: 'Floor ID' })
  id: string;

  @ApiProperty({ description: 'Floor number', example: 3 })
  floorNumber: number;

  @ApiProperty({ description: 'Floor name', example: '3F - Internal Medicine' })
  name: string;

  @ApiPropertyOptional({ description: 'Department', nullable: true })
  department: string | null;

  @ApiProperty({ description: 'Is floor active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Rooms on floor', type: [RoomResponseDto] })
  rooms?: RoomResponseDto[];
}

export class BuildingResponseDto {
  @ApiProperty({ description: 'Building ID' })
  id: string;

  @ApiProperty({ description: 'Building code', example: 'MAIN' })
  code: string;

  @ApiProperty({ description: 'Building name', example: 'Main Building' })
  name: string;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'Is building active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Floors in building', type: [FloorResponseDto] })
  floors?: FloorResponseDto[];
}
