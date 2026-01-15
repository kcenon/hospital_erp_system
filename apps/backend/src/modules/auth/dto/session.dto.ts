import { IsString, IsNotEmpty, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '../interfaces';

export class DeviceInfoDto {
  @ApiProperty({ description: 'User agent string', example: 'Mozilla/5.0...' })
  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @ApiProperty({ description: 'Device type', enum: ['PC', 'TABLET', 'MOBILE'], example: 'PC' })
  @IsEnum(['PC', 'TABLET', 'MOBILE'])
  deviceType: DeviceType;

  @ApiProperty({ description: 'Browser name', example: 'Chrome' })
  @IsString()
  @IsNotEmpty()
  browser: string;

  @ApiProperty({ description: 'Operating system', example: 'Windows' })
  @IsString()
  @IsNotEmpty()
  os: string;
}

export class CreateSessionDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Username', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'User roles', example: ['ADMIN'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({ description: 'Device information', type: DeviceInfoDto })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @ApiProperty({ description: 'Client IP address', example: '192.168.1.1' })
  @IsString()
  @IsNotEmpty()
  ipAddress: string;
}

export class SessionInfoResponseDto {
  @ApiProperty({ description: 'Session ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  sessionId: string;

  @ApiProperty({ description: 'Device information', type: DeviceInfoDto })
  deviceInfo: DeviceInfoDto;

  @ApiProperty({ description: 'Client IP address', example: '192.168.1.1' })
  ipAddress: string;

  @ApiProperty({ description: 'Session creation time' })
  createdAt: Date;

  @ApiProperty({ description: 'Last activity time' })
  lastActivity: Date;

  @ApiProperty({ description: 'Whether this is the current session', example: true })
  isCurrent: boolean;
}

export class DestroySessionDto {
  @ApiProperty({
    description: 'Session ID to destroy',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class SessionListResponseDto {
  @ApiProperty({ description: 'List of sessions', type: [SessionInfoResponseDto] })
  sessions: SessionInfoResponseDto[];

  @ApiProperty({ description: 'Total number of sessions', example: 3 })
  total: number;
}
