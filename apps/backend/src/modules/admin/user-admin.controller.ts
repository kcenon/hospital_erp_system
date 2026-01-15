import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { PermissionGuard } from '../auth/guards';
import { RequireRole } from '../auth/decorators';
import { AuthenticatedUser } from '../auth/interfaces';
import { UserAdminService } from './user-admin.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUsersDto,
  AssignRoleDto,
  UserResponseDto,
  CreateUserResponseDto,
  ResetPasswordResponseDto,
  PaginatedResultDto,
  MessageResponseDto,
} from './dto';

/**
 * Controller for user administration
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-060~061
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequireRole('ADMIN')
export class UserAdminController {
  private readonly logger = new Logger(UserAdminController.name);

  constructor(private readonly userAdminService: UserAdminService) {}

  /**
   * List all users with pagination and filters
   * GET /admin/users
   */
  @ApiOperation({ summary: 'List all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of users', type: PaginatedResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @Get()
  async list(@Query() query: ListUsersDto): Promise<PaginatedResultDto<UserResponseDto>> {
    this.logger.log('Listing users');
    return this.userAdminService.listUsers(query);
  }

  /**
   * Get user by ID
   * GET /admin/users/:id
   */
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User details', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    this.logger.log(`Getting user ${id}`);
    return this.userAdminService.getUserById(id);
  }

  /**
   * Create a new user
   * POST /admin/users
   */
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: CreateUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 409, description: 'Username or employee ID already exists' })
  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<CreateUserResponseDto> {
    this.logger.log(`Creating user ${dto.username} by admin ${admin.id}`);
    return this.userAdminService.createUser(dto, admin.id);
  }

  /**
   * Update user
   * PATCH /admin/users/:id
   */
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user ${id} by admin ${admin.id}`);
    return this.userAdminService.updateUser(id, dto, admin.id);
  }

  /**
   * Deactivate user
   * DELETE /admin/users/:id
   */
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<void> {
    this.logger.log(`Deactivating user ${id} by admin ${admin.id}`);
    await this.userAdminService.deactivateUser(id, admin.id);
  }

  /**
   * Reset user password
   * POST /admin/users/:id/reset-password
   */
  @ApiOperation({ summary: 'Reset user password' })
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log(`Resetting password for user ${id} by admin ${admin.id}`);
    return this.userAdminService.resetPassword(id, admin.id);
  }

  /**
   * Assign role to user
   * POST /admin/users/:id/roles
   */
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid role ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 409, description: 'Role already assigned to user' })
  @Post(':id/roles')
  @HttpCode(HttpStatus.CREATED)
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    this.logger.log(`Assigning role ${dto.roleId} to user ${id} by admin ${admin.id}`);
    await this.userAdminService.assignRole(id, dto.roleId, admin.id);
    return new MessageResponseDto('Role assigned successfully');
  }

  /**
   * Remove role from user
   * DELETE /admin/users/:id/roles/:roleId
   */
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiParam({ name: 'roleId', description: 'Role ID to remove', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Role removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'User or role assignment not found' })
  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<void> {
    this.logger.log(`Removing role ${roleId} from user ${id} by admin ${admin.id}`);
    await this.userAdminService.removeRole(id, roleId, admin.id);
  }
}
