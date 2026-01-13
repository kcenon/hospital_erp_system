import {
  IsString,
  IsNotEmpty,
  MinLength,
  ValidateNested,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceInfoDto } from './session.dto';

/**
 * Password validation regex pattern
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const PASSWORD_MESSAGE =
  'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';

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

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}

export class ChangePasswordResponseDto {
  message: string;

  constructor(message: string = 'Password changed successfully') {
    this.message = message;
  }
}
