import { IsString, IsNotEmpty, MinLength, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceInfoDto } from './session.dto';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  @IsOptional()
  deviceInfo?: DeviceInfoDto;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;

  constructor(partial: Partial<TokenResponseDto>) {
    Object.assign(this, partial);
  }
}

export class LoginResponseDto {
  user: UserInfoDto;
  tokens: TokenResponseDto;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}

export class UserInfoDto {
  id: string;
  username: string;
  name: string;
  email?: string;
  department?: string;
  position?: string;
  roles: string[];
  permissions: string[];

  constructor(partial: Partial<UserInfoDto>) {
    Object.assign(this, partial);
  }
}

export class LogoutResponseDto {
  message: string;

  constructor(message: string = 'Logged out successfully') {
    this.message = message;
  }
}
