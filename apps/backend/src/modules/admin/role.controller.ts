import { Controller, Get, Param, UseGuards, Logger, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { PermissionGuard } from '../auth/guards';
import { RequireRole } from '../auth/decorators';
import { RoleService } from './role.service';
import { RoleResponseDto, RoleWithPermissionsDto } from './dto';

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
}
