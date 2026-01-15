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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new user
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-060
 */
export class CreateUserDto {
  @ApiProperty({ description: 'Employee ID', maxLength: 20 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  employeeId: string;

  @ApiProperty({
    description: 'Username (letters, numbers, underscores only)',
    minLength: 4,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({ description: 'Full name of the user', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Email address', format: 'email', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Department name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Job position/title', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiProperty({ description: 'Array of role IDs to assign', type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}

/**
 * DTO for updating an existing user
 * Reference: Issue #28 (User and Role Management Service)
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Full name of the user', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Email address', format: 'email', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Department name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Job position/title', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: 'Whether the user account is active' })
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
  @ApiProperty({ description: 'Role ID to assign', format: 'uuid' })
  @IsNotEmpty()
  @IsUUID('4')
  roleId: string;
}

/**
 * DTO for listing users with pagination and filters
 */
export class ListUsersDto {
  @ApiPropertyOptional({ description: 'Search term for username, name, or employee ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by role ID', format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Field to sort by', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  @Matches(/^(asc|desc)$/i)
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Response DTO for user data
 */
export class UserResponseDto {
  @ApiProperty({ description: 'User ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Full name' })
  name: string;

  @ApiPropertyOptional({ description: 'Email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Department' })
  department?: string;

  @ApiPropertyOptional({ description: 'Position/title' })
  position?: string;

  @ApiProperty({ description: 'Whether the user account is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Assigned roles', type: () => [RoleBasicDto] })
  roles: RoleBasicDto[];

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for user creation with temporary password
 */
export class CreateUserResponseDto extends UserResponseDto {
  @ApiProperty({ description: 'Temporary password for the new user' })
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
  @ApiProperty({ description: 'New temporary password' })
  temporaryPassword: string;

  @ApiProperty({ description: 'Response message' })
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
  @ApiProperty({ description: 'Role ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Role code' })
  code: string;

  @ApiProperty({ description: 'Role name' })
  name: string;

  constructor(partial: Partial<RoleBasicDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Full role response DTO with permissions
 */
export class RoleResponseDto extends RoleBasicDto {
  @ApiPropertyOptional({ description: 'Role description' })
  description?: string;

  @ApiProperty({ description: 'Role hierarchy level' })
  level: number;

  @ApiProperty({ description: 'Whether the role is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Role creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
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
  @ApiProperty({ description: 'Permissions assigned to this role', type: () => [PermissionDto] })
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
  @ApiProperty({ description: 'Permission ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Permission code' })
  code: string;

  @ApiProperty({ description: 'Resource that the permission applies to' })
  resource: string;

  @ApiProperty({ description: 'Action allowed by this permission' })
  action: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  description?: string;

  constructor(partial: Partial<PermissionDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Pagination metadata DTO
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrevPage: boolean;
}

/**
 * Paginated result wrapper
 */
export class PaginatedResultDto<T> {
  @ApiProperty({ description: 'Array of data items', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
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
  @ApiProperty({ description: 'Response message' })
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
