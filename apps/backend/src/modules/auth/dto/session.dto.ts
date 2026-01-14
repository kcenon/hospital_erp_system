import { IsString, IsNotEmpty, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceType } from '../interfaces';

export class DeviceInfoDto {
  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsEnum(['PC', 'TABLET', 'MOBILE'])
  deviceType: DeviceType;

  @IsString()
  @IsNotEmpty()
  browser: string;

  @IsString()
  @IsNotEmpty()
  os: string;
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;
}

export class SessionInfoResponseDto {
  sessionId: string;
  deviceInfo: DeviceInfoDto;
  ipAddress: string;
  createdAt: Date;
  lastActivity: Date;
  isCurrent: boolean;
}

export class DestroySessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class SessionListResponseDto {
  sessions: SessionInfoResponseDto[];
  total: number;
}
