import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { PermissionGuard } from '../auth/guards';
import { RequireRole } from '../auth/decorators';
import { RoleService } from './role.service';
import {
  RoleResponseDto,
  RoleWithPermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
  AddPermissionDto,
  MessageResponseDto,
} from './dto';

/**
 * Controller for role management
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-061
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequireRole('ADMIN')
export class RoleController {
  private readonly logger = new Logger(RoleController.name);

  constructor(private readonly roleService: RoleService) {}

  /**
   * List all roles
   * GET /admin/roles
   */
  @ApiOperation({ summary: 'List all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles', type: [RoleResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @Get()
  async list(): Promise<RoleResponseDto[]> {
    this.logger.log('Listing roles');
    return this.roleService.listRoles();
  }

  /**
   * Create a new role
   * POST /admin/roles
   */
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created', type: RoleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 409, description: 'Role code already exists' })
  @Post()
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    this.logger.log(`Creating role: ${dto.code}`);
    return this.roleService.createRole(dto);
  }

  /**
   * Get role by ID
   * GET /admin/roles/:id
   */
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role details', type: RoleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    this.logger.log(`Getting role ${id}`);
    return this.roleService.getRoleById(id);
  }

  /**
   * Update a role
   * PATCH /admin/roles/:id
   */
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated', type: RoleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    this.logger.log(`Updating role ${id}`);
    return this.roleService.updateRole(id, dto);
  }

  /**
   * Delete a role
   * DELETE /admin/roles/:id
   */
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', description: 'Role ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role deleted', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role has assigned users' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<MessageResponseDto> {
    this.logger.log(`Deleting role ${id}`);
    await this.roleService.deleteRole(id);
    return new MessageResponseDto('Role deleted successfully');
  }

  /**
   * Get role with permissions
   * GET /admin/roles/:id/permissions
   */
  @ApiOperation({ summary: 'Get role with permissions' })
  @ApiParam({ name: 'id', description: 'Role ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role with permissions', type: RoleWithPermissionsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Get(':id/permissions')
  async getWithPermissions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoleWithPermissionsDto> {
    this.logger.log(`Getting role ${id} with permissions`);
    return this.roleService.getRoleWithPermissions(id);
  }

  /**
   * Add permission to a role
   * POST /admin/roles/:id/permissions
   */
  @ApiOperation({ summary: 'Add permission to a role' })
  @ApiParam({ name: 'id', description: 'Role ID', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Permission added', type: RoleWithPermissionsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  @ApiResponse({ status: 409, description: 'Role already has this permission' })
  @Post(':id/permissions')
  async addPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPermissionDto,
  ): Promise<RoleWithPermissionsDto> {
    this.logger.log(`Adding permission ${dto.permissionId} to role ${id}`);
    return this.roleService.addPermission(id, dto.permissionId);
  }

  /**
   * Remove permission from a role
   * DELETE /admin/roles/:id/permissions/:permId
   */
  @ApiOperation({ summary: 'Remove permission from a role' })
  @ApiParam({ name: 'id', description: 'Role ID', format: 'uuid' })
  @ApiParam({ name: 'permId', description: 'Permission ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission removed', type: RoleWithPermissionsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  @Delete(':id/permissions/:permId')
  @HttpCode(HttpStatus.OK)
  async removePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permId', ParseUUIDPipe) permId: string,
  ): Promise<RoleWithPermissionsDto> {
    this.logger.log(`Removing permission ${permId} from role ${id}`);
    return this.roleService.removePermission(id, permId);
  }
}
