import { Controller, Get, Param, UseGuards, Logger, ParseUUIDPipe } from '@nestjs/common';
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
  @Get()
  async list(): Promise<RoleResponseDto[]> {
    this.logger.log('Listing roles');
    return this.roleService.listRoles();
  }

  /**
   * Get role by ID
   * GET /admin/roles/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    this.logger.log(`Getting role ${id}`);
    return this.roleService.getRoleById(id);
  }

  /**
   * Get role with permissions
   * GET /admin/roles/:id/permissions
   */
  @Get(':id/permissions')
  async getWithPermissions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoleWithPermissionsDto> {
    this.logger.log(`Getting role ${id} with permissions`);
    return this.roleService.getRoleWithPermissions(id);
  }
}
