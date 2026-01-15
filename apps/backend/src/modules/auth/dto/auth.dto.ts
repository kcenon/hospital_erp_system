import {
  IsString,
  IsNotEmpty,
  MinLength,
  ValidateNested,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceInfoDto } from './session.dto';

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const PASSWORD_MESSAGE =
  'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';

export class LoginDto {
  @ApiProperty({ description: 'Username for login', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'User password', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Device information', type: DeviceInfoDto })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  @IsOptional()
  deviceInfo?: DeviceInfoDto;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds', example: 3600 })
  expiresIn: number;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType: string;

  constructor(partial: Partial<TokenResponseDto>) {
    Object.assign(this, partial);
  }
}

export class UserInfoDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Username', example: 'admin' })
  username: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ description: 'User email', example: 'john.doe@hospital.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Department', example: 'Internal Medicine' })
  department?: string;

  @ApiPropertyOptional({ description: 'Position', example: 'Doctor' })
  position?: string;

  @ApiProperty({ description: 'User roles', example: ['DOCTOR'], type: [String] })
  roles: string[];

  @ApiProperty({
    description: 'User permissions',
    example: ['patient:read', 'patient:write'],
    type: [String],
  })
  permissions: string[];

  constructor(partial: Partial<UserInfoDto>) {
    Object.assign(this, partial);
  }
}

export class LoginResponseDto {
  @ApiProperty({ description: 'User information', type: UserInfoDto })
  user: UserInfoDto;

  @ApiProperty({ description: 'Authentication tokens', type: TokenResponseDto })
  tokens: TokenResponseDto;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Logout message', example: 'Logged out successfully' })
  message: string;

  constructor(message: string = 'Logged out successfully') {
    this.message = message;
  }
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (8+ chars, uppercase, lowercase, number, special char)',
    example: 'NewPassword456!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ description: 'Success message', example: 'Password changed successfully' })
  message: string;

  constructor(message: string = 'Password changed successfully') {
    this.message = message;
  }
}
