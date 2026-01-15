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
  @Get()
  async list(@Query() query: ListUsersDto): Promise<PaginatedResultDto<UserResponseDto>> {
    this.logger.log('Listing users');
    return this.userAdminService.listUsers(query);
  }

  /**
   * Get user by ID
   * GET /admin/users/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    this.logger.log(`Getting user ${id}`);
    return this.userAdminService.getUserById(id);
  }

  /**
   * Create a new user
   * POST /admin/users
   */
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
