import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new user
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-060
 */
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}

/**
 * DTO for updating an existing user
 * Reference: Issue #28 (User and Role Management Service)
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for assigning a role to a user
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-061
 */
export class AssignRoleDto {
  @IsNotEmpty()
  @IsUUID('4')
  roleId: string;
}

/**
 * DTO for listing users with pagination and filters
 */
export class ListUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @Matches(/^(asc|desc)$/i)
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Response DTO for user data
 */
export class UserResponseDto {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: RoleBasicDto[];

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for user creation with temporary password
 */
export class CreateUserResponseDto extends UserResponseDto {
  temporaryPassword: string;

  constructor(partial: Partial<CreateUserResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for password reset
 */
export class ResetPasswordResponseDto {
  temporaryPassword: string;
  message: string;

  constructor(temporaryPassword: string) {
    this.temporaryPassword = temporaryPassword;
    this.message = 'Password has been reset. User must change password on next login.';
  }
}

/**
 * Basic role information DTO
 */
export class RoleBasicDto {
  id: string;
  code: string;
  name: string;

  constructor(partial: Partial<RoleBasicDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Full role response DTO with permissions
 */
export class RoleResponseDto extends RoleBasicDto {
  description?: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RoleResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/**
 * Role with permissions response DTO
 */
export class RoleWithPermissionsDto extends RoleResponseDto {
  permissions: PermissionDto[];

  constructor(partial: Partial<RoleWithPermissionsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/**
 * Permission DTO
 */
export class PermissionDto {
  id: string;
  code: string;
  resource: string;
  action: string;
  description?: string;

  constructor(partial: Partial<PermissionDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Paginated result wrapper
 */
export class PaginatedResultDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    const totalPages = Math.ceil(total / limit);
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

/**
 * Message response DTO for simple operations
 */
export class MessageResponseDto {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
